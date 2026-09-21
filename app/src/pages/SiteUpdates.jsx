import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminRouteDock from '../components/AdminRouteDock';
import { archiveSiteUpdate, completeSiteUpdate, createSiteUpdate, createSiteUpdateProject, listSiteUpdateProjects, listSiteUpdates, markSiteUpdateFailed, validateSitePhotos } from '../firebase/siteUpdates';
import { requestGoogleDriveAccess, uploadSiteUpdateDirectToDrive } from '../firebase/driveUpload';
import { getAllProjects } from '../firebase/api';
import './SiteUpdates.css';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const formatDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const statusLabel = { draft: 'ร่าง', uploading: 'กำลังส่ง', saved: 'บันทึกแล้ว', failed: 'ส่งไม่สำเร็จ', archived: 'เก็บเข้าคลัง' };

export default function SiteUpdates() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectBusy, setProjectBusy] = useState(false);
  const project = useMemo(() => projects.find(item => String(item.id) === projectId), [projects, projectId]);

  const reload = async () => { const data = await listSiteUpdates(); setUpdates(data.filter(item => item.status !== 'archived')); };
  useEffect(() => {
    Promise.all([getAllProjects(), listSiteUpdateProjects()]).then(([websiteProjects, fieldProjects]) => {
      const data = [...fieldProjects, ...websiteProjects.map(item => ({ ...item, source: 'website' }))];
      setProjects(data); setProjectId(data[0] ? String(data[0].id) : '');
    }).catch(() => setError('โหลดโครงการไม่สำเร็จ'));
    listSiteUpdates().then(data => setUpdates(data.filter(item => item.status !== 'archived'))).catch(() => setError('โหลดรายการอัปเดตไม่สำเร็จ'));
  }, []);

  const chooseFiles = event => { try { setFiles(validateSitePhotos(event.target.files)); setError(''); } catch (err) { setFiles([]); setError(err.message); event.target.value = ''; } };
  const addProject = async () => {
    try {
      setProjectBusy(true); setError('');
      const item = await createSiteUpdateProject(newProjectName);
      setProjects(current => [item, ...current]); setProjectId(String(item.id)); setNewProjectName(''); setAddingProject(false);
    } catch (err) { setError(err.message); } finally { setProjectBusy(false); }
  };
  const save = async event => {
    event.preventDefault(); if (!project) { setError('เลือกหรือสร้างโครงการก่อน'); return; }
    let update;
    try {
      setBusy(true); setError(''); setProgress('กำลังสร้างรายการ…');
      update = await createSiteUpdate({ project, updateDate: date, note });
      setProgress('กำลังเชื่อม Google Drive…');
      const token = await requestGoogleDriveAccess();
      const result = await uploadSiteUpdateDirectToDrive({ updateId: update.id, projectName: project.title, updateDate: date, files, token, onProgress: (done, total) => setProgress(`กำลังส่งรูปเข้า Drive ${done}/${total}`) });
      await completeSiteUpdate(update.id, result);
      setProgress('บันทึกและส่งเข้า Drive แล้ว'); setFiles([]); setNote(''); await reload();
      if (result.driveUrl) window.open(result.driveUrl, '_blank', 'noopener');
    } catch (err) { if (update) await markSiteUpdateFailed(update.id, err.message); setError(err.message); setProgress(''); } finally { setBusy(false); }
  };

  return <><AdminRouteDock activePath="/admin/site-updates" /><main className="site-updates"><header><div><Link to="/admin">← ระบบจัดการ</Link><p>อัปเดตรูปหน้างาน</p><h1>บันทึกภาพตามวันที่</h1><span>รูปต้นฉบับอยู่ใน Google Drive โดยตรง ไม่ใช้พื้นที่ Firebase Storage</span></div><button onClick={() => reload()} disabled={busy}>รีเฟรช</button></header><section className="site-update-compose"><form onSubmit={save}><div className="site-update-heading"><b>อัปเดตใหม่</b><small>ใช้งานจากมือถือได้ทันที</small></div><label>โครงการ <span className="field-help">เลือกงานเดิม หรือสร้างเฉพาะสำหรับรายงานหน้างาน</span><select value={projectId} onChange={event => setProjectId(event.target.value)} disabled={busy || projectBusy}>{projects.map(item => <option key={`${item.source || 'website'}-${item.id}`} value={item.id}>{item.title}</option>)}</select></label><button className="site-add-project" type="button" onClick={() => setAddingProject(value => !value)} disabled={busy || projectBusy}>{addingProject ? 'ยกเลิกสร้างโครงการ' : '＋ สร้างโครงการใหม่'}</button>{addingProject && <div className="site-new-project"><input value={newProjectName} onChange={event => setNewProjectName(event.target.value)} maxLength="160" placeholder="เช่น บ้านคุณสมชาย ซอยเพชรเกษม 69" disabled={projectBusy}/><button type="button" onClick={addProject} disabled={projectBusy || !newProjectName.trim()}>{projectBusy ? 'กำลังบันทึก…' : 'บันทึกโครงการ'}</button></div>}<label>วันที่<input type="date" value={date} onChange={event => setDate(event.target.value)} disabled={busy}/></label><label>ข้อความสำคัญ <small>เว้นว่างได้</small><textarea value={note} onChange={event => setNote(event.target.value)} maxLength="2000" placeholder="เช่น เทปูนพื้นชั้น 1 เสร็จแล้ว / รอส่งกระเบื้อง" disabled={busy}/></label><label className="site-photo-picker"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={chooseFiles} disabled={busy}/><b>＋ เลือกรูปจากแกลเลอรี่หรือกล้อง</b><span>{files.length ? `เลือกแล้ว ${files.length} รูป` : 'JPG, PNG, WebP, HEIC · รูปละไม่เกิน 12 MB'}</span></label>{files.length > 0 && <div className="site-file-list">{files.map(file => <span key={`${file.name}-${file.lastModified}`}>{file.name}<small>{Math.ceil(file.size / 1024 / 1024 * 10) / 10} MB</small></span>)}</div>}<button className="site-save" disabled={busy || !files.length}>{busy ? (progress || 'กำลังบันทึก…') : 'เชื่อม Drive และบันทึกรูป'}</button>{progress && <p className="site-progress" role="status">{progress}</p>}{error && <p className="site-error" role="alert">{error}</p>}</form></section><section className="site-update-list"><div><p>รายการล่าสุด</p><h2>อัปเดตรูปหน้างาน</h2></div>{updates.length === 0 && <p className="site-empty">ยังไม่มีอัปเดต เริ่มได้จากฟอร์มด้านบน</p>}{updates.map(item => <article key={item.id}><div className="site-update-meta"><b>{item.projectName}</b><span>{formatDate(item.updateDate)} · {statusLabel[item.status] || item.status}</span>{item.note && <p>{item.note}</p>}</div><div className="site-thumbs">{(item.photos || []).slice(0, 4).map(photo => photo.thumbnailUrl ? <img key={photo.id} src={photo.thumbnailUrl} alt={photo.caption || photo.name} /> : <span key={photo.id} className="site-drive-photo">รูป {photo.order}</span>)}</div><footer>{item.driveUrl && <a href={item.driveUrl} target="_blank" rel="noreferrer">เปิด Drive ↗</a>}<button onClick={() => archiveSiteUpdate(item.id).then(reload)} disabled={busy}>เก็บ</button></footer></article>)}</section></main></>;
}
