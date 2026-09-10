import { collection, doc, getDocs, query, orderBy, limit, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config';
import { calculateReceipt, validateReceipt } from '../lib/receipt';
import { validateDocument } from '../lib/media';

export const listReceipts = async () => (await getDocs(query(collection(db, 'receipts'), orderBy('updatedAt', 'desc'), limit(200)))).docs.map(d => ({ id: d.id, ...d.data() }));

function checkVersion(snapshot, expected) {
  if (snapshot.exists() && snapshot.data().version !== expected) throw new Error('เอกสารเปลี่ยนจากหน้าต่างอื่น กรุณาโหลดใหม่');
  if (!snapshot.exists() && expected !== 0) throw new Error('ไม่พบเอกสารเดิม กรุณาโหลดใหม่');
}

export async function saveReceipt(id, receipt, expected = 0) {
  const totals = calculateReceipt(receipt);
  validateDocument({ receipt, totals });
  const ref = id ? doc(db, 'receipts', id) : doc(collection(db, 'receipts'));
  await runTransaction(db, async tx => {
    const current = await tx.get(ref);
    checkVersion(current, expected);
    if (current.exists() && current.data().status !== 'draft') throw new Error('ใบเสร็จที่ออกแล้วแก้ไขไม่ได้ กรุณาทำสำเนา');
    tx.set(ref, {
      receipt, totals,
      createdAt: current.data()?.createdAt || serverTimestamp(),
      createdBy: current.data()?.createdBy || auth.currentUser.uid,
      status: 'draft', version: expected + 1,
      updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid,
    });
  });
  return ref.id;
}

export async function issueReceipt(id, expected) {
  await runTransaction(db, async tx => {
    const ref = doc(db, 'receipts', id);
    const current = await tx.get(ref);
    checkVersion(current, expected);
    const data = current.data();
    if (data.status !== 'draft') throw new Error('เอกสารนี้ไม่ใช่ฉบับร่าง');
    const receipt = { ...data.receipt, number: data.receipt.number.trim().toUpperCase() };
    const totals = validateReceipt(receipt);
    const numberRef = doc(db, 'receiptNumbers', receipt.number);
    const number = await tx.get(numberRef);
    if (number.exists() && number.data().receiptId !== id) throw new Error('เลขใบเสร็จนี้ถูกใช้แล้ว');
    tx.set(numberRef, { receiptId: id });
    tx.update(ref, { receipt, totals, status: 'issued', version: expected + 1, issuedAt: serverTimestamp(), issuedBy: auth.currentUser.uid, updatedAt: serverTimestamp() });
  });
}
