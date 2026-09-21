const { Readable } = require('node:stream');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { google } = require('googleapis');

if (!getApps().length) initializeApp();
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 3 });

const db = getFirestore();
const bucket = getStorage().bucket();
const driveServiceAccount = 'firebase-adminsdk-fbsvc@bs-build.iam.gserviceaccount.com';
const allowedOrigins = new Set(['https://bsbuildth.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173']);

function sendCors(req, res) {
  const origin = req.get('origin');
  if (origin && allowedOrigins.has(origin)) res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function safeName(value, fallback) {
  const text = String(value || fallback).replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
  return (text || fallback).slice(0, 90);
}

function dateFolder(value) {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? value : new Date().toISOString().slice(0, 10);
  return `อัปเดต-${iso}`;
}

async function requireAdmin(req) {
  const match = String(req.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!match) throw Object.assign(new Error('กรุณาเข้าสู่ระบบผู้ดูแลอีกครั้ง'), { status: 401 });
  const token = await getAuth().verifyIdToken(match[1]);
  if (token.admin !== true) throw Object.assign(new Error('บัญชีนี้ไม่มีสิทธิ์อัปเดตรูปหน้างาน'), { status: 403 });
  return token;
}

function getDrive() {
  const rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) throw new Error('ยังไม่ได้ตั้งค่าโฟลเดอร์หลักของ Google Drive');
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/drive'] });
  return { drive: google.drive({ version: 'v3', auth }), rootFolderId };
}

async function findOrCreateFolder(drive, parentId, name) {
  const escaped = name.replace(/'/g, "\\'");
  const existing = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and name = '${escaped}' and trashed = false`,
    fields: 'files(id,webViewLink)', pageSize: 1, spaces: 'drive',
  });
  if (existing.data.files?.[0]) return existing.data.files[0];
  const created = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id,webViewLink',
  });
  return created.data;
}

async function makeTargetFolder(data) {
  const { drive, rootFolderId } = getDrive();
  const project = await findOrCreateFolder(drive, rootFolderId, safeName(data.projectName, 'โครงการไม่มีชื่อ'));
  const month = await findOrCreateFolder(drive, project.id, String(data.updateDate || '').slice(0, 7) || 'ไม่ระบุเดือน');
  const update = await findOrCreateFolder(drive, month.id, dateFolder(data.updateDate));
  return { drive, folder: update };
}

async function uploadToDrive(drive, parentId, updateId, photo) {
  const source = bucket.file(photo.sourcePath);
  const [exists] = await source.exists();
  if (!exists) throw new Error(`ไม่พบไฟล์ต้นฉบับ ${photo.name}`);
  const found = await drive.files.list({
    q: `'${parentId}' in parents and trashed = false and appProperties has { key='bsBuildPhotoId' and value='${photo.id}' }`,
    fields: 'files(id,webViewLink)', pageSize: 1, spaces: 'drive',
  });
  if (found.data.files?.[0]) return found.data.files[0];
  const [contents] = await source.download();
  const response = await drive.files.create({
    requestBody: { name: safeName(photo.name, `${photo.id}.jpg`), parents: [parentId], appProperties: { bsBuildPhotoId: photo.id, bsBuildUpdateId: String(updateId) } },
    media: { mimeType: 'application/octet-stream', body: Readable.from(contents) },
    fields: 'id,webViewLink',
  });
  return response.data;
}

exports.syncSiteUpdateToDrive = onRequest({ timeoutSeconds: 540, memory: '512MiB', serviceAccount: driveServiceAccount }, async (req, res) => {
  sendCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ message: 'ใช้ได้เฉพาะ POST' });
  try {
    await requireAdmin(req);
    const { updateId, operationId } = req.body || {};
    if (!updateId || !operationId) return res.status(400).json({ message: 'ข้อมูลการส่งรูปไม่ครบ' });
    const ref = db.collection('siteUpdates').doc(String(updateId));
    const snapshot = await ref.get();
    if (!snapshot.exists) return res.status(404).json({ message: 'ไม่พบรายการอัปเดต' });
    const data = snapshot.data();
    if (data.operationId !== operationId) return res.status(409).json({ message: 'รหัสการส่งรูปไม่ตรงกัน' });
    if (data.status === 'saved' && data.driveUrl) return res.json({ folderId: data.driveFolderId, driveUrl: data.driveUrl, reused: true });
    const { drive, folder } = await makeTargetFolder(data);
    let photos = Array.isArray(data.photos) ? data.photos : [];
    const replacePhoto = replacement => { photos = photos.map(photo => photo.id === replacement.id ? replacement : photo); };
    for (const photo of photos) {
      if (!photo.sourcePath && photo.driveFileId) continue;
      if (photo.driveFileId && photo.sourcePath) {
        await bucket.file(photo.sourcePath).delete({ ignoreNotFound: true });
        const completed = { ...photo, sourcePath: '', syncStatus: 'done' };
        replacePhoto(completed);
        await ref.update({ photos, updatedAt: FieldValue.serverTimestamp() });
        continue;
      }
      if (!photo.sourcePath) continue;
      const file = await uploadToDrive(drive, folder.id, updateId, photo);
      const uploaded = { ...photo, driveFileId: file.id || '', driveUrl: file.webViewLink || '', syncStatus: 'uploaded' };
      replacePhoto(uploaded);
      await ref.update({ status: 'uploading', photos, driveFolderId: folder.id, driveUrl: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`, updatedAt: FieldValue.serverTimestamp() });
      await bucket.file(photo.sourcePath).delete({ ignoreNotFound: true });
      const completed = { ...uploaded, sourcePath: '', syncStatus: 'done' };
      replacePhoto(completed);
      await ref.update({ photos, updatedAt: FieldValue.serverTimestamp() });
    }
    const driveUrl = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;
    await ref.update({ status: 'saved', photos, driveFolderId: folder.id, driveUrl, lastError: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
    return res.json({ folderId: folder.id, driveUrl });
  } catch (error) {
    console.error('syncSiteUpdateToDrive failed', error);
    return res.status(error.status || 500).json({ message: error.message || 'ส่งรูปเข้า Google Drive ไม่สำเร็จ' });
  }
});

exports.removeExpiredSiteUpdatePreviews = onSchedule({ schedule: '30 2 * * *', timeZone: 'Asia/Bangkok', timeoutSeconds: 540, serviceAccount: driveServiceAccount }, async () => {
  const expired = await db.collection('siteUpdates').where('previewExpiresAt', '<=', Timestamp.now()).limit(250).get();
  await Promise.all(expired.docs.map(async snapshot => {
    const data = snapshot.data();
    await Promise.all((data.photos || []).map(photo => photo.thumbnailPath ? bucket.file(photo.thumbnailPath).delete({ ignoreNotFound: true }) : Promise.resolve()));
    await snapshot.ref.update({
      photos: (data.photos || []).map(photo => ({ ...photo, thumbnailUrl: '', previewStatus: 'expired' })),
      previewExpiresAt: FieldValue.delete(), previewsExpiredAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
  }));
});
