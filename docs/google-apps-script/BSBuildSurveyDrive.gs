/**
 * BS Build — ฟรี Drive bridge สำหรับรูปสำรวจหน้างาน
 *
 * Deploy เป็น Web app: Execute as Me / Who has access: Anyone
 * ข้อมูลที่ตั้งใน Project Settings > Script properties:
 * FIREBASE_PROJECT_ID, FIREBASE_WEB_API_KEY, DRIVE_ROOT_FOLDER_ID, ALLOWED_EMAILS
 */

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_BYTES = 8 * 1024 * 1024;
// The deploy helper fills only the first two values from the existing public web config.
// Script properties always take priority and keep this checked-in file free of account data.
const CONFIG_DEFAULTS = { FIREBASE_PROJECT_ID: '', FIREBASE_WEB_API_KEY: '', ALLOWED_EMAILS: 'bsbuildth@gmail.com,songyos2528@gmail.com' };

function settings_(input) {
  const values = { ...CONFIG_DEFAULTS, ...PropertiesService.getScriptProperties().getProperties() };
  values.FIREBASE_PROJECT_ID = values.FIREBASE_PROJECT_ID || String((input || {}).firebaseProjectId || '');
  values.FIREBASE_WEB_API_KEY = values.FIREBASE_WEB_API_KEY || String((input || {}).firebaseApiKey || '');
  ['FIREBASE_PROJECT_ID', 'FIREBASE_WEB_API_KEY', 'ALLOWED_EMAILS'].forEach(key => {
    if (!values[key]) throw new Error(`ยังไม่ได้ตั้งค่า ${key}`);
  });
  if (!values.DRIVE_ROOT_FOLDER_ID) {
    const root = DriveApp.getRootFolder().createFolder('BS BUILD - รูปสำรวจหน้างาน');
    values.DRIVE_ROOT_FOLDER_ID = root.getId();
    PropertiesService.getScriptProperties().setProperty('DRIVE_ROOT_FOLDER_ID', values.DRIVE_ROOT_FOLDER_ID);
  }
  return values;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function verify_(idToken, config) {
  if (!idToken) throw new Error('ไม่พบสิทธิ์ผู้ใช้');
  const response = UrlFetchApp.fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(config.FIREBASE_WEB_API_KEY)}`, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ idToken }),
  });
  if (response.getResponseCode() !== 200) throw new Error('สิทธิ์ Firebase ไม่ถูกต้องหรือหมดอายุ');
  const account = (JSON.parse(response.getContentText()).users || [])[0];
  const allowed = config.ALLOWED_EMAILS.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
  if (!account || !allowed.includes(String(account.email || '').toLowerCase())) throw new Error('บัญชีนี้ไม่มีสิทธิ์ส่งรูปหน้างาน');
  return account;
}

function safe_(value, fallback) {
  const output = String(value || fallback).replace(/[\\/:*?"<>|#%{}~]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 100);
  return output || fallback;
}

function firestoreUrl_(config, id, collection) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.FIREBASE_PROJECT_ID)}/databases/(default)/documents/${collection || 'siteUpdates'}/${encodeURIComponent(id)}`;
}

