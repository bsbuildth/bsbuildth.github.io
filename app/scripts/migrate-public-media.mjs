// Dry run by default. Back up Firestore before --apply. Never touches contacts/quotations.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'node:crypto';
const [projectId, bucketName, mode] = process.argv.slice(2);
if (!projectId || !bucketName) throw new Error('Usage: node scripts/migrate-public-media.mjs PROJECT BUCKET [--apply]');
initializeApp({ credential: applicationDefault(), projectId, storageBucket: bucketName });
const db=getFirestore(), bucket=getStorage().bucket();
let files=0, documents=0;
async function convert(value) {
 if (typeof value === 'string' && /^data:(image\/(jpeg|png|webp)|video\/mp4);base64,/.test(value)) {
  const [header,encoded]=value.split(','); const contentType=header.slice(5,header.indexOf(';'));
  const bytes=Buffer.from(encoded,'base64');
  if (bytes.length > 24*1024*1024) throw new Error('Media exceeds 24 MB; compress before migrating');
  files++;
  if(mode !== '--apply') return value;
  const name=`website/${randomUUID()}`, token=randomUUID();
  await bucket.file(name).save(bytes,{metadata:{contentType,metadata:{firebaseStorageDownloadTokens:token}}});
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(name)}?alt=media&token=${token}`;
 }
 if(Array.isArray(value)) return Promise.all(value.map(convert));
 if(value && Object.getPrototypeOf(value) === Object.prototype) {
  const entries=await Promise.all(Object.entries(value).map(async ([key,v])=>[key,await convert(v)]));
  return Object.fromEntries(entries);
 }
 return value;
}
for(const col of ['projects','articles','images','content','references','calculator_types']) {
 for(const snapshot of (await db.collection(col).get()).docs) {
  const before=files, data=await convert(snapshot.data());
  if(files>before){documents++;if(mode==='--apply') await snapshot.ref.update(data,{lastUpdateTime:snapshot.updateTime});}
 }
}
console.log({mode:mode==='--apply'?'applied':'dry-run',files,documents});
