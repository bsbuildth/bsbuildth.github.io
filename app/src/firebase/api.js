// Central data-access layer for the BS Build website, backed by Firestore.
// Every function returns data in the same shape the components already expect
// (id + flat fields) so the migration from the old REST API is drop-in.
import { db } from './config';
import {
  collection, getDocs, getDoc, doc, query, orderBy,
  addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';

const toArray = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// orderBy a field but tolerate docs missing it (Firestore drops them otherwise),
// so we sort client-side instead of failing the query.
const sortBy = (arr, key) =>
  [...arr].sort((a, b) => (Number(a[key] ?? 0)) - (Number(b[key] ?? 0)));

const isVisible = (v) => v === 1 || v === true;
// "shown" defaults to visible unless explicitly turned off (for collections
// whose existing docs may not have an is_visible field yet)
const shown = (v) => v !== 0 && v !== false;

// ─────────────────────────── PUBLIC READS ───────────────────────────
export async function getProjects() {
  return sortBy(toArray(await getDocs(collection(db, 'projects'))), 'sort_order').filter((p) => shown(p.is_visible));
}
export async function getAllProjects() {
  return sortBy(toArray(await getDocs(collection(db, 'projects'))), 'sort_order');
}

export async function getProject(id) {
  const d = await getDoc(doc(db, 'projects', String(id)));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

export async function getReviews() {
  return sortBy(toArray(await getDocs(collection(db, 'reviews'))), 'sort_order').filter((r) => isVisible(r.is_visible));
}

export async function getAllReviews() {
  return sortBy(toArray(await getDocs(collection(db, 'reviews'))), 'sort_order');
}

export async function getCalculatorTypes() {
  return sortBy(toArray(await getDocs(collection(db, 'calculator_types'))), 'sort_order').filter((c) => shown(c.is_visible));
}
export async function getAllCalculatorTypes() {
  return sortBy(toArray(await getDocs(collection(db, 'calculator_types'))), 'sort_order');
}

export async function getServices() {
  return sortBy(toArray(await getDocs(collection(db, 'services'))), 'sort_order').filter((s) => shown(s.is_visible));
}
export async function getAllServices() {
  return sortBy(toArray(await getDocs(collection(db, 'services'))), 'sort_order');
}

export async function getBusinessInfo() {
  const d = await getDoc(doc(db, 'business_info', 'main'));
  return d.exists() ? d.data() : {};
}

export async function getContentByKey(key) {
  const d = await getDoc(doc(db, 'content', key));
  if (!d.exists()) return {};
  const data = d.data();
  return shown(data.is_visible) ? data : {};
}

export async function getAllContent() {
  return toArray(await getDocs(collection(db, 'content')));
}

export async function getSettings() {
  // returns array of { setting_key, setting_value } to match old API
  return toArray(await getDocs(collection(db, 'settings')));
}

export async function getReferences() {
  return sortBy(toArray(await getDocs(collection(db, 'references'))), 'sort_order').filter((r) => isVisible(r.is_visible));
}

export async function getAllReferences() {
  return sortBy(toArray(await getDocs(collection(db, 'references'))), 'sort_order');
}

export async function getMenus() {
  return sortBy(toArray(await getDocs(collection(db, 'menus'))), 'sort_order');
}

export async function getImages(category) {
  const all = toArray(await getDocs(collection(db, 'images')));
  return category ? all.filter((i) => i.image_category === category) : all;
}

// ─────────────────────────── CONTACT FORM ───────────────────────────
export async function submitContact(data) {
  return addDoc(collection(db, 'contacts'), {
    name: data.name,
    contact_info: data.contactInfo,
    email: data.email || '',
    service_type: data.serviceType || '',
    message: data.message || '',
    created_at: serverTimestamp(),
  });
}

export async function getContacts() {
  const snap = await getDocs(query(collection(db, 'contacts'), orderBy('created_at', 'desc')));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      // created_at is a Firestore Timestamp; expose as ISO for the admin table
      created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
    };
  });
}

// ─────────────────────────── ADMIN CRUD ───────────────────────────
export const addItem = (col, data) => addDoc(collection(db, col), data);
export const updateItem = (col, id, data) => updateDoc(doc(db, col, String(id)), data);
export const deleteItem = (col, id) => deleteDoc(doc(db, col, String(id)));
export const setItem = (col, id, data) => setDoc(doc(db, col, String(id)), data, { merge: true });

// ─────────────────────────── IMAGE HELPERS ───────────────────────────
// Resize an image File client-side and return a JPEG data URL small enough to
// store directly in a Firestore document (< 1 MB). Used by the admin so new
// uploads work without any server. Non-image files are returned as-is via FileReader.
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fileToResizedDataURL(file, maxW = 1280, quality = 0.8) {
  // Videos / non-images: just return the raw data URL (caller should warn on size).
  if (!file.type.startsWith('image/')) return fileToDataURL(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
