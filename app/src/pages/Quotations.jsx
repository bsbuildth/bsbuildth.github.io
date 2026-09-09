import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { newQuote, newItem, demoQuote, validateIssue } from '../lib/quotation';
import { listQuotes, listRevisions, saveQuote, issueQuote, changeQuoteStatus } from '../firebase/quotations';
import QuotationPreview from '../components/QuotationPreview';
import './Quotations.css';

export default function Quotations() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quote, setQuote] = useState(newQuote);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);
  const [historic, setHistoric] = useState(null);
  const operation = useRef(false);
  const locked = busy || (!!selected && selected.status !== 'draft');
  useEffect(() => { listQuotes().then(setRows).catch(() => setMessage('โหลดเอกสารไม่ได้ กรุณาตรวจการเชื่อมต่อและสิทธิ์ผู้ดูแล')); }, []);
  useEffect(() => {
    if (!dirty) return;
    const leave = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [dirty]);
  const confirmLeave = () => !dirty || window.confirm('มีข้อมูลที่ยังไม่บันทึก ต้องการละทิ้งหรือไม่?');
  const open = row => {
    if (!confirmLeave()) return;
    setSelected(row); setQuote(row ? structuredClone(row.quote) : newQuote()); setDirty(false); setHistory([]); setHistoric(null); setMessage('');
  };
  const edit = (key, value) => { setQuote(q => ({ ...q, [key]: value })); setDirty(true); setHistoric(null); };
  const sectionEdit = (index, updater) => edit('sections', quote.sections.map((s,i) => i === index ? updater(s) : s));
  const itemEdit = (si, ii, key, value) => sectionEdit(si, s => ({ ...s, items: s.items.map((item,i) => i === ii ? { ...item, [key]: value } : item) }));
  const run = async action => {
    if (operation.current) return;
    operation.current = true; setBusy(true); setMessage('กำลังดำเนินการ...');
    try { await action(); } catch(error) { setMessage(error.message || 'ดำเนินการไม่สำเร็จ ข้อมูลยังอยู่'); }
    finally { operation.current = false; setBusy(false); }
  };
  const reload = async id => {
    const data = await listQuotes(); setRows(data);
    const row = data.find(r => r.id === id);
    if (row) { setSelected(row); setQuote(structuredClone(row.quote)); }
    setHistoric(null);
  };
  const save = () => run(async () => {
    const id = await saveQuote(selected?.id, quote, selected?.version || 0);
    // Preserve the saved version even if refreshing the list fails.
    setSelected({ ...selected, id, quote: structuredClone(quote), status: 'draft', version: (selected?.version || 0)+1 });
    setDirty(false); await reload(id); setMessage('บันทึกร่างแล้ว');
  });
  const issue = () => run(async () => {
    if (!selected || dirty) throw new Error('กรุณาบันทึกร่างล่าสุดก่อนออกเอกสาร');
    validateIssue(quote);
    if (!window.confirm('ออกใบเสนอราคาฉบับนี้? ระบบจะเก็บสำเนาที่แก้ย้อนหลังไม่ได้')) { setMessage('ยังไม่ได้ออกเอกสาร'); return; }
    await issueQuote(selected.id, selected.version); await reload(selected.id); setMessage('ออกเอกสารแล้ว สามารถพิมพ์หรือบันทึก PDF ได้');
  });
  const transition = status => run(async () => {
    const reason = window.prompt(status === 'void' ? 'เหตุผลที่ยกเลิกเอกสาร' : 'เหตุผลที่สร้างฉบับแก้ไข');
    if (!reason?.trim()) { setMessage('ไม่ได้เปลี่ยนสถานะ'); return; }
    await changeQuoteStatus(selected.id, selected.version, status, reason); await reload(selected.id); setMessage('เปลี่ยนสถานะแล้ว');
  });
  const copy = () => {
    if (!confirmLeave()) return;
    setSelected(null); setQuote({ ...structuredClone(quote), number: '', status: 'draft' }); setDirty(true); setHistoric(null); setHistory([]);
  };
  const print = () => run(async () => {
    if (dirty) throw new Error('กรุณาบันทึกก่อนพิมพ์ เพื่อให้เอกสารตรงกับข้อมูลที่บันทึก');
    await document.fonts.ready; window.print(); setMessage('เลือก Save as PDF ในหน้าต่างพิมพ์เพื่อบันทึกไฟล์');
  });
  return <div className="quotation-workspace">
    <header className="quote-toolbar"><Link to="/admin" onClick={e => { if (!confirmLeave()) e.preventDefault(); }}>← ระบบจัดการ</Link><h1>ใบเสนอราคา</h1><button disabled={busy} onClick={() => open(null)}>สร้างใหม่</button><button disabled={busy} onClick={() => { if (confirmLeave()) { setSelected(null); setQuote(demoQuote()); setDirty(true); setHistoric(null); setHistory([]); } }}>โหลดตัวอย่าง</button></header>
    <p className="quote-message" role="status" aria-live="polite">{message || 'กรอกข้อมูล บันทึกร่าง แล้วตรวจตัวอย่างก่อนออกเอกสาร'}</p>
    <div className="quote-layout"><aside className="quote-sidebar"><label>ค้นหาเอกสาร<input value={search} onChange={e => setSearch(e.target.value)} placeholder="เลข / ลูกค้า / โครงการ / สถานะ" /></label><button disabled={busy} onClick={() => run(async () => { if (confirmLeave()) { const data = await listQuotes(); setRows(data); setMessage('โหลดรายการล่าสุดแล้ว'); } })}>รีเฟรชรายการ</button><p>แสดงล่าสุดไม่เกิน 200 เอกสาร</p>{rows.filter(r => `${r.quote.number} ${r.quote.customer} ${r.quote.project} ${r.status}`.toLowerCase().includes(search.toLowerCase())).map(r => <button disabled={busy} className={selected?.id === r.id ? 'selected' : ''} key={r.id} onClick={() => open(r)}><b>{r.quote.number || 'ร่างไม่มีเลข'}</b><span>{r.quote.customer || 'ยังไม่มีชื่อลูกค้า'}</span><small>{({ draft: 'ร่าง', issued: 'ออกแล้ว', void: 'ยกเลิก' })[r.status]}</small></button>)}</aside>
    <div className="quote-editor"><fieldset disabled={locked}>
      <legend>ข้อมูลใบเสนอราคา</legend><div className="quote-fields">{[['number','เลขเอกสาร'],['date','วันที่'],['customer','ชื่อลูกค้า'],['phone','เบอร์ลูกค้า'],['project','โครงการ'],['seller','ผู้เสนอราคา'],['sellerPhone','เบอร์ผู้เสนอราคา']].map(([key,label]) => <label key={key}>{label}<input type={key === 'date' ? 'date' : 'text'} maxLength={key === 'number' ? 50 : 300} value={quote[key]} onChange={e => edit(key,e.target.value)} /></label>)}</div>
      {quote.sections.map((s,si) => <section className="quote-edit-section" key={s.id}><div className="quote-fields"><label>ชื่อหมวด<input value={s.title} maxLength={150} onChange={e => sectionEdit(si,s => ({ ...s,title:e.target.value }))} /></label><label>ประเภท<select value={s.kind} onChange={e => sectionEdit(si,s => ({ ...s,kind:e.target.value }))}><option value="main">งานหลัก</option><option value="optional">อุปกรณ์เพิ่มเติม</option></select></label></div>
      {s.items.map((item,ii) => <div className="quote-item" key={item.id}><label>รายละเอียด<textarea value={item.description} maxLength={2000} onChange={e => itemEdit(si,ii,'description',e.target.value)} /></label><div className="quote-fields">{[['quantity','จำนวน'],['unit','หน่วย'],['price','ราคาต่อหน่วย (บาท)']].map(([key,label]) => <label key={key}>{label}<input inputMode={key === 'unit' ? 'text' : 'decimal'} value={item[key]} onChange={e => itemEdit(si,ii,key,e.target.value)} /></label>)}</div><div className="quote-item-actions"><label><input type="checkbox" checked={item.free} onChange={e => itemEdit(si,ii,'free',e.target.checked)} /> แถมฟรี</label><label><input type="checkbox" checked={item.included} onChange={e => itemEdit(si,ii,'included',e.target.checked)} /> รวมในยอดเรียกเก็บ</label><button onClick={() => sectionEdit(si,s => ({ ...s,items:s.items.filter((_,i) => i!==ii) }))}>ลบรายการ</button><button disabled={locked || ii===0} onClick={() => sectionEdit(si,s => { const items=[...s.items]; [items[ii-1],items[ii]]=[items[ii],items[ii-1]]; return { ...s,items }; })}>เลื่อนขึ้น</button></div></div>)}
      <button onClick={() => sectionEdit(si,s => ({ ...s, items:[...s.items,newItem()] }))}>+ รายการ</button><button disabled={locked || si === 0} onClick={() => { const sections=[...quote.sections]; [sections[si-1],sections[si]]=[sections[si],sections[si-1]]; edit('sections',sections); }}>เลื่อนหมวดขึ้น</button><button onClick={() => edit('sections',quote.sections.filter((_,i) => i!==si))}>ลบหมวด</button></section>)}
      <button onClick={() => edit('sections',[...quote.sections,{ id:crypto.randomUUID(), title:'หมวดใหม่',kind:'main',items:[newItem()] }])}>+ หมวดงาน</button>
      <label>รายละเอียดและเงื่อนไข<textarea rows="4" maxLength={10000} value={quote.terms} onChange={e => edit('terms',e.target.value)} /></label><label>การรับประกัน<input value={quote.warranty} maxLength={1000} onChange={e => edit('warranty',e.target.value)} /></label>
      <label>ฐานคำนวณงวด<select value={quote.paymentBase} onChange={e => edit('paymentBase',e.target.value)}><option value="main">ยอดงานหลัก</option><option value="total">ยอดรวมที่เรียกเก็บ</option></select></label>
      {quote.installments.map((item,i) => <div className="quote-fields" key={i}>{[['label','ชื่องวด'],['percent','เปอร์เซ็นต์'],['condition','เงื่อนไข']].map(([key,label]) => <label key={key}>{label}<input value={item[key]} onChange={e => edit('installments',quote.installments.map((x,j) => j===i ? { ...x,[key]:e.target.value } : x))} /></label>)}<button onClick={() => edit('installments',quote.installments.filter((_,j) => j!==i))}>ลบงวด</button></div>)}<button onClick={() => edit('installments',[...quote.installments,{ label:'งวดใหม่',percent:'0',condition:'' }])}>+ งวดชำระ</button>
    </fieldset><div className="quote-controls"><button disabled={locked} onClick={save}>บันทึกร่าง{dirty ? ' *' : ''}</button><button disabled={locked || dirty || !selected} onClick={issue}>ออกเอกสาร</button><button disabled={busy} onClick={copy}>ทำสำเนา</button><button disabled={busy || dirty || !selected} onClick={print}>พิมพ์ / PDF</button>{selected?.status === 'issued' && <><button disabled={busy} onClick={() => transition('draft')}>สร้างฉบับแก้ไข</button><button disabled={busy} onClick={() => transition('void')}>ยกเลิกเอกสาร</button></>}{selected && <button disabled={busy} onClick={() => run(async () => { setHistory(await listRevisions(selected.id)); setMessage('โหลดประวัติแล้ว'); })}>ประวัติฉบับที่ออก</button>}</div>
      {history.map(r => <button key={r.id} onClick={() => setHistoric(r)}>ดูฉบับที่ {r.revision}</button>)}{historic && <button onClick={() => setHistoric(null)}>กลับฉบับปัจจุบัน</button>}
    </div></div>
    <div className="quote-preview"><QuotationPreview quote={historic?.quote || quote} status={historic ? 'issued' : selected?.status || 'draft'} revision={historic?.revision || selected?.revision || 0} /></div>
  </div>;
}
