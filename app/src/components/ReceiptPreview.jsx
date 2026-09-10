import { calculateReceipt } from '../lib/receipt';
import { money } from '../lib/quotation';

function ReceiptCopy({ receipt, totals, copy }) {
  const date = new Date(`${receipt.date}T12:00:00`);
  return <article className="quote-paper reference-document receipt-paper">
    <header className="reference-header">
      <div className="document-brand">
        <div className="document-logo"><span>BS</span><b>BUILD</b><em>TH</em><small>RENOVATION &amp; CONSTRUCTION</small></div>
        <div className="document-company"><b>{receipt.seller || 'BSBuildTh'}</b>{receipt.sellerAddress && <p>{receipt.sellerAddress}</p>}{receipt.sellerTaxId && <p>เลขประจำตัวผู้เสียภาษี {receipt.sellerTaxId}</p>}{receipt.sellerPhone && <p>โทร. {receipt.sellerPhone}</p>}{receipt.sellerWebsite && <p>{receipt.sellerWebsite}</p>}</div>
      </div>
      <div className="document-meta"><h1>ใบเสร็จรับเงิน</h1><dl><dt>เลขที่</dt><dd>{receipt.number || 'ยังไม่กำหนดเลข'}</dd><dt>วันที่</dt><dd>{Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('th-TH')}</dd><dt>ชำระโดย</dt><dd>{receipt.paymentMethod}</dd><dt>สถานะ</dt><dd>{copy}</dd></dl></div>
      <div className="document-customer"><b>ลูกค้า</b><p>{receipt.payer || '—'}</p><p>{receipt.phone || '—'}</p>{receipt.project && <p>โครงการ {receipt.project}</p>}{receipt.quoteNumber && <p>อ้างอิง {receipt.quoteNumber}</p>}</div>
    </header>
    <table className="quote-table reference-table receipt-reference-table"><thead><tr><th>#</th><th>รายละเอียด</th><th>มูลค่า</th></tr></thead><tbody>{totals.items.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><b>{item.description}</b></td><td>{money(item.amountSatang)}</td></tr>)}</tbody></table>
    <div className="reference-summary"><div className="amount-in-words">(จำนวนเงิน {money(totals.total)} บาทถ้วน)</div><div><p className="reference-grand"><span>จำนวนเงินรวมทั้งสิ้น</span><b>{money(totals.total)} บาท</b></p></div></div>
    <section className="reference-notes"><b>หมายเหตุ</b><p>{receipt.note || '—'}</p>{receipt.paymentReference && <p>เลขอ้างอิงการชำระเงิน {receipt.paymentReference}</p>}</section>
    <div className="reference-signatures"><p>ในนาม {receipt.payer || 'ผู้ชำระเงิน'}</p><p>ในนาม {receipt.seller || 'BSBuildTh'}</p><div><span>ผู้ชำระเงิน</span><span>วันที่</span><span>ผู้รับเงิน</span><span>วันที่</span></div></div>
  </article>;
}

export default function ReceiptPreview({ receipt, status = 'draft' }) {
  let totals;
  try { totals = calculateReceipt(receipt); } catch (error) { return <p role="alert">{error.message}</p>; }
  return <div className="receipt-copies">
    {status !== 'issued' && <p className="quote-watermark receipt-draft">ฉบับร่าง - ยังไม่ได้ออกใบเสร็จ</p>}
    <ReceiptCopy receipt={receipt} totals={totals} copy="ต้นฉบับ / ORIGINAL" />
    <ReceiptCopy receipt={receipt} totals={totals} copy="สำเนา / COPY" />
  </div>;
}
