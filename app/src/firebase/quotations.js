import { collection, doc, getDocs, query, orderBy, limit, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config';
import { validateDocument } from '../lib/media';
import { validateIssue } from '../lib/quotation';

export const listQuotes = async () => (await getDocs(query(collection(db, 'quotations'), orderBy('updatedAt', 'desc'), limit(200)))).docs.map(d => ({ id: d.id, ...d.data() }));
export const listRevisions = async id => (await getDocs(query(collection(db, 'quotations', id, 'revisions'), orderBy('revision', 'desc')))).docs.map(d => ({ id: d.id, ...d.data() }));
function checkVersion(snapshot, expected) {
  if (snapshot.exists() && snapshot.data().version !== expected) throw new Error('เอกสารเปลี่ยนจากหน้าต่างอื่น กรุณาโหลดใหม่ก่อนแก้ไข');
  if (!snapshot.exists() && expected !== 0) throw new Error('ไม่พบเอกสารเดิม กรุณาโหลดใหม่');
}
export async function saveQuote(id, quote, expected = 0) {
  validateDocument(quote);
  const ref = id ? doc(db, 'quotations', id) : doc(collection(db, 'quotations'));
  await runTransaction(db, async tx => {
    const current = await tx.get(ref);
    checkVersion(current, expected);
    if (current.exists() && current.data().status !== 'draft') throw new Error('เอกสารออกแล้ว กรุณาสร้างฉบับแก้ไข');
    tx.set(ref, { quote, reason: current.data()?.reason || '', createdAt: current.data()?.createdAt || serverTimestamp(), createdBy: current.data()?.createdBy || auth.currentUser.uid, status: 'draft', version: expected + 1, revision: current.data()?.revision || 0, updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid });
  });
  return ref.id;
}
export async function issueQuote(id, expected) {
  await runTransaction(db, async tx => {
    const ref = doc(db, 'quotations', id);
    const current = await tx.get(ref);
    checkVersion(current, expected);
    const data = current.data();
    if (data.status !== 'draft') throw new Error('เอกสารนี้ไม่ใช่ฉบับร่าง');
    const quote = { ...data.quote, number: data.quote.number.trim().toUpperCase() };
    const totals = validateIssue(quote);
    const numberRef = doc(db, 'quotationNumbers', quote.number);
    const number = await tx.get(numberRef);
    if (number.exists() && number.data().quotationId !== id) throw new Error('เลขใบเสนอราคานี้ถูกใช้แล้ว');
    const revision = data.revision + 1;
    tx.set(numberRef, { quotationId: id });
    tx.set(doc(ref, 'revisions', String(revision)), { quote, totals, revision, reason: data.reason || 'ออกเอกสารครั้งแรก', issuedAt: serverTimestamp(), issuedBy: auth.currentUser.uid });
    tx.update(ref, { quote, status: 'issued', revision, version: expected + 1, updatedAt: serverTimestamp() });
  });
}
export async function changeQuoteStatus(id, expected, status, reason) {
  if (!['draft', 'void'].includes(status) || !reason.trim()) throw new Error('กรุณาระบุเหตุผล');
  await runTransaction(db, async tx => {
    const ref = doc(db, 'quotations', id); const current = await tx.get(ref);
    checkVersion(current, expected);
    if (current.data().status !== 'issued') throw new Error('เปลี่ยนสถานะได้เฉพาะเอกสารที่ออกแล้ว');
    tx.update(ref, { status, reason, version: expected + 1, updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid });
  });
}