function firestoreRequest_(url, options) {
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` }, ...options });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) throw new Error(`บันทึกข้อมูลไม่สำเร็จ (${response.getResponseCode()})`);
  return JSON.parse(response.getContentText());
}

function unpack_(fields) {
  const value = fields || {};
  const text = key => String(value[key] && value[key].stringValue || '');
  const number = key => Number(value[key] && (value[key].integerValue || value[key].doubleValue) || 0);
  const array = key => (((value[key] || {}).arrayValue || {}).values || []).map(item => {
    const map = (item.mapValue || {}).fields || {};
    return Object.keys(map).reduce((out, field) => { out[field] = map[field].stringValue || map[field].integerValue || map[field].doubleValue || ''; return out; }, {});
  });
  return { projectName: text('projectName'), updateDate: text('updateDate') || text('surveyDate'), operationId: text('operationId'), driveFolderId: text('driveFolderId'), expectedPhotoCount: number('expectedPhotoCount'), photos: array('photos') };
}

function value_(input) {
  if (Array.isArray(input)) return { arrayValue: { values: input.map(value_) } };
  if (input && typeof input === 'object') return { mapValue: { fields: Object.keys(input).reduce((out, key) => { out[key] = value_(input[key]); return out; }, {}) } };
  if (typeof input === 'number') return { integerValue: String(input) };
  return { stringValue: String(input || '') };
}

function patch_(config, updateId, fields, collection) {
  const mask = Object.keys(fields).map(name => `updateMask.fieldPaths=${encodeURIComponent(name)}`).join('&');
  return firestoreRequest_(`${firestoreUrl_(config, updateId, collection)}?${mask}`, { method: 'patch', contentType: 'application/json', payload: JSON.stringify({ fields: Object.keys(fields).reduce((out, key) => { out[key] = value_(fields[key]); return out; }, {}) }) });
}

function folder_(parent, name) {
  const existing = parent.getFoldersByName(name);
  return existing.hasNext() ? existing.next() : parent.createFolder(name);
}

function targetFolder_(config, update) {
  const root = DriveApp.getFolderById(config.DRIVE_ROOT_FOLDER_ID);
  const project = folder_(root, safe_(update.projectName, 'โครงการไม่มีชื่อ'));
  const month = folder_(project, String(update.updateDate || 'ไม่ระบุเดือน').slice(0, 7));
  return folder_(month, safe_(update.updateDate, 'ไม่ระบุวันที่'));
}

function doPost(event) {
  let payload = {};
  try {
    payload = JSON.parse(event.postData.contents || '{}');
    const config = settings_(payload);
    verify_(payload.token, config);
    if (!['upload', 'surveyUpload'].includes(payload.action)) throw new Error('คำสั่งไม่ถูกต้อง');
    const collection = payload.action === 'surveyUpload' ? 'siteSurveys' : 'siteUpdates';
    const documentId = payload.surveyId || payload.updateId;
    if (!documentId || !payload.photoId || !payload.contentBase64) throw new Error('ข้อมูลรูปไม่ครบ');
    if (!IMAGE_TYPES.includes(payload.mimeType)) throw new Error('รองรับเฉพาะ JPG, PNG, WebP และ HEIC');
    if (Number(payload.bytes) > MAX_BYTES) throw new Error('รูปมีขนาดเกิน 8 MB');

    const document = firestoreRequest_(firestoreUrl_(config, documentId, collection), { method: 'get' });
    const update = unpack_(document.fields);
    if (!update.operationId || update.operationId !== payload.operationId) throw new Error('รายการอัปโหลดไม่ถูกต้อง');
    if (update.photos.some(photo => photo.id === payload.photoId)) return json_({ ok: true, duplicate: true });

    const folder = update.driveFolderId ? DriveApp.getFolderById(update.driveFolderId) : targetFolder_(config, update);
    const raw = Utilities.base64Decode(payload.contentBase64);
    const blob = Utilities.newBlob(raw, payload.mimeType, safe_(payload.name, `photo-${payload.order}.jpg`));
    const file = folder.createFile(blob);
    const photo = { id: payload.photoId, measurementId: String(payload.measurementId || ''), name: safe_(payload.name, `รูปที่ ${payload.order}`), caption: '', order: Number(payload.order), driveFileId: file.getId(), driveUrl: file.getUrl(), syncStatus: 'done' };
    const photos = update.photos.concat([photo]);
    patch_(config, documentId, {
      photos, driveFolderId: folder.getId(), driveUrl: folder.getUrl(),
      ...(collection === 'siteSurveys' ? { photoStatus: photos.length >= Number(payload.total) ? 'saved' : 'uploading' } : { status: photos.length >= Number(payload.total) ? 'saved' : 'uploading' }), lastError: '',
    }, collection);
    return json_({ ok: true });
  } catch (error) {
    // If the update id is trustworthy enough to be present, surface the error in the app.
    try { const id = payload.surveyId || payload.updateId; if (id) patch_(settings_(payload), id, payload.action === 'surveyUpload' ? { photoStatus: 'failed', lastError: String(error.message || error).slice(0, 500) } : { status: 'failed', lastError: String(error.message || error).slice(0, 500) }, payload.action === 'surveyUpload' ? 'siteSurveys' : 'siteUpdates'); } catch (ignored) {}
    return json_({ ok: false, message: String(error.message || error) });
  }
}
