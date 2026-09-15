import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { calculateQuote, demoQuote, newItem, newQuote, validateIssue } from '../lib/quotation';
import { changeQuoteStatus, deleteDraftQuote, issueQuote, listQuotes, listRevisions, saveQuote } from '../firebase/quotations';
import { applyCompanyDefaults, getCompanyDefaults, getDocumentPresets, nextDocumentNumber, saveCompanyDefaults, saveDocumentPresets } from '../firebase/documents';
import QuotationA4Form from '../components/QuotationA4Form';
import QuotationPreview from '../components/QuotationPreview';
import AiShareDialog from '../components/AiShareDialog';
import { downloadFile, quotationElementToPdfFile, quotationFilename, quotationReviewPrompt, redactQuotationForAi } from '../lib/quotationPdf';
import './Quotations.css';

export default function Quotations() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quote, setQuote] = useState(newQuote);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);
  const [historic, setHistoric] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [aiShareOpen, setAiShareOpen] = useState(false);
  const [exportContext, setExportContext] = useState(null);
  const [companyDefaults, setCompanyDefaults] = useState({});
  const [documentPresets, setDocumentPresets] = useState({ bankAccounts: [], signatures: [] });
  const operation = useRef(false);
  const touched = useRef(false);
  const exportRef = useRef(null);
  const locked = busy || (!!selected && selected.status !== 'draft');
  const displayRevision = selected?.status === 'draft' && selected.revision > 0 ? selected.revision + 1 : selected?.revision || 0;
  const calculation = useMemo(() => {
    try { return { totals: calculateQuote(quote), error: '' }; }
    catch (error) { return { totals: null, error: error.message || 'ยังคำนวณยอดไม่ได้' }; }
  }, [quote]);

  useEffect(() => {
    listQuotes().then(setRows).catch(() => setMessage('โหลดเอกสารไม่ได้ กรุณาตรวจการเชื่อมต่อและสิทธิ์ผู้ดูแล'));
    getCompanyDefaults().then(defaults => {
      setCompanyDefaults(defaults);
      if (!touched.current) setQuote(current => applyCompanyDefaults(current, defaults));
    }).catch(() => setMessage('โหลดข้อมูลบริษัทเริ่มต้นไม่ได้ แต่ยังกรอกเอกสารได้ตามปกติ'));
    getDocumentPresets().then(setDocumentPresets).catch(() => setMessage('โหลดคลังบัญชีและลายเซ็นไม่ได้ แต่ยังกรอกเอกสารได้ตามปกติ'));
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const leave = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [dirty]);

  const confirmLeave = () => !dirty || window.confirm('มีข้อมูลที่ยังไม่บันทึก ต้องการละทิ้งหรือไม่?');
  const open = row => {
    if (!confirmLeave()) return;
    setSelected(row); setQuote(row ? structuredClone(row.quote) : applyCompanyDefaults(newQuote(), companyDefaults)); setDirty(false); setHistory([]); setHistoric(null); setPreviewMode(false); setMessage(''); touched.current = false;
  };
  const edit = (key, value) => { touched.current = true; setQuote(current => ({ ...current, [key]: value })); setDirty(true); setHistoric(null); setPreviewMode(false); };
  const updateSections = updater => { touched.current = true; setQuote(current => ({ ...current, sections: updater(current.sections) })); setDirty(true); setHistoric(null); setPreviewMode(false); };
  const editSection = (index, updater) => updateSections(sections => sections.map((section, i) => i === index ? updater(section) : section));
  const itemEdit = (sectionIndex, itemIndex, key, value) => {
    updateSections(sections => sections.map((section, i) => i === sectionIndex ? { ...section, items: section.items.map((item, j) => j === itemIndex ? { ...item, [key]: value } : item) } : section));
  };
  const run = async action => {
    if (operation.current) return;
    operation.current = true; setBusy(true); setMessage('กำลังดำเนินการ...');
    try { await action(); } catch (error) { setMessage(error.message || 'ดำเนินการไม่สำเร็จ ข้อมูลยังอยู่'); }
    finally { operation.current = false; setBusy(false); }
  };
  const reload = async id => {
    const data = await listQuotes(); setRows(data);
    const row = data.find(item => item.id === id);
    if (row) { setSelected(row); setQuote(structuredClone(row.quote)); }
    setHistoric(null);
  };
  const save = () => run(async () => {
    const prepared = quote.number.trim() ? quote : { ...quote, number: await nextDocumentNumber('QT', quote.date) };
    calculateQuote(prepared);
    setQuote(prepared);
    const id = await saveQuote(selected?.id, prepared, selected?.version || 0);
    setSelected({ ...selected, id, quote: structuredClone(prepared), status: 'draft', version: (selected?.version || 0) + 1 });
    setDirty(false); await reload(id); setMessage('คำนวณและบันทึกร่างแล้ว');
  });
  const issue = () => run(async () => {
    if (!selected || dirty) throw new Error('กรุณาบันทึกร่างล่าสุดก่อนออกเอกสาร');
    validateIssue(quote);
    if (!window.confirm('ออกใบเสนอราคาฉบับนี้? ระบบจะเก็บสำเนาที่แก้ย้อนหลังไม่ได้')) { setMessage('ยังไม่ได้ออกเอกสาร'); return; }
    await issueQuote(selected.id, selected.version); await reload(selected.id); setMessage('ออกเอกสารแล้ว สามารถพิมพ์หรือบันทึก PDF ได้');
  });
  const transition = status => run(async () => {
    const reason = window.prompt(status === 'void' ? 'เหตุผลที่ยกเลิกเอกสาร' : 'เหตุผลที่แก้ไขราคาใน REV. ใหม่');
    if (!reason?.trim()) { setMessage('ไม่ได้เปลี่ยนสถานะ'); return; }
    await changeQuoteStatus(selected.id, selected.version, status, reason); await reload(selected.id); setMessage('เปลี่ยนสถานะแล้ว');
  });
  const copy = () => {
    if (!confirmLeave()) return;
    setSelected(null); setQuote({ ...structuredClone(quote), number: '', status: 'draft' }); setDirty(true); setHistoric(null); setPreviewMode(false); setHistory([]);
  };
  const removeDraft = () => run(async () => {
    if (!selected || selected.status !== 'draft' || selected.revision !== 0) throw new Error('ลบได้เฉพาะใบเสนอราคาฉบับร่างที่ยังไม่เคยออกเอกสาร');
    if (!window.confirm(`ลบใบเสนอราคาร่าง ${quote.number || 'ที่ยังไม่มีเลข'} ถาวร? การลบนี้ย้อนกลับไม่ได้`)) { setMessage('ยังไม่ได้ลบใบเสนอราคา'); return; }
    await deleteDraftQuote(selected.id, selected.version);
    const data = await listQuotes();
    setRows(data); setSelected(null); setQuote(applyCompanyDefaults(newQuote(), companyDefaults)); setDirty(false); setHistory([]); setHistoric(null); setPreviewMode(false); setMessage('ลบใบเสนอราคาฉบับร่างแล้ว');
  });
  const print = () => run(async () => {
    if (dirty) throw new Error('กรุณาบันทึกก่อนพิมพ์ เพื่อให้เอกสารตรงกับข้อมูลที่บันทึก');
    setPreviewMode(true);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await document.fonts.ready;
    const originalTitle = document.title;
    try { document.title = quotationFilename(quote); window.print(); }
    finally { document.title = originalTitle; }
    setMessage('เลือก Save as PDF ในหน้าต่างพิมพ์เพื่อบันทึกไฟล์');
  });

  const copyReviewPrompt = async () => {
    const text = quotationReviewPrompt(quote.number);
    try { await navigator.clipboard.writeText(text); }
    catch {
      const area = document.createElement('textarea');
      area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
    }
  };
  const createPdf = async redacted => {
    if (dirty || !selected) throw new Error('กรุณาบันทึกเอกสารก่อนสร้างไฟล์ เพื่อให้ PDF ตรงกับข้อมูลที่บันทึก');
    const context = {
      quote: redacted ? redactQuotationForAi(quote) : structuredClone(quote),
      status: selected.status || 'draft',
      revision: displayRevision,
      redacted,
    };
    setExportContext(context);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try { return await quotationElementToPdfFile(exportRef.current?.querySelector('.reference-document'), quotationFilename(quote), redacted); }
    finally { setExportContext(null); }
  };
  const sharePdfWithAi = redacted => run(async () => {
    const file = await createPdf(redacted);
    const payload = { title: file.name, text: quotationReviewPrompt(quote.number), files: [file] };
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try { await navigator.share(payload); }
      catch (error) { if (error.name === 'AbortError') { setMessage('ยกเลิกการแชร์แล้ว ไฟล์ในระบบไม่ได้เปลี่ยนแปลง'); return; } throw error; }
      setAiShareOpen(false); setMessage('ส่งไฟล์ไปยังเมนูแชร์แล้ว');
      return;
    }
    downloadFile(file); await copyReviewPrompt();
    setAiShareOpen(false);
    setMessage('อุปกรณ์นี้แชร์ไฟล์จากเว็บไม่ได้ จึงดาวน์โหลด PDF และคัดลอกคำสั่งตรวจให้แล้ว');
  });
  const downloadPdfForAi = redacted => run(async () => {
    const file = await createPdf(redacted);
    downloadFile(file); await copyReviewPrompt();
    setAiShareOpen(false);
    setMessage('ดาวน์โหลด PDF และคัดลอกคำสั่งตรวจแล้ว เปิด ChatGPT หรือ Gemini แล้วแนบไฟล์ได้ทันที');
  });
  const saveBankPreset = () => run(async () => {
    const bankName = String(quote.bankName || '').trim(), accountName = String(quote.bankAccountName || '').trim(), accountNumber = String(quote.bankAccountNumber || '').trim();
    if (!bankName || !accountName || !accountNumber) throw new Error('กรอกธนาคาร ชื่อบัญชี และเลขบัญชีให้ครบก่อนบันทึกเข้าคลัง');
    const existing = documentPresets.bankAccounts.find(item => item.accountNumber === accountNumber);
    const preset = { id: existing?.id || crypto.randomUUID(), label: `${bankName} · ${accountNumber.slice(-4)}`, bankName, accountName, accountNumber };
    const next = { ...documentPresets, bankAccounts: [preset, ...documentPresets.bankAccounts.filter(item => item.id !== preset.id)].slice(0, 20) };
    setDocumentPresets(await saveDocumentPresets(next)); setMessage('บันทึกบัญชีเข้าคลังแล้ว สามารถเลือกใช้กับใบเสนอราคาฉบับถัดไปได้');
  });
  const deleteBankPreset = id => run(async () => {
    if (!id || !window.confirm('ลบบัญชีนี้ออกจากคลัง?')) return;
    const next = { ...documentPresets, bankAccounts: documentPresets.bankAccounts.filter(item => item.id !== id) };
    setDocumentPresets(await saveDocumentPresets(next)); setMessage('ลบบัญชีออกจากคลังแล้ว');
  });
  const saveSignaturePreset = () => run(async () => {
    if (!quote.sellerSignatureImage) throw new Error('กรุณาเซ็นหรืออัปโหลดลายเซ็นก่อนบันทึกเข้าคลัง');
    const name = (quote.sellerSignerName || quote.salesperson || quote.seller || 'ผู้เสนอราคา').trim();
    const existing = documentPresets.signatures.find(item => item.name === name && item.image === quote.sellerSignatureImage);
    const preset = { id: existing?.id || crypto.randomUUID(), name, image: quote.sellerSignatureImage };
    const next = { ...documentPresets, signatures: [preset, ...documentPresets.signatures.filter(item => item.id !== preset.id)].slice(0, 5) };
    setDocumentPresets(await saveDocumentPresets(next)); setMessage('บันทึกลายเซ็นเข้าคลังแล้ว');
  });
  const deleteSignaturePreset = id => run(async () => {
    if (!id || !window.confirm('ลบลายเซ็นนี้ออกจากคลัง?')) return;
    const next = { ...documentPresets, signatures: documentPresets.signatures.filter(item => item.id !== id) };
    setDocumentPresets(await saveDocumentPresets(next)); setMessage('ลบลายเซ็นออกจากคลังแล้ว');
  });

  const actions = <div className="quote-controls"><button className="quote-save" disabled={locked || !dirty || !!calculation.error} onClick={save}>คำนวณและบันทึก{dirty ? ' *' : ''}</button><button className="quote-preview-button" disabled={!!calculation.error} onClick={() => setPreviewMode(current => !current)}>{previewMode ? '← กลับมาแก้ไข' : 'ดูตัวอย่าง'}</button><button disabled={locked || dirty || !selected} onClick={issue}>ออกเอกสาร REV. {String(displayRevision || 1).padStart(2, '0')}</button><button disabled={busy} onClick={copy}>ทำสำเนา</button><button disabled={busy || dirty || !selected} onClick={print}>พิมพ์ / PDF</button><button className="quote-ai-share" disabled={busy || dirty || !selected || !!calculation.error} onClick={() => setAiShareOpen(true)}>แชร์ PDF ให้ AI ตรวจ</button>{selected?.status === 'draft' && selected.revision === 0 && <button className="quote-danger" disabled={busy || dirty} onClick={removeDraft}>ลบร่าง</button>}{selected?.status === 'issued' && <><button disabled={busy} onClick={() => transition('draft')}>สร้าง REV. ราคาใหม่</button><button disabled={busy} onClick={() => navigate('/admin/receipts', { state: { quote: structuredClone(quote), totals: calculation.totals } })}>สร้างใบเสร็จ</button><button disabled={busy} onClick={() => transition('void')}>ยกเลิกเอกสาร</button></>}{selected && <button disabled={busy} onClick={() => run(async () => { setHistory(await listRevisions(selected.id)); setMessage('โหลดประวัติ REV. แล้ว'); })}>ประวัติ REV.</button>}</div>;
  const filteredRows = rows.filter(row => `${row.quote.number} ${row.quote.customer} ${row.quote.project} ${row.status}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="quotation-workspace">
    <header className="quote-toolbar"><Link to="/admin" onClick={event => { if (!confirmLeave()) event.preventDefault(); }}>← ระบบจัดการ</Link><Link to="/admin/receipts" onClick={event => { if (!confirmLeave()) event.preventDefault(); }}>ใบเสร็จรับเงิน</Link><h1>ใบเสนอราคา A4 · REV. {String(displayRevision).padStart(2, '0')}</h1><button disabled={busy} onClick={() => open(null)}>สร้างใหม่</button><button disabled={busy || locked} onClick={() => run(async () => { const defaults = await saveCompanyDefaults(quote); setCompanyDefaults(defaults); setMessage('บันทึกข้อมูลบริษัทเป็นค่าเริ่มต้นแล้ว'); })}>จำข้อมูลบริษัท</button><button disabled={busy} onClick={() => { if (confirmLeave()) { setSelected(null); setQuote(applyCompanyDefaults(demoQuote(), companyDefaults)); setDirty(true); setHistoric(null); setPreviewMode(false); setHistory([]); touched.current = true; } }}>โหลดตัวอย่าง</button></header>
    <p className="quote-message" role="status" aria-live="polite">{message || 'กรอก แก้ไข เพิ่มรายการ คำนวณ และบันทึกบนแบบฟอร์ม A4 นี้ได้ทันที'}</p>
    <div className="quote-layout"><aside className="quote-sidebar"><label>ค้นหาเอกสาร<input value={search} onChange={event => setSearch(event.target.value)} placeholder="เลข / ลูกค้า / โครงการ / สถานะ" /></label><button disabled={busy} onClick={() => run(async () => { if (confirmLeave()) { const data = await listQuotes(); setRows(data); setMessage('โหลดรายการล่าสุดแล้ว'); } })}>รีเฟรชรายการ</button><p>แสดงล่าสุดไม่เกิน 200 เอกสาร</p>{filteredRows.map(row => <button disabled={busy} className={selected?.id === row.id ? 'selected' : ''} key={row.id} onClick={() => open(row)}><b>{row.quote.number || 'ร่างไม่มีเลข'}</b><span>{row.quote.customer || 'ยังไม่มีชื่อลูกค้า'}</span><small>{({ draft: 'ร่าง', issued: 'ออกแล้ว', void: 'ยกเลิก' })[row.status]}</small></button>)}</aside>
      <main className="quote-a4-stage">{historic ? <><div className="quote-history-bar"><button onClick={() => setHistoric(null)}>← กลับมาแก้ฉบับปัจจุบัน</button><b>กำลังดู REV. {String(historic.revision).padStart(2, '0')}</b></div><QuotationPreview quote={historic.quote} status="issued" revision={historic.revision} /></> : previewMode ? <><div className="quote-preview-actions">{actions}</div><QuotationPreview quote={quote} status={selected?.status || 'draft'} revision={displayRevision} /></> : <QuotationA4Form quote={quote} revision={displayRevision} calculation={calculation} locked={locked} actions={actions} edit={edit} sectionEdit={editSection} itemEdit={itemEdit} presets={documentPresets} onSaveBankPreset={saveBankPreset} onDeleteBankPreset={deleteBankPreset} onSaveSignaturePreset={saveSignaturePreset} onDeleteSignaturePreset={deleteSignaturePreset} addItem={sectionIndex => editSection(sectionIndex, section => ({ ...section, items: [...section.items, newItem()] }))} removeItem={(sectionIndex, itemIndex) => editSection(sectionIndex, section => ({ ...section, items: section.items.filter((_, i) => i !== itemIndex) }))} addSection={() => updateSections(sections => [...sections, { id: crypto.randomUUID(), title: 'หมวดใหม่', kind: 'main', items: [newItem()] }])} removeSection={sectionIndex => updateSections(sections => sections.filter((_, i) => i !== sectionIndex))} />}
        {history.length > 0 && <div className="quote-history-list">{history.map(revision => <button key={revision.id} onClick={() => setHistoric(revision)}>ดู REV. {String(revision.revision).padStart(2, '0')}</button>)}</div>}
      </main>
    </div>
    {aiShareOpen && <AiShareDialog busy={busy} onClose={() => setAiShareOpen(false)} onShare={sharePdfWithAi} onDownload={downloadPdfForAi} />}
    {exportContext && <div className="pdf-export-host" ref={exportRef} aria-hidden="true"><QuotationPreview quote={exportContext.quote} status={exportContext.status} revision={exportContext.revision} /></div>}
  </div>;
}
