import { calculateReceipt } from '../lib/receipt';
import { money } from '../lib/quotation';

function ReceiptCopy({ receipt, totals, copy }) {
  const date = new Date(`${receipt.date}T12:00:00`);
  return <article className="quote-paper receipt-paper">
    <p className="receipt-copy-label">{copy}</p>
    <header className="quote-heading"><div><h2>{receipt.seller || 'ผู้รับเงิน'}</h2><p>{receipt.sellerPhone}</p></div><div><h1>ใบเสร็จรับเงิน</h1><p>เลขที่ {receipt.number || 'ยังไม่กำหนดเลข'}</p><p>{Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('th-TH', { dateStyle: 'long' })}</p></div></header>
    <div className="quote-customer"><p><b>ได้รับเงินจาก:</b> {receipt.payer} {receipt.phone && `· ${receipt.phone}`}</p><p><b>โครงการ:</b> {receipt.project || '—'}</p>{receipt.quoteNumber && <p><b>อ้างอิงใบเสนอราคา:</b> {receipt.quoteNumber}</p>}</div>
    <table className="quote-table receipt-table"><thead><tr><th>รายการ</th><th>จำนวนเงิน (บาท)</th></tr></thead><tbody>{totals.items.map((item, index) => <tr key={item.id}><td>{index + 1}. {item.description}</td><td>{money(item.amountSatang)}</td></tr>)}</tbody></table>
    <div className="quote-totals"><p className="quote-grand">รวมเงินที่ได้รับ <b>{money(totals.total)} บาท</b></p></div>
    <section className="receipt-payment"><p><b>ชำระโดย:</b> {receipt.paymentMethod}</p><p><b>เลขอ้างอิง:</b> {receipt.paymentReference || '—'}</p>{receipt.note && <p><b>หมายเหตุ:</b> {receipt.note}</p>}</section>
    <div className="quote-signatures"><div>ผู้ชำระเงิน<br/><span>ลงชื่อ ____________________</span><p>วันที่ ____________________</p></div><div>ผู้รับเงิน<br/><span>ลงชื่อ ____________________</span><p>วันที่ ____________________</p></div></div>
  </article>;
}

export default function ReceiptPreview({ receipt, status = 'draft' }) {
  let totals;
  try { totals = calculateReceipt(receipt); } catch (error) { return <p role="alert">{error.message}</p>; }
  return <div className="receipt-copies">
    {status !== 'issued' && <p className="quote-watermark receipt-draft">ฉบับร่าง — ยังไม่ได้ออกใบเสร็จ</p>}
    <ReceiptCopy receipt={receipt} totals={totals} copy="ต้นฉบับ / ORIGINAL" />
    <ReceiptCopy receipt={receipt} totals={totals} copy="สำเนา / COPY" />
  </div>;
}
