import { money, calculateQuote } from '../lib/quotation';
export default function QuotationPreview({ quote, status = 'draft', revision = 0 }) {
  let totals;
  try { totals = calculateQuote(quote); } catch (error) { return <p role="alert">{error.message}</p>; }
  const date = new Date(`${quote.date}T12:00:00`);
  return <article className="quote-paper">
    <header className="quote-heading"><div><h2>{quote.seller || 'ผู้เสนอราคา'}</h2><p>{quote.sellerPhone}</p></div><div><h1>ใบเสนอราคา</h1><p>{quote.number || 'ยังไม่กำหนดเลข'} / REV. {String(revision).padStart(2, '0')}</p><p>{Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('th-TH', { dateStyle: 'long' })}</p></div></header>
    {status !== 'issued' && <p className="quote-watermark">{status === 'void' ? 'ยกเลิกเอกสาร' : 'ฉบับร่าง — ยังไม่ได้ออกเอกสาร'}</p>}
    <div className="quote-customer"><p><b>ลูกค้า:</b> {quote.customer} · {quote.phone}</p><p><b>โครงการ:</b> {quote.project}</p></div>
    <table className="quote-table"><thead><tr><th>รายการ</th><th>จำนวน</th><th>ราคา/หน่วย</th><th>จำนวนเงิน (บาท)</th></tr></thead>
      {totals.sections.map((s, si) => <tbody key={s.id}><tr className="quote-section"><th colSpan="4">{si+1}. {s.title}{s.kind === 'optional' ? ' · อุปกรณ์เพิ่มเติม' : ''}</th></tr>{s.items.map((item, i) => <tr key={item.id}><td>{si+1}.{i+1} {item.description}{!item.included && <strong> (ลูกค้าจัดหาเอง)</strong>}{item.free && <strong> (แถมฟรี)</strong>}</td><td>{item.quantity} {item.unit}</td><td>{item.free ? <del>{money(item.unitPrice)}</del> : money(item.unitPrice)}</td><td>{money(item.amount)}</td></tr>)}</tbody>)}
    </table>
    <div className="quote-totals"><p>รวมงานหลัก <b>{money(totals.main)}</b></p><p>รวมอุปกรณ์เพิ่มเติม <b>{money(totals.optional)}</b></p><p className="quote-grand">ยอดรวมทั้งสิ้น <b>{money(totals.total)} บาท</b></p></div>
    <section className="quote-terms"><h3>รายละเอียดและเงื่อนไข</h3><p>{quote.terms || '—'}</p>{quote.warranty && <p>การรับประกัน: {quote.warranty}</p>}</section>
    <section className="quote-payment"><h3>เงื่อนไขการชำระเงิน</h3><p>คิดจาก{quote.paymentBase === 'main' ? 'ยอดงานหลัก' : 'ยอดรวม'} {money(totals.base)} บาท</p><table className="quote-table"><thead><tr><th>งวด</th><th>จำนวนเงิน</th><th>เงื่อนไข</th></tr></thead><tbody>{totals.installments.map((item,i) => <tr key={i}><td>{item.label} ({item.percent}%)</td><td>{money(item.amount)}</td><td>{item.condition}</td></tr>)}</tbody></table></section>
    <div className="quote-signatures"><div>ผู้อนุมัติ / ลูกค้า<br/><span>ลงชื่อ ____________________</span><p>วันที่ ____________________</p></div><div>ผู้เสนอราคา<br/><span>ลงชื่อ ____________________</span><p>วันที่ ____________________</p></div></div>
  </article>;
}
