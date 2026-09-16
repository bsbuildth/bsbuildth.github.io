import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPriceCatalog, savePriceCatalogItem, seedPriceCatalog } from '../firebase/priceCatalog';
import { calculateCatalogPrice, MATERIAL_GROUPS, newPriceItem, WORK_CATEGORIES } from '../lib/priceCatalog';
import './PriceCatalog.css';

const money = value => Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numberFields = ['materialCost', 'laborCost', 'wastePercent', 'transportPercent', 'materialMarkupPercent', 'overheadPercent', 'companyAdjustmentPercent', 'companyPrice'];

export default function PriceCatalog() {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState(newPriceItem);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => { setBusy(true); try { setRows(await listPriceCatalog()); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  useEffect(() => {
    let cancelled = false;
    listPriceCatalog()
      .then(data => { if (!cancelled) setRows(data); })
      .catch(error => { if (!cancelled) setMessage(error.message); });
    return () => { cancelled = true; };
  }, []);
  const calculated = useMemo(() => calculateCatalogPrice(draft), [draft]);
  const filtered = rows.filter(row => (category === 'ทั้งหมด' || row.category === category) && `${row.code} ${row.name} ${row.specification} ${row.materialGroup}`.toLowerCase().includes(query.toLowerCase()));
  const edit = (key, value) => setDraft(current => ({ ...current, [key]: numberFields.includes(key) ? Math.max(0, Number(value) || 0) : value }));
  const reset = () => { setDraft(newPriceItem()); setEditingId(null); setMessage('พร้อมเพิ่มรายการใหม่'); };
  const save = async event => {
    event.preventDefault();
    if (!draft.code || !draft.name || !draft.unit) { setMessage('กรอกรหัส รายการ และหน่วยให้ครบก่อนบันทึก'); return; }
    setBusy(true);
    try { await savePriceCatalogItem(editingId, draft); await load(); reset(); setMessage('บันทึกรายการและประวัติราคาแล้ว'); }
    catch (error) { setMessage(error.message); setBusy(false); }
  };
  const startEdit = row => { setDraft({ ...newPriceItem(), ...row }); setEditingId(row.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const seed = async () => {
    if (!window.confirm('เพิ่มชุดข้อมูลตั้งต้น 2569 จำนวน 27 รายการ? คุณสามารถแก้ราคาเป็นของคุณได้ทุกเมื่อ')) return;
    setBusy(true);
    try { const count = await seedPriceCatalog(); await load(); setMessage(`เพิ่มข้อมูลตั้งต้น ${count} รายการแล้ว`); }
    catch (error) { setMessage(error.message); setBusy(false); }
  };

  return <main className="price-catalog-page">
    <header className="price-catalog-header"><div><Link to="/admin">← ระบบจัดการ</Link><p>คลังข้อมูลราคา</p><h1>ราคากลาง 2569 และราคาบริษัท</h1><span>เก็บต้นทุนวัสดุ ค่าแรง ค่าเผื่อ และราคาที่คุณปรับใช้เอง โดยไม่กระทบใบเสนอราคาเก่า</span></div><div className="price-catalog-actions"><button onClick={load} disabled={busy}>รีเฟรช</button>{rows.length === 0 && <button className="price-primary" onClick={seed} disabled={busy}>เพิ่มข้อมูลตั้งต้น 2569</button>}</div></header>
    {message && <p className="price-message" role="status">{message}</p>}
    <section className="price-guide"><b>สูตรราคากลาง</b><span>ต้นทุนวัสดุ → เผื่อสูญเสีย → ขนส่ง → บวกค่าวัสดุ → รวมค่าแรง → ค่าใช้จ่ายแฝง</span><small>ข้อมูลตั้งต้นเป็นราคาอ้างอิงภายใน โปรดตรวจและปรับตามผู้ขาย ต้นทุน และหน้างานของคุณก่อนใช้ออกเอกสาร</small></section>
    <section className="price-layout">
      <form className="price-editor" onSubmit={save}><div className="price-editor-heading"><div><p>{editingId ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}</p><h2>{editingId ? draft.name : 'รายการราคากลางใหม่'}</h2></div>{editingId && <button type="button" onClick={reset}>ยกเลิกแก้ไข</button>}</div>
        <div className="price-fields price-fields-core"><label>รหัสรายการ<input value={draft.code} maxLength="50" placeholder="เช่น ROF-001" onChange={event => edit('code', event.target.value)} /></label><label>ชื่อรายการ<input value={draft.name} maxLength="240" placeholder="เช่น หลังคาเมทัลชีท PU Foam" onChange={event => edit('name', event.target.value)} /></label><label>หมวดงาน<select value={draft.category} onChange={event => edit('category', event.target.value)}>{WORK_CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label><label>กลุ่มวัสดุ<select value={draft.materialGroup} onChange={event => edit('materialGroup', event.target.value)}>{MATERIAL_GROUPS.map(value => <option key={value}>{value}</option>)}</select></label><label>สเปก<input value={draft.specification} maxLength="500" placeholder="สเปก/ขนาด/ยี่ห้อ" onChange={event => edit('specification', event.target.value)} /></label><label>หน่วย<input value={draft.unit} maxLength="40" placeholder="ตร.ม., เมตร, จุด, ชุด" onChange={event => edit('unit', event.target.value)} /></label></div>
        <h3>ต้นทุนและค่าเผื่อ</h3><div className="price-fields"><label>ต้นทุนวัสดุ / หน่วย<input type="number" min="0" step="0.01" value={draft.materialCost} onChange={event => edit('materialCost', event.target.value)} /></label><label>ค่าแรง / หน่วย<input type="number" min="0" step="0.01" value={draft.laborCost} onChange={event => edit('laborCost', event.target.value)} /></label><label>เผื่อสูญเสีย (%)<input type="number" min="0" step="0.01" value={draft.wastePercent} onChange={event => edit('wastePercent', event.target.value)} /></label><label>ขนส่ง/สิ้นเปลือง (%)<input type="number" min="0" step="0.01" value={draft.transportPercent} onChange={event => edit('transportPercent', event.target.value)} /></label><label>บวกค่าวัสดุ (%)<input type="number" min="0" step="0.01" value={draft.materialMarkupPercent} onChange={event => edit('materialMarkupPercent', event.target.value)} /></label><label>ค่าใช้จ่ายแฝง (%)<input type="number" min="0" step="0.01" value={draft.overheadPercent} onChange={event => edit('overheadPercent', event.target.value)} /></label></div>
        <h3>ราคาของบริษัท</h3><div className="price-fields"><label>วิธีปรับราคา<select value={draft.companyMode} onChange={event => edit('companyMode', event.target.value)}><option value="percent">เพิ่ม/ลดจากราคากลาง (%)</option><option value="fixed">กำหนดราคาขายเอง</option></select></label>{draft.companyMode === 'fixed' ? <label>ราคาบริษัท / หน่วย<input type="number" min="0" step="0.01" value={draft.companyPrice} onChange={event => edit('companyPrice', event.target.value)} /></label> : <label>เพิ่ม/ลดจากราคากลาง (%)<input type="number" step="0.01" value={draft.companyAdjustmentPercent} onChange={event => edit('companyAdjustmentPercent', event.target.value)} /></label>}<label className="price-source">แหล่งอ้างอิง<input value={draft.source} maxLength="500" onChange={event => edit('source', event.target.value)} /></label></div>
        <div className="price-result"><span>ราคากลางคำนวณ</span><b>{money(calculated.centralPrice)} บาท / {draft.unit || 'หน่วย'}</b><small>วัสดุพร้อมใช้ {money(calculated.materialSell)} + ค่าแรง {money(calculated.laborCost)}</small><span>ราคาบริษัท</span><strong>{money(calculated.companyPrice)} บาท / {draft.unit || 'หน่วย'}</strong></div><label className="price-active"><input type="checkbox" checked={draft.active} onChange={event => edit('active', event.target.checked)} /> เปิดให้เลือกใช้งาน</label><button className="price-primary price-save" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึกราคา'}</button></form>
      <aside className="price-summary"><b>สรุปคลังราคา</b><strong>{rows.length}</strong><span>รายการทั้งหมด</span><p>{rows.filter(row => row.active !== false).length} รายการเปิดใช้งาน</p><p>{new Set(rows.map(row => row.category)).size} หมวดงาน</p><p>ทุกครั้งที่แก้ไข ระบบเก็บประวัติราคาเป็นเวอร์ชันใหม่</p></aside>
    </section>
    <section className="price-list"><header><div><p>รายการในคลัง</p><h2>เลือกแก้ไขหรือปรับราคาเฉพาะบริษัท</h2></div><input value={query} placeholder="ค้นหารหัส รายการ หรือสเปก" onChange={event => setQuery(event.target.value)} /></header><div className="price-filters"><button className={category === 'ทั้งหมด' ? 'active' : ''} onClick={() => setCategory('ทั้งหมด')}>ทั้งหมด</button>{WORK_CATEGORIES.filter(item => rows.some(row => row.category === item)).map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="price-cards">{filtered.map(row => <article key={row.id} className={row.active === false ? 'inactive' : ''}><header><span>{row.code}</span><button onClick={() => startEdit(row)}>แก้ไข</button></header><h3>{row.name}</h3><p>{row.specification || row.materialGroup}</p><small>{row.category} · {row.unit}</small><div><label>ราคากลาง<b>{money(row.centralPrice)} บาท</b></label><label>ราคาบริษัท<strong>{money(row.companyPrice)} บาท</strong></label></div><footer>วัสดุ {money(row.materialCost)} · ค่าแรง {money(row.laborCost)} · REV. {String(row.version || 1).padStart(2, '0')}</footer></article>)}{!busy && filtered.length === 0 && <p className="price-empty">ยังไม่มีรายการตรงกับตัวกรอง</p>}</div></section>
  </main>;
}
