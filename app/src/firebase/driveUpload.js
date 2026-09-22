const googleIdentityScript = 'https://accounts.google.com/gsi/client';
const driveScope = 'https://www.googleapis.com/auth/drive';

let scriptPromise;
function loadGoogleIdentity() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = googleIdentityScript; script.async = true; script.onload = resolve; script.onerror = () => reject(new Error('โหลด Google Drive ไม่สำเร็จ'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function requestGoogleDriveAccess() {
  const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;
  if (!clientId) throw new Error('ยังไม่ได้ตั้งค่าการเชื่อม Google Drive สำหรับโหมดไม่ผูกบัตร');
  await loadGoogleIdentity();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: driveScope,
      callback: response => response.error ? reject(new Error('ไม่อนุญาตให้เข้าถึง Google Drive')) : resolve(response.access_token),
    });
    client.requestAccessToken({ prompt: 'consent', login_hint: 'bsbuildth@gmail.com' });
  });
}

const safeName = (value, fallback) => (String(value || fallback).replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim() || fallback).slice(0, 90);
const escapeQuery = value => String(value).replace(/'/g, "\\'");

async function driveRequest(token, path, options = {}) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || 'ติดต่อ Google Drive ไม่สำเร็จ');
  return body;
}

async function findOrCreateFolder(token, parentId, name) {
  const query = `mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and name = '${escapeQuery(name)}' and trashed = false`;
  const found = await driveRequest(token, `files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent('files(id,webViewLink)')}&pageSize=1&spaces=drive`);
  if (found.files?.[0]) return found.files[0];
  return driveRequest(token, 'files?fields=id,webViewLink', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }) });
}

async function uploadFile(token, parentId, updateId, file, id) {
  const boundary = `bsbuild-${crypto.randomUUID()}`;
  const metadata = { name: safeName(file.name, `${id}.jpg`), parents: [parentId], appProperties: { bsBuildUpdateId: updateId, bsBuildPhotoId: id } };
  const body = new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`, file, `\r\n--${boundary}--`], { type: `multipart/related; boundary=${boundary}` });
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,thumbnailLink', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || `อัปโหลด ${file.name} ไม่สำเร็จ`);
  return result;
}

export async function uploadSiteUpdateDirectToDrive({ updateId, projectName, updateDate, files, token, onProgress = () => {} }) {
  const root = import.meta.env.VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!root) throw new Error('ยังไม่ได้ตั้งค่าโฟลเดอร์หลักของ Google Drive');
  const project = await findOrCreateFolder(token, root, safeName(projectName, 'โครงการไม่มีชื่อ'));
  const month = await findOrCreateFolder(token, project.id, String(updateDate || '').slice(0, 7) || 'ไม่ระบุเดือน');
  const folder = await findOrCreateFolder(token, month.id, `อัปเดต-${updateDate}`);
  const photos = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]; const id = crypto.randomUUID();
    const uploaded = await uploadFile(token, folder.id, updateId, file, id);
    photos.push({ id, name: file.name, caption: '', order: index + 1, sourcePath: '', thumbnailPath: '', thumbnailUrl: uploaded.thumbnailLink || '', driveFileId: uploaded.id || '', driveUrl: uploaded.webViewLink || '', syncStatus: 'done' });
    onProgress(index + 1, files.length);
  }
  return { photos, folderId: folder.id, driveUrl: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}` };
}

export async function trashDriveFolder(token, folderId) {
  if (!folderId) return;
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error?.message || 'ย้ายโฟลเดอร์รูปไปถังขยะ Google Drive ไม่สำเร็จ');
  }
}

function downscaleImage(blob, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob); const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / image.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', .78));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('อ่านรูปจาก Drive ไม่สำเร็จ')); };
    image.src = url;
  });
}

export async function loadDrivePhotoPreviews(token, photos) {
  const output = {};
  await Promise.all((photos || []).map(async photo => {
    if (!photo.driveFileId) return;
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(photo.driveFileId)}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('download failed');
      output[photo.id] = await downscaleImage(await response.blob());
    } catch { output[photo.id] = ''; }
  }));
  return output;
}
