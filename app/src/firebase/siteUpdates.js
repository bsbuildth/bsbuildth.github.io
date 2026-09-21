import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

const maxSourceBytes = 12 * 1024 * 1024;
const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export function validateSitePhotos(files) {
  const list = Array.from(files || []);
  if (!list.length) throw new Error('เลือกรูปอย่างน้อย 1 รูป');
  if (list.length > 20) throw new Error('เลือกรูปได้ไม่เกิน 20 รูปต่อครั้ง');
  list.forEach(file => {
    if (!acceptedTypes.has(file.type)) throw new Error('รองรับ JPG, PNG, WebP และ HEIC');
    if (file.size > maxSourceBytes) throw new Error(`${file.name} มีขนาดเกิน 12 MB`);
  });
  return list;
}

export async function listSiteUpdates() {
  const snap = await getDocs(query(collection(db, 'siteUpdates'), orderBy('updateDate', 'desc'), limit(120)));
  return snap.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function listSiteUpdateProjects() {
  const snap = await getDocs(query(collection(db, 'siteUpdateProjects'), orderBy('title'), limit(250)));
  return snap.docs.map(item => ({ id: item.id, ...item.data(), source: 'site-update' }));
}

export async function createSiteUpdateProject(title) {
  const clean = String(title || '').trim().replace(/\s+/g, ' ').slice(0, 160);
  if (!clean) throw new Error('กรอกชื่อโครงการก่อนบันทึก');
  const ref = await addDoc(collection(db, 'siteUpdateProjects'), { title: clean, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return { id: ref.id, title: clean, source: 'site-update' };
}

export async function createSiteUpdate({ project, updateDate, note }) {
  const operationId = crypto.randomUUID();
  const ref = await addDoc(collection(db, 'siteUpdates'), {
    projectId: String(project.id), projectName: project.title || 'โครงการไม่มีชื่อ', projectSource: project.source || 'website', updateDate,
    note: String(note || '').trim().slice(0, 2000), status: 'uploading', operationId,
    photos: [], driveFolderId: '', driveUrl: '', createdBy: auth.currentUser?.uid || '',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return { id: ref.id, operationId };
}

export async function completeSiteUpdate(updateId, { photos, folderId, driveUrl }) {
  await updateDoc(doc(db, 'siteUpdates', updateId), { status: 'saved', photos, driveFolderId: folderId, driveUrl, previewExpiresAt: null, updatedAt: serverTimestamp() });
}

function canvasBlob(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / image.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('ย่อรูปไม่สำเร็จ')), 'image/webp', quality);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`เปิดรูป ${file.name} ไม่สำเร็จ`)); };
    image.src = url;
  });
}

export async function uploadSiteUpdatePhotos(updateId, files, onProgress = () => {}) {
  if (import.meta.env.VITE_USE_STORAGE !== 'true') throw new Error('ยังไม่ได้เปิดใช้ Firebase Storage สำหรับอัปโหลดรูป');
  const { getStorage, getDownloadURL, ref, uploadBytes } = await import('firebase/storage');
  const storage = getStorage(); const selected = validateSitePhotos(files); const photos = [];
  for (let index = 0; index < selected.length; index += 1) {
    const file = selected[index]; const key = crypto.randomUUID();
    const sourceRef = ref(storage, `site-updates/${updateId}/originals/${key}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
    const thumb = await canvasBlob(file, 480, .74);
    const thumbRef = ref(storage, `site-updates/${updateId}/previews/${key}.webp`);
    await uploadBytes(sourceRef, file, { contentType: file.type });
    await uploadBytes(thumbRef, thumb, { contentType: 'image/webp' });
    photos.push({ id: key, name: file.name, caption: '', order: index + 1, sourcePath: sourceRef.fullPath, thumbnailPath: thumbRef.fullPath, thumbnailUrl: await getDownloadURL(thumbRef), driveFileId: '', syncStatus: 'queued' });
    onProgress(index + 1, selected.length);
  }
  await updateDoc(doc(db, 'siteUpdates', updateId), { photos, previewExpiresAt: Timestamp.fromDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)), updatedAt: serverTimestamp() });
  return photos;
}

export async function requestDriveSync(updateId, operationId) {
  const endpoint = import.meta.env.VITE_DRIVE_BRIDGE_URL;
  if (!endpoint) throw new Error('ยังไม่ได้ตั้งบริการเชื่อม Google Drive');
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ updateId, operationId }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'ส่งรูปเข้า Google Drive ไม่สำเร็จ');
  await updateDoc(doc(db, 'siteUpdates', updateId), { status: 'saved', driveFolderId: payload.folderId || '', driveUrl: payload.driveUrl || '', updatedAt: serverTimestamp() });
  return payload;
}

export async function markSiteUpdateFailed(updateId, message) { await updateDoc(doc(db, 'siteUpdates', updateId), { status: 'failed', lastError: String(message).slice(0, 500), updatedAt: serverTimestamp() }); }
export async function archiveSiteUpdate(updateId) { await updateDoc(doc(db, 'siteUpdates', updateId), { status: 'archived', updatedAt: serverTimestamp() }); }
export async function deleteSiteUpdate(updateId) { await deleteDoc(doc(db, 'siteUpdates', updateId)); }
