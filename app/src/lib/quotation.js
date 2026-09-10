const MAX = 100_000_000_000n;
export const newItem = () => ({ id: crypto.randomUUID(), description: '', quantity: '1', unit: 'งาน', price: '0.00', free: false, included: true });
export function newQuote() {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return { schemaVersion: 3, number: '', date, customer: '', phone: '', project: '', seller: 'BSBuildTh', sellerPhone: '', sellerAddress: '', sellerTaxId: '', sellerWebsite: '', salesperson: '', vatRate: '7',
    sections: [{ id: crypto.randomUUID(), title: 'งานหลัก', kind: 'main', items: [newItem()] }],
    terms: '', warranty: '', paymentBase: 'main', installments: [
      { label: 'งวดที่ 1', percent: '40', condition: 'ก่อนเริ่มงาน' },
      { label: 'งวดที่ 2', percent: '40', condition: 'ตามความคืบหน้าที่ตกลง' },
      { label: 'งวดที่ 3', percent: '20', condition: 'ส่งมอบงาน' }], status: 'draft' };
}
function decimal(value, places) {
  const text = String(value);
  if (!new RegExp(`^\\d{1,9}(?:\\.\\d{1,${places}})?$`).test(text)) throw new Error('จำนวนและราคาต้องเป็นเลขไม่ติดลบในรูปแบบที่ถูกต้อง');
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * (10n ** BigInt(places)) + BigInt(fraction.padEnd(places, '0'));
}
const bounded = n => { if (n > MAX) throw new Error('ยอดเงินเกินขอบเขตที่รองรับ'); return Number(n); };
export function calculateQuote(q) {
  if (!['main', 'total'].includes(q.paymentBase)) throw new Error('กรุณาเลือกฐานงวดชำระ');
  let main = 0n, optional = 0n;
  const sections = q.sections.map(section => {
    if (!['main', 'optional'].includes(section.kind)) throw new Error('ประเภทหมวดงานไม่ถูกต้อง');
    const items = section.items.map(item => {
      const quantity = decimal(item.quantity, 3);
      if (quantity === 0n) throw new Error('จำนวนต้องมากกว่า 0');
      const unitPrice = decimal(item.price, 2);
      const reference = (quantity * unitPrice + 500n) / 1000n;
      const amount = item.free || !item.included ? 0n : reference;
      if (section.kind === 'main') main += amount; else optional += amount;
      return { ...item, unitPrice: bounded(unitPrice), amount: bounded(amount), reference: bounded(reference) };
    });
    return { ...section, items };
  });
  const total = main + optional;
  bounded(total);
  const vatPercent = decimal(q.vatRate ?? '0', 2);
  if (vatPercent > 10000n) throw new Error('ภาษีมูลค่าเพิ่มต้องอยู่ระหว่าง 0–100%');
  const vat = vatPercent === 0n ? 0n : (total * vatPercent + (10000n + vatPercent) / 2n) / (10000n + vatPercent);
  const beforeVat = total - vat;
  const base = q.paymentBase === 'main' ? main : total;
  const percentages = q.installments.map(i => decimal(i.percent, 2));
  if (!percentages.length || percentages.some(p => p <= 0n) || percentages.reduce((a,b) => a+b, 0n) !== 10000n) throw new Error('งวดชำระต้องรวม 100% และทุกงวดต้องมากกว่า 0');
  let used = 0n;
  const installments = q.installments.map((item, i) => {
    const amount = i === percentages.length - 1 ? base - used : (base * percentages[i] + 5000n) / 10000n;
    if (amount < 0n) throw new Error('จำนวนงวดมากเกินไปสำหรับยอดเงินนี้');
    used += amount;
    return { ...item, amount: bounded(amount) };
  });
  return { sections, main: bounded(main), optional: bounded(optional), vatRate: bounded(vatPercent), vat: bounded(vat), beforeVat: bounded(beforeVat), total: bounded(total), base: bounded(base), installments };
}
export const money = satang => (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function validateIssue(q) {
  for (const key of ['number', 'date', 'customer', 'phone', 'project', 'seller', 'sellerPhone']) {
    if (!String(q[key] || '').trim()) throw new Error('กรุณากรอกข้อมูลเอกสาร ลูกค้า โครงการ และผู้เสนอราคาให้ครบ');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q.date) || Number.isNaN(Date.parse(q.date)) || new Date(q.date).toISOString().slice(0,10) !== q.date) throw new Error('วันที่ไม่ถูกต้อง');
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/.test(q.number)) throw new Error('เลขเอกสารใช้ตัวอักษรอังกฤษ ตัวเลข - และ _ ไม่เกิน 50 ตัว');
  if (!q.sections.length || q.sections.length > 30) throw new Error('ต้องมีหมวดงาน 1–30 หมวด');
  if (q.sections.reduce((n,s) => n+s.items.length,0) > 200) throw new Error('รองรับไม่เกิน 200 รายการ');
  for (const section of q.sections) {
    if (!section.title.trim() || !section.items.length) throw new Error('กรุณาระบุชื่อหมวดและรายการงาน');
    for (const item of section.items) if (!item.description.trim() || !item.unit.trim()) throw new Error('กรุณาระบุรายละเอียดและหน่วยของทุกรายการ');
  }
  return calculateQuote(q);
}
export function demoQuote() {
  const q = newQuote();
  q.number = 'DEMO-03'; q.customer = 'ลูกค้าตัวอย่าง'; q.phone = '000-000-0000'; q.sellerPhone = '000-000-0000'; q.project = 'ตัวอย่างงานปรับปรุงห้องครัว';
  const rows = (values) => values.map(([description, quantity, price, unit = 'งาน', free = false]) => ({ ...newItem(), description, quantity, price, unit, free }));
  q.sections = [
    { id: 'main', title: 'งานหลัก', kind: 'main', items: rows([
      ['เคาน์เตอร์ครัว','1','6750'], ['กระเบื้องเคาน์เตอร์','7.6','800','ตร.ม.'], ['ผนังครัว','13.1','800','ตร.ม.'], ['ท็อปเคาน์เตอร์','1','9000','ชุด'], ['จุดดูดควัน','1','900','จุด'], ['ปลั๊กไฟ','2','900','จุด'], ['พื้นครัว','25','800','ตร.ม.']]) },
    { id: 'optional', title: 'อุปกรณ์เพิ่มเติม (ประมาณการ)', kind: 'optional', items: rows([
      ['บานตู้','3','3000','ชุด'], ['ลิ้นชัก','2','2000','ช่อง'], ['ตู้แขวนคู่','3','4500','ชุด'], ['ตู้แขวนเดี่ยว','1','3000','ชุด'], ['เตาและเครื่องดูดควัน','1','15000','ชุด'], ['ติดตั้งอุปกรณ์แถมฟรี','1','4500','งาน',true]]) }
  ];
  q.terms = 'อุปกรณ์เพิ่มเติมเป็นราคาประมาณการ ลูกค้าสามารถเลือกจัดหาเองได้';
  return q;
}
