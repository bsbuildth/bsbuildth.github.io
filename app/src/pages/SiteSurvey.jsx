import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import AdminRouteDock from '../components/AdminRouteDock';
import { db } from '../firebase/config';
import { uploadSurveyPhotosWithFreeDrive, validateSitePhotos } from '../firebase/siteUpdates';
import SiteSurveyReports from './SiteSurveyReports';
import './SiteSurvey.css';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const empty = () => ({ id: crypto.randomUUID(), pointType: 'floor', point: '', width: '', length: '', height: '', qty: '1', note: '', files: [] });
const pointTypes = [['floor','พื้น'],['wall','ผนัง'],['roof','หลังคา'],['plumbing','งานระบบน้ำ'],['electrical','งานระบบไฟ'],['other','อื่นๆ ระบุ']];
const number = value => Math.max(0, Number(value) || 0);

export default function SiteSurvey() {
  const [projectName, setProjectName] = useState(''); const [customer, setCustomer] = useState(''); const [date, setDate] = useState(today);
  const [contact, setContact] = useState(''); const [address, setAddress] = useState(''); const [note, setNote] = useState(''); const [location, setLocation] = useState(null); const [rows, setRows] = useState([empty()]);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const [screen, setScreen] = useState('form');
  const area = row => number(row.width) * number(row.length) * number(row.qty);
  const total = rows.reduce((sum, row) => sum + area(row), 0);
  const change = (id, field, value) => setRows(current => current.map(row => row.id === id ? { ...row, [field]: value } : row));
  const choosePhotos = (id, files) => { try { validateSitePhotos(files); change(id, 'files', Array.from(files)); } catch (error) { setMessage(error.message); } };
  const removePhoto = (id, index) => setRows(current => current.map(row => row.id === id ? { ...row, files: row.files.filter((_, item) => item !== index) } : row));
  const pinLocation = () => {
    if (!navigator.geolocation) return setMessage('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง');
    setMessage('กำลังหาตำแหน่งปัจจุบัน…');
    navigator.geolocation.getCurrentPosition(position => {
      setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: Math.round(position.coords.accuracy) });
      setMessage('ปักหมุดตำแหน่งแล้ว');
    }, () => setMessage('ไม่สามารถปักหมุดได้ กรุณาอนุญาตตำแหน่งในเบราว์เซอร์'), { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  };
  const save = async event => { event.preventDefault(); if (!projectName.trim() || !customer.trim()) return setMessage('กรอกชื่อลูกค้าและชื่อโครงการก่อน'); try {
    setBusy(true); const uploads = rows.flatMap(row => row.files.map(file => ({ file, measurementId: row.id })));
    setMessage(uploads.length ? 'กำลังบันทึกและส่งรูปเข้า Drive…' : 'กำลังบันทึกผลสำรวจ…');
    const operationId = crypto.randomUUID();
    const ref = await addDoc(collection(db, 'siteSurveys'), { quoteId:'', quoteNumber:'', projectName:projectName.trim(), customer:customer.trim(), surveyDate:date, contact:contact.trim(), address:address.trim(), location, note:note.trim(), measurements:rows.map(row => ({ id:row.id, pointType:row.pointType, point:row.point, width:row.width, length:row.length, height:row.height, qty:row.qty, note:row.note, area:area(row) })), totalArea:total, status:'surveyed', operationId, expectedPhotoCount:uploads.length, photoStatus:uploads.length ? 'uploading' : 'saved', photos:[], createdAt:serverTimestamp(), updatedAt:serverTimestamp() });
    if (uploads.length) await uploadSurveyPhotosWithFreeDrive({ id: ref.id, operationId }, uploads, (done, count) => setMessage(`กำลังส่งรูปเข้า Drive ${done}/${count}…`));
    setMessage(`บันทึกแล้ว · พื้นที่รวม ${total.toFixed(2)} ตร.ม.${uploads.length ? ` · แนบรูป ${uploads.length} รูป` : ''} พร้อมสร้างใบเสนอราคา`); setRows([empty()]); setNote('');
  } catch (error) { setMessage(error.message || 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง'); } finally { setBusy(false); } };
  if (screen === 'reports') return <><AdminRouteDock activePath="/admin/site-survey"/><main className="site-survey"><Link to="/admin">← ระบบจัดการ</Link><p>ขั้นที่ 2 จาก 6 · สำรวจหน้างาน</p><h1>รายงานสำรวจหน้างาน</h1><div className="survey-tabs"><button onClick={()=>setScreen('form')}>บันทึกสำรวจ</button><button className="active">รายงานสำรวจ</button></div><SiteSurveyReports embedded/></main></>;
  return <><AdminRouteDock activePath="/admin/site-survey"/><main className="site-survey"><Link to="/admin">← ระบบจัดการ</Link><p>ขั้นที่ 2 จาก 6 · สำรวจหน้างาน</p><h1>ข้อมูลลูกค้าและวัดพื้นที่</h1><div className="survey-tabs"><button className="active">บันทึกสำรวจ</button><button onClick={()=>setScreen('reports')}>รายงานสำรวจ</button></div><span>วัดพื้นที่ แนบรูปจุดทำงาน แล้วจึงนำไปสร้างใบเสนอราคา</span><form onSubmit={save}><div className="survey-grid"><label>ชื่อลูกค้า<input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="ชื่อผู้ว่าจ้าง"/></label><label>ชื่อโครงการ<input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="เช่น ต่อเติมครัวบ้านคุณสมชาย"/></label></div><div className="survey-grid"><label>วันที่<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>ผู้ติดต่อ<input value={contact} onChange={e=>setContact(e.target.value)} placeholder="ชื่อ / โทรศัพท์"/></label></div><label>สถานที่ / จุดนัดหมาย<textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="บ้านเลขที่, ซอย, จุดสังเกต"/></label><button className="survey-pin" type="button" onClick={pinLocation}>⌖ {location ? `ปักหมุดแล้ว (แม่นยำ ±${location.accuracy} ม.)` : 'ปักหมุดตำแหน่งปัจจุบัน'}</button><section><header><b>จุดที่ต้องวัด</b><strong>รวม {total.toFixed(2)} ตร.ม.</strong></header>{rows.map((row,index)=><article key={row.id}><label>ประเภทจุดวัด<select value={row.pointType} onChange={e=>change(row.id,'pointType',e.target.value)}>{pointTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><input value={row.point} onChange={e=>change(row.id,'point',e.target.value)} placeholder={row.pointType === 'other' ? 'ระบุประเภทงานและจุดที่วัด' : `ชื่อจุดงาน ${index+1} เช่น ห้องครัว`}/><div className="survey-measure"><input inputMode="decimal" value={row.width} onChange={e=>change(row.id,'width',e.target.value)} placeholder="กว้าง ม."/><span>×</span><input inputMode="decimal" value={row.length} onChange={e=>change(row.id,'length',e.target.value)} placeholder="ยาว ม."/><input inputMode="decimal" value={row.qty} onChange={e=>change(row.id,'qty',e.target.value)} placeholder="จำนวน"/></div><small>{area(row).toFixed(2)} ตร.ม.</small><textarea value={row.note} onChange={e=>change(row.id,'note',e.target.value)} placeholder="สภาพงาน / วัสดุ / ข้อสังเกต"/><label className="survey-photo">📷 แนบรูปจุดนี้<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" multiple onChange={e=>choosePhotos(row.id,e.target.files)}/><em>แตะเพื่อถ่ายรูป หรือเลือกจากแกลเลอรี · สูงสุด 5 รูป</em></label>{row.files.length>0&&<div className="survey-thumbs">{row.files.map((file,item)=><figure key={`${file.name}-${item}`}><img src={URL.createObjectURL(file)} alt={file.name}/><button type="button" onClick={()=>removePhoto(row.id,item)} aria-label="ลบรูป">×</button></figure>)}</div>}</article>)}<button type="button" className="survey-add" onClick={()=>setRows(current=>[...current,empty()])}>＋ เพิ่มจุดวัด</button></section><label>หมายเหตุสำคัญ<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="สิ่งที่ต้องประเมินเพิ่ม หรือแจ้งลูกค้า"/></label><button className="survey-save" disabled={busy}>{busy?'กำลังบันทึก…':'บันทึกผลสำรวจ'}</button>{message&&<p role="status">{message}</p>}</form></main></>;
}
