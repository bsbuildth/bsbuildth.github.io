import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

const maxSourceBytes = 12 * 1024 * 1024;
const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export const appsScriptSurveyUrl = import.meta.env.VITE_SITE_SURVEY_APPS_SCRIPT_URL || '';
export const usesFreeDriveBridge = Boolean(appsScriptSurveyUrl);

export function validateSitePhotos(files) {
  const list = Array.from(files || []);
  if (!list.length) throw new Error('เลือกรูปอย่างน้อย 1 รูป');
  if (list.length > (usesFreeDriveBridge ? 5 : 20)) throw new Error(`โหมด Drive ฟรีเลือกรูปได้ไม่เกิน ${usesFreeDriveBridge ? 5 : 20} รูปต่อครั้ง`);
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
    projectId: String(project.id), projectName: project.title || 'โครงการไม่มีชื่อ', projectSource: project.source || 'website', quoteId: project.quoteId || '', quoteNumber: project.quoteNumber || '', updateDate,
    note: String(note || '').trim().slice(0, 2000), status: 'uploading', operationId, expectedPhotoCount: 0,
    photos: [], driveFolderId: '', driveUrl: '', createdBy: auth.currentUser?.uid || '',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return { id: ref.id, operationId };
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error(`อ่านไฟล์ ${file.name} ไม่สำเร็จ`));
    reader.readAsDataURL(file);
  });
}

async function waitForDrivePhoto(updateId, expectedCount) {
  const started = Date.now();
  while (Date.now() - started < 90000) {
    const snapshot = await getDoc(doc(db, 'siteUpdates', updateId));
    const data = snapshot.data() || {};
    if (data.status === 'failed') throw new Error(data.lastError || 'ส่งรูปเข้า Drive ไม่สำเร็จ');
    if ((data.photos || []).length >= expectedCount) return data;
    await new Promise(resolve => setTimeout(resolve, 1200));
  }
  throw new Error('Drive ใช้เวลานานกว่าปกติ กรุณากดรีเฟรชเพื่อตรวจสอบผล');
}

// Apps Script cannot reliably answer browser CORS preflight requests.  A plain-text
// no-cors request is intentional: the script records the confirmed result in Firestore,
// which we then read back using the signed-in Firebase session.
export async function uploadSiteUpdateWithFreeDrive(update, files, onProgress = () => {}) {
  if (!appsScriptSurveyUrl) throw new Error('ยังไม่ได้ตั้งค่า Google Apps Script สำหรับ Drive ฟรี');
  const selected = validateSitePhotos(files);
  if (selected.some(file => file.size > 8 * 1024 * 1024)) throw new Error('โหมด Drive ฟรีรองรับรูปละไม่เกิน 8 MB');
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบใหม่ก่อนส่งรูป');
  await updateDoc(doc(db, 'siteUpdates', update.id), { expectedPhotoCount: selected.length, updatedAt: serverTimestamp() });
  for (let index = 0; index < selected.length; index += 1) {
    const file = selected[index];
    onProgress(index, selected.length);
    const payload = {
      action: 'upload', updateId: update.id, operationId: update.operationId, token,
      total: selected.length, order: index + 1, photoId: crypto.randomUUID(),
      name: file.name, mimeType: file.type, bytes: file.size, contentBase64: await toBase64(file),
    };
    await fetch(appsScriptSurveyUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    await waitForDrivePhoto(update.id, index + 1);
    onProgress(index + 1, selected.length);
  }
  const current = await waitForDrivePhoto(update.id, selected.length);
  return { photos: current.photos || [], folderId: current.driveFolderId || '', driveUrl: current.driveUrl || '' };
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
