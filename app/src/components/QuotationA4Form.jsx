import { money } from '../lib/quotation';

export default function QuotationA4Form({ quote, revision = 0, calculation, locked, actions, edit, sectionEdit, itemEdit, addItem, removeItem, addSection, removeSection }) {
  const totals = calculation.totals;
  return <article className="quote-paper quote-a4-form">
    <div className="quote-form-actions">{actions}</div>
    <fieldset className="quote-a4-fields" disabled={locked}>
      <header className="quote-heading quote-form-heading">
        <div className="quote-brand-fields">
          <label>ผู้เสนอราคา<input value={quote.seller} maxLength="300" onChange={e => edit('seller', e.target.value)} /></label>
          <label>เบอร์ผู้เสนอราคา<input value={quote.sellerPhone} maxLength="300" onChange={e => edit('sellerPhone', e.target.value)} /></label>
        </div>
        <div><h1>ใบเสนอราคา</h1><p className="quote-revision-badge">REV. {String(revision).padStart(2, '0')}</p><label>เลขเอกสาร<input value={quote.number} maxLength="50" placeholder="QT-001" onChange={e => edit('number', e.target.value)} /></label><label>วันที่<input type="date" value={quote.date} onChange={e => edit('date', e.target.value)} /></label></div>
      </header>

      <section className="quote-customer quote-form-customer">
        <label>ชื่อลูกค้า<input value={quote.customer} maxLength="300" onChange={e => edit('customer', e.target.value)} /></label>
        <label>เบอร์ลูกค้า<input value={quote.phone} maxLength="300" onChange={e => edit('phone', e.target.value)} /></label>
        <label className="quote-project-field">โครงการ<input value={quote.project} maxLength="300" onChange={e => edit('project', e.target.value)} /></label>
      </section>

      <table className="quote-table quote-edit-table"><thead><tr><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>ราคา/หน่วย</th><th>จำนวนเงิน</th><th className="quote-edit-only">จัดการ</th></tr></thead>
        {quote.sections.map((section, sectionIndex) => <tbody key={section.id}>
          <tr className="quote-section quote-form-section"><th colSpan="6"><span>{sectionIndex + 1}.</span><input aria-label={`ชื่อหมวด ${sectionIndex + 1}`} value={section.title} maxLength="150" onChange={e => sectionEdit(sectionIndex, current => ({ ...current, title: e.target.value }))} /><select aria-label={`ประเภทหมวด ${sectionIndex + 1}`} value={section.kind} onChange={e => sectionEdit(sectionIndex, current => ({ ...current, kind: e.target.value }))}><option value="main">งานหลัก</option><option value="optional">อุปกรณ์เพิ่มเติม</option></select><button type="button" className="quote-edit-only quote-danger" onClick={() => removeSection(sectionIndex)}>ลบหมวด</button></th></tr>
          {section.items.map((item, itemIndex) => {
            const calculatedItem = totals?.sections[sectionIndex]?.items[itemIndex];
            return <tr key={item.id} className="quote-form-item"><td><span className="quote-row-number">{sectionIndex + 1}.{itemIndex + 1}</span><textarea rows="2" aria-label={`รายละเอียดรายการ ${sectionIndex + 1}.${itemIndex + 1}`} value={item.description} maxLength="2000" onChange={e => itemEdit(sectionIndex, itemIndex, 'description', e.target.value)} /><div className="quote-row-options quote-edit-only"><label><input type="checkbox" checked={item.free} onChange={e => itemEdit(sectionIndex, itemIndex, 'free', e.target.checked)} /> แถมฟรี</label><label><input type="checkbox" checked={item.included} onChange={e => itemEdit(sectionIndex, itemIndex, 'included', e.target.checked)} /> รวมยอด</label></div></td><td><input inputMode="decimal" aria-label={`จำนวน ${sectionIndex + 1}.${itemIndex + 1}`} value={item.quantity} onChange={e => itemEdit(sectionIndex, itemIndex, 'quantity', e.target.value)} /></td><td><input aria-label={`หน่วย ${sectionIndex + 1}.${itemIndex + 1}`} value={item.unit} onChange={e => itemEdit(sectionIndex, itemIndex, 'unit', e.target.value)} /></td><td><input inputMode="decimal" aria-label={`ราคาต่อหน่วย ${sectionIndex + 1}.${itemIndex + 1}`} value={item.price} onChange={e => itemEdit(sectionIndex, itemIndex, 'price', e.target.value)} /></td><td className="quote-form-amount">{calculatedItem ? money(calculatedItem.amount) : '—'}{item.free && <small>แถมฟรี</small>}{!item.included && !item.free && <small>ไม่รวมยอด</small>}</td><td className="quote-edit-only"><button type="button" className="quote-icon-button quote-danger" aria-label={`ลบรายการ ${sectionIndex + 1}.${itemIndex + 1}`} onClick={() => removeItem(sectionIndex, itemIndex)}>×</button></td></tr>;
          })}
          <tr className="quote-edit-only quote-add-row"><td colSpan="6"><button type="button" onClick={() => addItem(sectionIndex)}>+ เพิ่มรายการในหมวดนี้</button></td></tr>
        </tbody>)}
      </table>
      <button type="button" className="quote-edit-only quote-add-section" onClick={addSection}>+ เพิ่มหมวดงาน</button>

      <div className="quote-totals quote-form-totals"><p>รวมงานหลัก <b>{totals ? money(totals.main) : '—'}</b></p><p>รวมอุปกรณ์เพิ่มเติม <b>{totals ? money(totals.optional) : '—'}</b></p><p className="quote-grand">ยอดรวมทั้งสิ้น <b>{totals ? `${money(totals.total)} บาท` : 'คำนวณไม่สำเร็จ'}</b></p></div>
      {calculation.error ? <p className="quote-calc-error" role="alert">{calculation.error}</p> : <p className="quote-calc-ready quote-edit-only">✓ คำนวณอัตโนมัติแล้ว พร้อมบันทึก</p>}

      <section className="quote-terms quote-form-terms"><h3>รายละเอียดและเงื่อนไข</h3><textarea rows="4" value={quote.terms} maxLength="10000" placeholder="ระบุขอบเขตงาน เงื่อนไข และหมายเหตุ" onChange={e => edit('terms', e.target.value)} /><label>การรับประกัน<input value={quote.warranty} maxLength="1000" onChange={e => edit('warranty', e.target.value)} /></label></section>

      <section className="quote-payment quote-form-payment"><div className="quote-payment-heading"><h3>เงื่อนไขการชำระเงิน</h3><label className="quote-edit-only">ฐานคำนวณ<select value={quote.paymentBase} onChange={e => edit('paymentBase', e.target.value)}><option value="main">ยอดงานหลัก</option><option value="total">ยอดรวมที่เรียกเก็บ</option></select></label></div><p>คิดจาก{quote.paymentBase === 'main' ? 'ยอดงานหลัก' : 'ยอดรวม'} {totals ? money(totals.base) : '—'} บาท</p>
        <table className="quote-table quote-installment-table"><thead><tr><th>งวด</th><th>เปอร์เซ็นต์</th><th>จำนวนเงิน</th><th>เงื่อนไข</th><th className="quote-edit-only">จัดการ</th></tr></thead><tbody>{quote.installments.map((item, index) => <tr key={index}><td><input aria-label={`ชื่องวด ${index + 1}`} value={item.label} onChange={e => edit('installments', quote.installments.map((current, i) => i === index ? { ...current, label: e.target.value } : current))} /></td><td><input inputMode="decimal" aria-label={`เปอร์เซ็นต์งวด ${index + 1}`} value={item.percent} onChange={e => edit('installments', quote.installments.map((current, i) => i === index ? { ...current, percent: e.target.value } : current))} /></td><td className="quote-form-amount">{totals?.installments[index] ? money(totals.installments[index].amount) : '—'}</td><td><input aria-label={`เงื่อนไขงวด ${index + 1}`} value={item.condition} onChange={e => edit('installments', quote.installments.map((current, i) => i === index ? { ...current, condition: e.target.value } : current))} /></td><td className="quote-edit-only"><button type="button" className="quote-icon-button quote-danger" aria-label={`ลบงวด ${index + 1}`} onClick={() => edit('installments', quote.installments.filter((_, i) => i !== index))}>×</button></td></tr>)}</tbody></table>
        <button type="button" className="quote-edit-only" onClick={() => edit('installments', [...quote.installments, { label: 'งวดใหม่', percent: '0', condition: '' }])}>+ เพิ่มงวดชำระ</button>
      </section>
      <div className="quote-signatures"><div>ผู้อนุมัติ / ลูกค้า<br/><span>ลงชื่อ ____________________</span><p>วันที่ ____________________</p></div><div>ผู้เสนอราคา<br/><span>ลงชื่อ ____________________</span><p>วันที่ ____________________</p></div></div>
    </fieldset>
  </article>;
}
