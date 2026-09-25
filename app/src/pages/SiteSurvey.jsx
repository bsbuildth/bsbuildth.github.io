import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import AdminRouteDock from '../components/AdminRouteDock';
import { db } from '../firebase/config';
import { listQuotes } from '../firebase/quotations';
import './SiteSurvey.css';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const empty = () => ({ id: crypto.randomUUID(), point: '', width: '', length: '', height: '', qty: '1', note: '' });
const number = value => Math.max(0, Number(value) || 0);

export default function SiteSurvey() {
  const [jobs, setJobs] = useState([]); const [jobId, setJobId] = useState(''); const [date, setDate] = useState(today);
  const [contact, setContact] = useState(''); const [address, setAddress] = useState(''); const [note, setNote] = useState(''); const [rows, setRows] = useState([empty()]);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => { listQuotes().then(items => { const active = items.filter(item => item.status === 'issued' && item.approval?.state === 'approved').map(item => ({ id:item.id, number:item.quote?.number || '', title:item.quote?.project || item.quote?.customer || 'งานที่อนุมัติแล้ว', customer:item.quote?.customer || '' })); setJobs(active); setJobId(active[0]?.id || ''); }).catch(() => setMessage('โหลดงานที่อนุมัติไม่สำเร็จ')); }, []);
  const job = useMemo(() => jobs.find(item => item.id === jobId), [jobs, jobId]);
  const area = row => number(row.width) * number(row.length) * number(row.qty);
  const total = rows.reduce((sum, row) => sum + area(row), 0);
  const change = (id, field, value) => setRows(current => current.map(row => row.id === id ? { ...row, [field]: value } : row));
  const save = async event => { event.preventDefault(); if (!job) return setMessage('เลือกงานก่อนบันทึก'); try { setBusy(true); setMessage('กำลังบันทึกผลสำรวจ…'); await addDoc(collection(db, 'siteSurveys'), { quoteId: job.id, quoteNumber: job.number, projectName: job.title, customer: job.customer, surveyDate: date, contact:contact.trim(), address:address.trim(), note:note.trim(), measurements:rows.map(row => ({ ...row, area:area(row) })), totalArea:total, status:'draft', createdAt:serverTimestamp(), updatedAt:serverTimestamp() }); setMessage(`บันทึกแล้ว · พื้นที่รวม ${total.toFixed(2)} ตร.ม.`); setRows([empty()]); setNote(''); } catch { setMessage('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง'); } finally { setBusy(false); } };
  return <><AdminRouteDock activePath="/admin/site-survey"/><main className="site-survey"><Link to="/admin">← ระบบจัดการ</Link><p>สำรวจหน้างาน</p><h1>วัดพื้นที่และบันทึกจุดทำงาน</h1><span>กรอกด้วยมือถือ แล้วนำข้อมูลไปตั้งราคาต่อได้</span><form onSubmit={save}><label>งานที่อนุมัติแล้ว<select value={jobId} onChange={e=>setJobId(e.target.value)}>{jobs.map(item=><option key={item.id} value={item.id}>{item.number} · {item.title}</option>)}</select></label><div className="survey-grid"><label>วันที่<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>ผู้ติดต่อ<input value={contact} onChange={e=>setContact(e.target.value)} placeholder="ชื่อ / โทรศัพท์"/></label></div><label>สถานที่ / จุดนัดหมาย<textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="บ้านเลขที่, ซอย, จุดสังเกต"/></label><section><header><b>จุดที่ต้องวัด</b><strong>รวม {total.toFixed(2)} ตร.ม.</strong></header>{rows.map((row,index)=><article key={row.id}><input value={row.point} onChange={e=>change(row.id,'point',e.target.value)} placeholder={`จุดงาน ${index+1} เช่น พื้นครัว`}/><div className="survey-measure"><input inputMode="decimal" value={row.width} onChange={e=>change(row.id,'width',e.target.value)} placeholder="กว้าง ม."/><span>×</span><input inputMode="decimal" value={row.length} onChange={e=>change(row.id,'length',e.target.value)} placeholder="ยาว ม."/><input inputMode="decimal" value={row.qty} onChange={e=>change(row.id,'qty',e.target.value)} placeholder="จำนวน"/></div><small>{area(row).toFixed(2)} ตร.ม.</small><textarea value={row.note} onChange={e=>change(row.id,'note',e.target.value)} placeholder="สภาพงาน / วัสดุ / ข้อสังเกต"/></article>)}<button type="button" className="survey-add" onClick={()=>setRows(current=>[...current,empty()])}>＋ เพิ่มจุดวัด</button></section><label>หมายเหตุสำคัญ<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="สิ่งที่ต้องประเมินเพิ่ม หรือแจ้งลูกค้า"/></label><button className="survey-save" disabled={busy}>{busy?'กำลังบันทึก…':'บันทึกผลสำรวจ'}</button>{message&&<p role="status">{message}</p>}</form></main></>;
}
