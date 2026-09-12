const MAX_RECEIPT_TOTAL = 100_000_000_000n;

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const newReceiptItem = () => ({ id: crypto.randomUUID(), description: '', amount: '0.00' });

export function newReceipt(source) {
  const quote = source?.quote;
  const total = source?.totals?.total;
  return {
    schemaVersion: 2,
    number: '',
    date: today(),
    quoteNumber: quote?.number || '',
    paymentSchedule: structuredClone(source?.totals?.installments || []),
    paymentTotal: Number.isSafeInteger(total) ? total : 0,
    installmentIndex: '',
    payer: quote?.customer || '',
    phone: quote?.phone || '',
    project: quote?.project || '',
    seller: quote?.seller || 'BSBuildTh',
    sellerPhone: quote?.sellerPhone || '',
    sellerAddress: quote?.sellerAddress || '',
    sellerTaxId: quote?.sellerTaxId || '',
    sellerWebsite: quote?.sellerWebsite || '',
    bankName: quote?.bankName || '',
    bankAccountName: quote?.bankAccountName || '',
    bankAccountNumber: quote?.bankAccountNumber || '',
    salesperson: quote?.salesperson || '',
    showLogo: quote?.showLogo !== false,
    paymentMethod: 'โอนเงิน',
    paymentReference: '',
    note: '',
    items: [{
      id: crypto.randomUUID(),
      description: quote?.number ? `รับชำระตามใบเสนอราคา ${quote.number}` : '',
      amount: Number.isSafeInteger(total) ? (total / 100).toFixed(2) : '0.00',
    }],
  };
}

export function selectReceiptInstallment(receipt, value) {
  const index = value === '' ? null : Number(value);
  const installment = index === null ? null : receipt.paymentSchedule?.[index];
  if (index !== null && (!Number.isInteger(index) || index < 0 || !installment)) throw new Error('ไม่พบงวดชำระที่เลือก');
  const amount = installment ? installment.amount : receipt.paymentTotal;
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('งวดนี้ไม่มียอดรับชำระ');
  const description = [`รับชำระตามใบเสนอราคา ${receipt.quoteNumber}`, installment?.label, installment ? `${installment.percent}%` : '', installment?.condition].filter(Boolean).join(' · ');
  return { ...receipt, installmentIndex: value, items: [{ id: crypto.randomUUID(), description, amount: (amount / 100).toFixed(2) }] };
}

function amountToSatang(value) {
  const text = String(value);
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(text)) throw new Error('จำนวนเงินต้องเป็นเลขไม่ติดลบและมีทศนิยมไม่เกิน 2 ตำแหน่ง');
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

export function calculateReceipt(receipt) {
  if (!receipt.items.length || receipt.items.length > 50) throw new Error('ต้องมีรายการรับเงิน 1–50 รายการ');
  const items = receipt.items.map(item => {
    const amount = amountToSatang(item.amount);
    if (amount <= 0n) throw new Error('จำนวนเงินทุกรายการต้องมากกว่า 0');
    return { ...item, amountSatang: Number(amount) };
  });
  const total = items.reduce((sum, item) => sum + BigInt(item.amountSatang), 0n);
  if (total > MAX_RECEIPT_TOTAL) throw new Error('ยอดเงินเกินขอบเขตที่รองรับ');
  return { items, total: Number(total) };
}

export function validateReceipt(receipt) {
  for (const key of ['number', 'date', 'payer', 'seller', 'paymentMethod']) {
    if (!String(receipt[key] || '').trim()) throw new Error('กรุณากรอกเลขใบเสร็จ วันที่ ผู้ชำระ ผู้รับเงิน และวิธีชำระให้ครบ');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/.test(receipt.number)) throw new Error('เลขใบเสร็จใช้ตัวอักษรอังกฤษ ตัวเลข - และ _ ไม่เกิน 50 ตัว');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receipt.date) || Number.isNaN(Date.parse(receipt.date))) throw new Error('วันที่ใบเสร็จไม่ถูกต้อง');
  for (const item of receipt.items) if (!item.description.trim()) throw new Error('กรุณาระบุรายละเอียดของทุกรายการ');
  return calculateReceipt(receipt);
}
