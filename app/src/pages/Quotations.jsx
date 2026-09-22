import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateQuote, catalogItemToQuoteItem, demoQuote, newItem, newQuote, quoteItemToCatalogInput, validateIssue } from '../lib/quotation';
import { changeQuoteStatus, deleteDraftQuote, issueQuote, listQuotes, listRevisions, saveQuote } from '../firebase/quotations';
import { applyCompanyDefaults, getCompanyDefaults, getDocumentPresets, nextDocumentNumber, saveCompanyDefaults, saveDocumentPresets } from '../firebase/documents';
import { listPriceCatalog, savePriceCatalogItem } from '../firebase/priceCatalog';
import QuotationA4Form from '../components/QuotationA4Form';
import QuotationPreview from '../components/QuotationPreview';
import AiShareDialog from '../components/AiShareDialog';
import AdminRouteDock from '../components/AdminRouteDock';
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historic, setHistoric] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [aiShareOpen, setAiShareOpen] = useState(false);
  const [exportContext, setExportContext] = useState(null);
  const [companyDefaults, setCompanyDefaults] = useState({});
  const [documentPresets, setDocumentPresets] = useState({ bankAccounts: [], signatures: [] });
  const [priceCatalog, setPriceCatalog] = useState([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogSection, setCatalogSection] = useState(0);
  const operation = useRef(false);
  const historyReader = useRef(null);
  const touched = useRef(false);
  const loadedDocument = useRef(false);
  const exportRef = useRef(null);
  const locked = busy || (!!selected && selected.status !== 'draft');
  const displayRevision = selected?.status === 'draft' && selected.revision > 0 ? selected.revision + 1 : selected?.revision || 0;
  const calculation = useMemo(() => {
    try { return { totals: calculateQuote(quote), error: '' }; }
    catch (error) { return { totals: null, error: error.message || 'ยังคำนวณยอดไม่ได้' }; }
  }, [quote]);

  useEffect(() => {
    listQuotes().then(data => {
      setRows(data);
      if (data[0]) {
        loadedDocument.current = true; setSelected(data[0]); setQuote(structuredClone(data[0].quote)); setDirty(false);
      }
    }).catch(() => setMessage('โหลดเอกสารไม่ได้ กรุณาตรวจการเชื่อมต่อและสิทธิ์ผู้ดูแล'));
    getCompanyDefaults().then(defaults => {
      setCompanyDefaults(defaults);
      if (!touched.current && !loadedDocument.current) setQuote(current => applyCompanyDefaults(current, defaults));
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
    loadedDocument.current = !!row; setSelected(row); setQuote(row ? structuredClone(row.quote) : applyCompanyDefaults(newQuote(), companyDefaults)); setDirty(false); setHistory([]); setHistoryOpen(false); setHistoric(null); setPreviewMode(false); setMessage(''); touched.current = false;
  };
  const edit = (key, value) => { touched.current = true; setQuote(current => ({ ...current, [key]: value })); setDirty(true); setHistoric(null); setPreviewMode(false); };
  const updateSections = updater => { touched.current = true; setQuote(current => ({ ...current, sections: updater(current.sections) })); setDirty(true); setHistoric(null); setPreviewMode(false); };
  const editSection = (index, updater) => updateSections(sections => sections.map((section, i) => i === index ? updater(section) : section));
  const itemEdit = (sectionIndex, itemIndex, key, value) => {
    updateSections(sections => sections.map((section, i) => i === sectionIndex ? { ...section, items: section.items.map((item, j) => j === itemIndex ? { ...item, [key]: value } : item) } : section));
  };
  const openCatalog = async sectionIndex => {
    setCatalogSection(sectionIndex); setCatalogQuery(''); setCatalogOpen(true);
    if (priceCatalog.length) return;
    try { setPriceCatalog(await listPriceCatalog()); }
    catch (error) { setMessage(error.message || 'โหลดคลังราคาไม่ได้'); }
  };
  const addCatalogItem = item => {
    updateSections(sections => sections.map((section, index) => index === catalogSection ? { ...section, items: [...section.items, catalogItemToQuoteItem(item)] } : section));
    setCatalogOpen(false); setMessage(`เพิ่ม ${item.name} จากคลังราคาแล้ว — ปรับราคาเฉพาะใบเสนอราคานี้ได้`);
  };
  const saveItemToCatalog = (sectionIndex, itemIndex, mode) => run(async () => {
    const item = quote.sections[sectionIndex]?.items[itemIndex];
    if (!item?.description?.trim() || !item.unit?.trim()) throw new Error('กรอกรายละเอียดและหน่วยให้ครบก่อนบันทึกเข้าคลังราคา');
    const catalog = priceCatalog.length ? priceCatalog : await listPriceCatalog();
    if (!priceCatalog.length) setPriceCatalog(catalog);
    const original = catalog.find(row => row.id === item.catalogItemId);
    if (mode === 'update' && !original) throw new Error('รายการนี้ยังไม่ได้มาจากคลังราคา กรุณาบันทึกเป็นรายการใหม่');
    const id = await savePriceCatalogItem(mode === 'update' ? original.id : null, quoteItemToCatalogInput(item, original));
    const refreshed = await listPriceCatalog(); setPriceCatalog(refreshed);
    const saved = refreshed.find(row => row.id === id);
    if (saved) itemEdit(sectionIndex, itemIndex, 'catalogItemId', saved.id);
    setMessage(mode === 'update' ? 'อัปเดต REV. ราคากลางแล้ว' : 'บันทึกรายการใหม่เข้าคลังราคาแล้ว');
  });
  const run = async action => {
    if (operation.current) return;
    operation.current = true; setBusy(true); setMessage('กำลังดำเนินการ...');
    try { await action(); } catch (error) { setMessage(error.message || 'ดำเนินการไม่สำเร็จ ข้อมูลยังอยู่'); }
    finally { operation.current = false; setBusy(false); }
  };
  const reload = async id => {
    const data = await listQuotes(); setRows(data);
    const row = data.find(item => item.id === id);
    if (row) { loadedDocument.current = true; setSelected(row); setQuote(structuredClone(row.quote)); }
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

  const showRevisionHistory = () => run(async () => { if (!selected) return; setHistory(await listRevisions(selected.id)); setHistoryOpen(true); setMessage('เลือก REV. ที่ต้องการดูได้ทันที'); });
  const leaveTo = path => { if (confirmLeave()) navigate(path); };
  const dockActions = [
    { id: 'workspace', icon: '⌂', label: 'หน้าทำงาน', onClick: () => leaveTo('/admin') },
    { id: 'new', icon: '＋', label: 'สร้างใบเสนอราคาใหม่', onClick: () => open(null), disabled: busy },
    { id: 'save', icon: '✓', label: 'คำนวณและบันทึก', onClick: save, disabled: locked || !dirty || !!calculation.error },
    { id: 'preview', icon: '◫', label: previewMode ? '← กลับมาแก้ไข' : 'ดูตัวอย่าง', onClick: () => setPreviewMode(current => !current), disabled: !!calculation.error, active: previewMode },
    { id: 'issue', icon: '◆', label: `ออกเอกสาร REV. ${String(displayRevision || 1).padStart(2, '0')}`, onClick: issue, disabled: locked || dirty || !selected },
    { id: 'copy', icon: '⧉', label: 'ทำสำเนา', onClick: copy, disabled: busy },
    { id: 'print', icon: '⎙', label: 'พิมพ์ / PDF', onClick: print, disabled: busy || dirty || !selected },
    { id: 'share', icon: '↗', label: 'แชร์ PDF ให้ AI ตรวจ', onClick: () => setAiShareOpen(true), disabled: busy || dirty || !selected || !!calculation.error },
    { id: 'history', icon: '↶', label: 'ประวัติ REV.', onClick: showRevisionHistory, disabled: busy || !selected },
    { id: 'receipt', icon: '◫', label: 'ใบเสร็จ', onClick: () => navigate('/admin/receipts', { state: { quote: structuredClone(quote), totals: calculation.totals } }), disabled: busy || selected?.status !== 'issued' },
    { id: 'defaults', icon: '▣', label: 'จำข้อมูลบริษัท', onClick: () => run(async () => { const defaults = await saveCompanyDefaults(quote); setCompanyDefaults(defaults); setMessage('บันทึกข้อมูลบริษัทเป็นค่าเริ่มต้นแล้ว'); }), disabled: busy || locked },
    { id: 'demo', icon: '◇', label: 'โหลดตัวอย่าง', onClick: () => { if (confirmLeave()) { setSelected(null); setQuote(applyCompanyDefaults(demoQuote(), companyDefaults)); setDirty(true); setHistoric(null); setPreviewMode(false); setHistory([]); touched.current = true; } }, disabled: busy },
    ...(selected?.status === 'draft' && selected.revision === 0 ? [{ id: 'delete', icon: '×', label: 'ลบร่าง', onClick: removeDraft, disabled: busy || dirty }] : []),
    ...(selected?.status === 'issued' ? [{ id: 'new-revision', icon: '＋', label: 'สร้าง REV. ราคาใหม่', onClick: () => transition('draft'), disabled: busy }, { id: 'void', icon: '!', label: 'ยกเลิกเอกสาร', onClick: () => transition('void'), disabled: busy }] : []),
  ];
  const filteredRows = rows.filter(row => `${row.quote.number} ${row.quote.customer} ${row.quote.project} ${row.status}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (historic) historyReader.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [historic]);

  return <><AdminRouteDock activePath="/admin/quotations" actions={dockActions} /><div className="quotation-workspace">
    <header className="quote-toolbar"><h1>ใบเสนอราคา A4 · REV. {String(displayRevision).padStart(2, '0')}</h1></header>
    <p className="quote-message" role="status" aria-live="polite">{message || 'กรอก แก้ไข เพิ่มรายการ คำนวณ และบันทึกบนแบบฟอร์ม A4 นี้ได้ทันที'}</p>
    <div className="quote-layout"><aside className="quote-sidebar"><label>ค้นหาเอกสาร<input value={search} onChange={event => setSearch(event.target.value)} placeholder="เลข / ลูกค้า / โครงการ / สถานะ" /></label><button disabled={busy} onClick={() => run(async () => { if (confirmLeave()) { const data = await listQuotes(); setRows(data); setMessage('โหลดรายการล่าสุดแล้ว'); } })}>รีเฟรชรายการ</button><p>แสดงล่าสุดไม่เกิน 200 เอกสาร</p>{filteredRows.map(row => <button disabled={busy} className={selected?.id === row.id ? 'selected' : ''} key={row.id} onClick={() => open(row)}><b>{row.quote.number || 'ร่างไม่มีเลข'}</b><span>{row.quote.customer || 'ยังไม่มีชื่อลูกค้า'}</span><small>{({ draft: 'ร่าง', issued: 'ออกแล้ว', void: 'ยกเลิก' })[row.status]}</small></button>)}</aside>
      <main className="quote-a4-stage">{historic ? <section className="quote-history-reader" ref={historyReader}><div className="quote-history-bar"><div><small>โหมดอ่านเอกสารที่ออกแล้ว</small><b>REV. {String(historic.revision).padStart(2, '0')}</b></div><button onClick={() => setHistoric(null)}>← กลับไปฉบับปัจจุบัน</button></div><p className="quote-history-hint">เลื่อนขึ้นลงเพื่ออ่านเอกสารทั้งฉบับ</p><QuotationPreview quote={historic.quote} status="issued" revision={historic.revision} /></section> : previewMode ? <QuotationPreview quote={quote} status={selected?.status || 'draft'} revision={displayRevision} /> : <QuotationA4Form quote={quote} revision={displayRevision} calculation={calculation} locked={locked} edit={edit} sectionEdit={editSection} itemEdit={itemEdit} presets={documentPresets} onSaveBankPreset={saveBankPreset} onDeleteBankPreset={deleteBankPreset} onSaveSignaturePreset={saveSignaturePreset} onDeleteSignaturePreset={deleteSignaturePreset} addItem={sectionIndex => editSection(sectionIndex, section => ({ ...section, items: [...section.items, newItem()] }))} addCatalogItem={openCatalog} onSaveItemToCatalog={saveItemToCatalog} removeItem={(sectionIndex, itemIndex) => editSection(sectionIndex, section => ({ ...section, items: section.items.filter((_, i) => i !== itemIndex) }))} addSection={() => updateSections(sections => [...sections, { id: crypto.randomUUID(), title: 'หมวดใหม่', kind: 'main', items: [newItem()] }])} removeSection={sectionIndex => updateSections(sections => sections.filter((_, i) => i !== sectionIndex))} />}
      </main>
    </div>
    {aiShareOpen && <AiShareDialog busy={busy} onClose={() => setAiShareOpen(false)} onShare={sharePdfWithAi} onDownload={downloadPdfForAi} />}
    {historyOpen && <div className="quote-history-modal" role="dialog" aria-modal="true" aria-label="ประวัติ REV. ใบเสนอราคา"><section><header><div><p>ประวัติเอกสาร</p><h2>{quote.number || 'ใบเสนอราคา'}</h2></div><button onClick={() => setHistoryOpen(false)} aria-label="ปิด">×</button></header><div className="quote-history-cards">{history.map(revision => <button key={revision.id} onClick={() => { setHistoric(revision); setHistoryOpen(false); setPreviewMode(false); }}><b>REV. {String(revision.revision).padStart(2, '0')}</b><span>{revision.reason || 'ไม่มีหมายเหตุ'}</span><small>{revision.issuedAt?.toDate ? revision.issuedAt.toDate().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'วันที่ออกเอกสาร'}</small><strong>{Number(revision.totals?.grandTotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</strong></button>)}{history.length === 0 && <p>ยังไม่มี REV. ที่ออกเอกสารแล้ว</p>}</div></section></div>}
    {catalogOpen && <div className="catalog-picker-modal" role="dialog" aria-modal="true" aria-label="เลือกรายการจากคลังราคา"><section><header><div><p>เพิ่มจากราคากลาง</p><h2>เลือกรายการสำหรับ {quote.sections[catalogSection]?.title || 'หมวดงาน'}</h2></div><button onClick={() => setCatalogOpen(false)}>×</button></header><input autoFocus value={catalogQuery} placeholder="ค้นหารหัส รายการ สเปก หรือหมวดงาน" onChange={event => setCatalogQuery(event.target.value)} /><div className="catalog-picker-list">{priceCatalog.filter(item => item.active !== false && `${item.code} ${item.name} ${item.specification} ${item.category}`.toLowerCase().includes(catalogQuery.toLowerCase())).map(item => <button key={item.id} onClick={() => addCatalogItem(item)}><b>{item.code} · {item.name}</b><span>{item.specification || item.category} · {item.unit}</span><strong>{Number(item.companyPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</strong></button>)}{priceCatalog.length === 0 && <p>กำลังโหลดคลังราคา…</p>}</div></section></div>}
    {exportContext && <div className="pdf-export-host" ref={exportRef} aria-hidden="true"><QuotationPreview quote={exportContext.quote} status={exportContext.status} revision={exportContext.revision} /></div>}
  </div></>;
}
