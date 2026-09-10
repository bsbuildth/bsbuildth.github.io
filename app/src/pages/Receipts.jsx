import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { calculateReceipt, newReceipt, newReceiptItem, validateReceipt } from '../lib/receipt';
import { issueReceipt, listReceipts, saveReceipt } from '../firebase/receipts';
import ReceiptA4Form from '../components/ReceiptA4Form';
import ReceiptPreview from '../components/ReceiptPreview';
import './Quotations.css';

export default function Receipts() {
  const location = useLocation();
  const source = location.state?.quote ? location.state : null;
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState(() => newReceipt(source));
  const [dirty, setDirty] = useState(!!source);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(source ? 'สร้างร่างใบเสร็จจากใบเสนอราคาแล้ว กรุณาตรวจยอดก่อนบันทึก' : '');
  const [search, setSearch] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const operation = useRef(false);
  const locked = busy || (!!selected && selected.status !== 'draft');
  const calculation = useMemo(() => {
    try { return { totals: calculateReceipt(receipt), error: '' }; }
    catch (error) { return { totals: null, error: error.message || 'ยังคำนวณยอดไม่ได้' }; }
  }, [receipt]);

  useEffect(() => { listReceipts().then(setRows).catch(() => setMessage('โหลดใบเสร็จไม่ได้ กรุณาตรวจการเชื่อมต่อและสิทธิ์ผู้ดูแล')); }, []);
  useEffect(() => {
    if (!dirty) return;
    const leave = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [dirty]);

  const confirmLeave = () => !dirty || window.confirm('มีข้อมูลที่ยังไม่บันทึก ต้องการละทิ้งหรือไม่?');
  const open = row => {
    if (!confirmLeave()) return;
    setSelected(row); setReceipt(row ? structuredClone(row.receipt) : newReceipt()); setDirty(false); setPreviewMode(false); setMessage('');
  };
  const edit = (key, value) => { setReceipt(current => ({ ...current, [key]: value })); setDirty(true); setPreviewMode(false); };
  const itemEdit = (index, key, value) => edit('items', receipt.items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const run = async action => {
    if (operation.current) return;
    operation.current = true; setBusy(true); setMessage('กำลังดำเนินการ...');
    try { await action(); } catch (error) { setMessage(error.message || 'ดำเนินการไม่สำเร็จ ข้อมูลยังอยู่'); }
    finally { operation.current = false; setBusy(false); }
  };
  const reload = async id => {
    const data = await listReceipts(); setRows(data);
    const row = data.find(item => item.id === id);
    if (row) { setSelected(row); setReceipt(structuredClone(row.receipt)); }
  };
  const save = () => run(async () => {
    calculateReceipt(receipt);
    const id = await saveReceipt(selected?.id, receipt, selected?.version || 0);
    setDirty(false); await reload(id); setMessage('คำนวณและบันทึกร่างใบเสร็จแล้ว');
  });
  const issue = () => run(async () => {
    if (!selected || dirty) throw new Error('กรุณาบันทึกร่างล่าสุดก่อนออกใบเสร็จ');
    validateReceipt(receipt);
    if (!window.confirm('ออกใบเสร็จฉบับนี้? หลังออกแล้วจะแก้ไขไม่ได้')) { setMessage('ยังไม่ได้ออกใบเสร็จ'); return; }
    await issueReceipt(selected.id, selected.version); await reload(selected.id); setMessage('ออกใบเสร็จแล้ว พร้อมพิมพ์ต้นฉบับและสำเนา');
  });
  const copy = () => {
    if (!confirmLeave()) return;
    setSelected(null); setReceipt({ ...structuredClone(receipt), number: '' }); setDirty(true); setPreviewMode(false); setMessage('สร้างสำเนาข้อมูลเป็นใบเสร็จฉบับใหม่แล้ว');
  };
  const print = () => run(async () => {
    if (dirty) throw new Error('กรุณาบันทึกก่อนพิมพ์');
    await document.fonts.ready; window.print(); setMessage('หน้าพิมพ์ประกอบด้วยต้นฉบับและสำเนาอย่างละ 1 หน้า');
  });

  const actions = <div className="quote-controls"><button className="quote-save" disabled={locked || !dirty || !!calculation.error} onClick={save}>คำนวณและบันทึก{dirty ? ' *' : ''}</button><button className="quote-preview-button" disabled={!!calculation.error} onClick={() => setPreviewMode(current => !current)}>{previewMode ? '← กลับมาแก้ไข' : 'ดูต้นฉบับ + สำเนา'}</button><button disabled={locked || dirty || !selected} onClick={issue}>ออกใบเสร็จ</button><button disabled={busy} onClick={copy}>ทำใบเสร็จใหม่จากฉบับนี้</button><button disabled={busy || dirty || selected?.status !== 'issued'} onClick={print}>พิมพ์ / PDF 2 หน้า</button></div>;
  const filteredRows = rows.filter(row => `${row.receipt.number} ${row.receipt.payer} ${row.receipt.project} ${row.receipt.quoteNumber}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="quotation-workspace receipt-workspace">
    <header className="quote-toolbar"><Link to="/admin" onClick={event => { if (!confirmLeave()) event.preventDefault(); }}>← ระบบจัดการ</Link><Link to="/admin/quotations" onClick={event => { if (!confirmLeave()) event.preventDefault(); }}>ใบเสนอราคา</Link><h1>ใบเสร็จรับเงิน A4</h1><button disabled={busy} onClick={() => open(null)}>สร้างใหม่</button></header>
    <p className="quote-message" role="status" aria-live="polite">{message || 'กรอกและบันทึกครั้งเดียว แล้วพิมพ์ต้นฉบับกับสำเนาได้ทันที'}</p>
    <div className="quote-layout"><aside className="quote-sidebar"><label>ค้นหาใบเสร็จ<input value={search} onChange={event => setSearch(event.target.value)} placeholder="เลข / ผู้ชำระ / โครงการ / ใบเสนอราคา" /></label><button disabled={busy} onClick={() => run(async () => { const data = await listReceipts(); setRows(data); setMessage('โหลดรายการล่าสุดแล้ว'); })}>รีเฟรชรายการ</button>{filteredRows.map(row => <button disabled={busy} className={selected?.id === row.id ? 'selected' : ''} key={row.id} onClick={() => open(row)}><b>{row.receipt.number || 'ร่างไม่มีเลข'}</b><span>{row.receipt.payer || 'ยังไม่มีชื่อผู้ชำระ'}</span><small>{row.status === 'issued' ? 'ออกแล้ว' : 'ร่าง'}</small></button>)}</aside>
      <main className="quote-a4-stage">{previewMode ? <><div className="quote-preview-actions">{actions}</div><ReceiptPreview receipt={receipt} status={selected?.status || 'draft'} /></> : <ReceiptA4Form receipt={receipt} calculation={calculation} locked={locked} actions={actions} edit={edit} itemEdit={itemEdit} addItem={() => edit('items', [...receipt.items, newReceiptItem()])} removeItem={index => edit('items', receipt.items.filter((_, i) => i !== index))} />}</main>
    </div>
  </div>;
}
