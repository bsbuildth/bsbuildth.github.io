import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { validateDocument } from '../lib/media';

const COMPANY_KEYS = ['seller', 'sellerPhone', 'sellerAddress', 'sellerTaxId', 'sellerWebsite', 'salesperson', 'showLogo'];

export function applyCompanyDefaults(document, defaults = {}) {
  return COMPANY_KEYS.reduce((result, key) => (
    defaults[key] === undefined ? result : { ...result, [key]: defaults[key] }
  ), { ...document });
}

export async function getCompanyDefaults() {
  const snapshot = await getDoc(doc(db, 'documentSettings', 'company'));
  return snapshot.exists() ? snapshot.data() : {};
}

export async function saveCompanyDefaults(document) {
  const data = COMPANY_KEYS.reduce((result, key) => ({ ...result, [key]: document[key] ?? '' }), {});
  validateDocument(data);
  await setDoc(doc(db, 'documentSettings', 'company'), {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser.uid,
  }, { merge: true });
  return data;
}

export async function nextDocumentNumber(kind, date) {
  if (!['QT', 'RC'].includes(kind)) throw new Error('ประเภทเลขเอกสารไม่ถูกต้อง');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('กรุณาระบุวันที่ก่อนสร้างเลขเอกสาร');
  const period = date.slice(0, 7).replace('-', '');
  const counterRef = doc(db, 'documentCounters', `${kind}-${period}`);
  return runTransaction(db, async transaction => {
    const current = await transaction.get(counterRef);
    let sequence = Number(current.data()?.sequence || 0) + 1;
    let number = '';
    let attempts = 0;
    while (sequence <= 999999 && attempts < 50) {
      number = `${kind}-${period}-${String(sequence).padStart(3, '0')}`;
      const reservation = await transaction.get(doc(db, kind === 'QT' ? 'quotationNumbers' : 'receiptNumbers', number));
      if (!reservation.exists()) break;
      sequence += 1;
      attempts += 1;
    }
    if (!Number.isSafeInteger(sequence) || sequence < 1 || sequence > 999999 || attempts >= 50) throw new Error('สร้างเลขเอกสารไม่ได้ กรุณากรอกเลขเอกสารเอง');
    transaction.set(counterRef, {
      kind,
      period,
      sequence,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid,
    });
    return number;
  });
}
