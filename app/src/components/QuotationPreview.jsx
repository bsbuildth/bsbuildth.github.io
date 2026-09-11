import { bahtText, money, calculateQuote } from '../lib/quotation';

function Brand({ quote }) {
  return <div className={`document-brand${quote.showLogo === false ? ' logo-hidden' : ''}`}>
    {quote.showLogo !== false && <div className="document-logo"><span>BS</span><b>BUILD</b><em>TH</em><small>RENOVATION &amp; CONSTRUCTION</small></div>}
    <div className="document-company">
      <b>{quote.seller || 'BSBuildTh'}</b>
      {quote.sellerAddress && <p>{quote.sellerAddress}</p>}
      {quote.sellerTaxId && <p>เลขประจำตัวผู้เสียภาษี {quote.sellerTaxId}</p>}
      {quote.sellerPhone && <p>โทร. {quote.sellerPhone}</p>}
      {quote.sellerWebsite && <p>{quote.sellerWebsite}</p>}
    </div>
  </div>;
}

export default function QuotationPreview({ quote, status = 'draft', revision = 0 }) {
  let totals;
  try { totals = calculateQuote(quote); } catch (error) { return <p role="alert">{error.message}</p>; }
  const date = new Date(`${quote.date}T12:00:00`);
  const rows = totals.sections.flatMap(section => section.items);
  return <article className={`quote-paper reference-document quotation-document${rows.length > 15 ? ' document-long' : ''}`}>
    <header className="reference-header">
      <Brand quote={quote} />
      <div className="document-meta"><h1>ใบเสนอราคา</h1><dl><dt>เลขที่</dt><dd>{quote.number || 'ยังไม่กำหนดเลข'}</dd><dt>วันที่</dt><dd>{Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('th-TH')}</dd><dt>ผู้ขาย</dt><dd>{quote.salesperson || quote.seller}</dd><dt>REV.</dt><dd>{String(revision).padStart(2, '0')}</dd></dl></div>
      <div className="document-customer"><b>ลูกค้า</b><p>{quote.customer || '—'}</p><p>{quote.phone || '—'}{quote.project && ` · โครงการ ${quote.project}`}</p></div>
    </header>
    {status !== 'issued' && <p className="quote-watermark">{status === 'void' ? 'ยกเลิกเอกสาร' : 'ฉบับร่าง - ยังไม่ได้ออกเอกสาร'}</p>}
    <table className="quote-table reference-table"><thead><tr><th>#</th><th>รายละเอียด</th><th>จำนวน</th><th>หน่วย</th><th>ราคาต่อหน่วย</th><th>มูลค่า</th></tr></thead>
      <tbody>{rows.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><b>{item.description || '—'}</b>{!item.included && <small>ลูกค้าจัดหาเอง</small>}{item.free && <small>แถมฟรี</small>}</td><td>{item.quantity}</td><td>{item.unit}</td><td>{money(item.unitPrice)}</td><td>{money(item.amount)}</td></tr>)}</tbody>
    </table>
    <div className="reference-summary"><div className="amount-in-words">({bahtText(totals.total)})</div><div><p><span>รวมเป็นเงิน</span><b>{money(totals.subtotal)} บาท</b></p>{totals.discount > 0 && <p><span>ส่วนลดท้ายบิล{totals.discountType === 'percent' ? ` ${money(totals.discountInput)}%` : ''}</span><b>{money(totals.discount)} บาท</b></p>}<p><span>ภาษีมูลค่าเพิ่ม {Number(quote.vatRate ?? 0)}%</span><b>{money(totals.vat)} บาท</b></p><p><span>ราคาไม่รวมภาษีมูลค่าเพิ่ม</span><b>{money(totals.beforeVat)} บาท</b></p><p className="reference-grand"><span>จำนวนเงินรวมทั้งสิ้น</span><b>{money(totals.total)} บาท</b></p></div></div>
    <section className="reference-notes"><b>หมายเหตุ</b><p>{quote.terms || '—'}</p>{quote.warranty && <p>การรับประกัน: {quote.warranty}</p>}<h3>เงื่อนไขการชำระเงิน</h3>{totals.installments.map((item, index) => <p key={index}>{item.label} {item.percent}% - {money(item.amount)} บาท {item.condition}</p>)}</section>
    <div className="reference-signatures"><p>ผู้ว่าจ้าง / ผู้อนุมัติ</p><p>ผู้รับจ้าง / ผู้เสนอราคา</p><div><span>ผู้อนุมัติ</span><span>วันที่</span><span>ผู้เสนอราคา</span><span>วันที่</span></div></div>
  </article>;
}
