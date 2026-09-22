import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminRouteDock from '../components/AdminRouteDock';
import { archiveSiteUpdate, completeSiteUpdate, createSiteUpdate, createSiteUpdateProject, deleteSiteUpdate, listSiteUpdateProjects, listSiteUpdates, markSiteUpdateFailed, validateSitePhotos } from '../firebase/siteUpdates';
import { drivePreviewToFile, loadDrivePhotoPreviews, requestGoogleDriveAccess, trashDriveFolder, uploadSiteUpdateDirectToDrive } from '../firebase/driveUpload';
import { getAllProjects } from '../firebase/api';
import { exportSiteUpdatePdf } from '../lib/siteUpdatePdf';
import './SiteUpdates.css';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const formatDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const statusLabel = { draft: 'ร่าง', uploading: 'กำลังส่ง', saved: 'บันทึกแล้ว', failed: 'ส่งไม่สำเร็จ', archived: 'เก็บเข้าคลัง' };
const chunk = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));

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
  const [summaryImages, setSummaryImages] = useState({});
  const [viewing, setViewing] = useState(null);
  const [viewImages, setViewImages] = useState({});
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

  const shareDaily = async item => {
    const photos = item.photos || [];
    if (!photos.length) { setError('รายการนี้ยังไม่มีรูปสำหรับแชร์'); return; }
    const text = `อัปเดตรูปหน้างาน\n${item.projectName}\n${formatDate(item.updateDate)}${item.note ? `\n${item.note}` : ''}`;
    try {
      setBusy(true); setError(''); setProgress('กำลังเตรียมรูปสำหรับ LINE…');
      const previews = await loadDrivePhotoPreviews(await requestGoogleDriveAccess(), photos);
      const filesToShare = photos.filter(photo => previews[photo.id]).map(photo => drivePreviewToFile(previews[photo.id], photo.name, photo.order));
      if (!filesToShare.length) throw new Error('Google Drive ยังสร้างภาพตัวอย่างไม่เสร็จ ลองอีกครั้งในอีกสักครู่');
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: filesToShare }))) {
        try { await navigator.share({ title: `อัปเดตหน้างาน - ${item.projectName}`, text, files: filesToShare }); setProgress('เปิดเมนูแชร์แล้ว เลือก LINE เพื่อส่งรูป'); return; }
        catch (err) { if (err.name === 'AbortError') { setProgress(''); return; } throw err; }
      }
      throw new Error('อุปกรณ์นี้ยังไม่รองรับการส่งรูปจากเว็บผ่าน LINE');
    } catch (err) { setError(err.message); setProgress(''); } finally { setBusy(false); }
  };

  const removeUpdate = async item => {
    const prompt = item.driveFolderId ? 'ลบรายการนี้จากระบบ และย้ายโฟลเดอร์รูปของวันนี้ไปถังขยะ Google Drive?' : 'ลบรายการนี้จากระบบ?';
    if (!window.confirm(prompt)) return;
    try {
      setBusy(true); setError(''); setProgress('กำลังลบรายการ…');
      if (item.driveFolderId) await trashDriveFolder(await requestGoogleDriveAccess(), item.driveFolderId);
      await deleteSiteUpdate(item.id); await reload(); setProgress('ลบรายการแล้ว');
    } catch (err) { setError(err.message); setProgress(''); } finally { setBusy(false); }
  };

  const viewPhotos = async item => {
    if (!(item.photos || []).length) { setError('รายการนี้ยังไม่มีรูป'); return; }
    try {
      setBusy(true); setError(''); setProgress('กำลังเปิดรูปจาก Google Drive…');
      setViewImages(await loadDrivePhotoPreviews(await requestGoogleDriveAccess(), item.photos));
      setViewing(item); setProgress('');
    } catch (err) { setError(err.message); setProgress(''); } finally { setBusy(false); }
  };

  const savedProjectUpdates = useMemo(() => updates.filter(item => item.status === 'saved' && String(item.projectId) === projectId).sort((a, b) => String(a.updateDate).localeCompare(String(b.updateDate))), [updates, projectId]);
  const summaryPages = useMemo(() => savedProjectUpdates.flatMap(item => {
    const groups = chunk(item.photos || [], 6); return (groups.length ? groups : [[]]).map((photos, index) => ({ item, photos, continuation: index > 0 }));
  }), [savedProjectUpdates]);
  const createAndShareSummary = async () => {
    if (!project || !savedProjectUpdates.length) { setError('โครงการนี้ยังไม่มีรายการที่บันทึกแล้ว'); return; }
    try {
      setBusy(true); setError(''); setProgress('กำลังดึงรูปจาก Google Drive…');
      const allPhotos = savedProjectUpdates.flatMap(item => item.photos || []);
      setSummaryImages(await loadDrivePhotoPreviews(await requestGoogleDriveAccess(), allPhotos));
      setProgress('กำลังจัดหน้า PDF…'); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const pdf = await exportSiteUpdatePdf({ root: document.getElementById('site-summary-pdf'), projectName: project.title, dateStamp: today() });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [pdf] }))) {
        try { await navigator.share({ title: `สรุปโครงการ ${project.title}`, text: 'สรุปภาพความคืบหน้าโครงการ', files: [pdf] }); setProgress('เปิดเมนูแชร์แล้ว เลือก LINE เพื่อส่ง PDF'); return; } catch (err) { if (err.name === 'AbortError') { setProgress(''); return; } }
      }
      setProgress('ดาวน์โหลด PDF แล้ว เปิด LINE แล้วแนบไฟล์ได้ทันที');
    } catch (err) { setError(err.message); setProgress(''); } finally { setBusy(false); }
  };

  return <><AdminRouteDock activePath="/admin/site-updates" /><main className="site-updates"><header><div><Link to="/admin">← ระบบจัดการ</Link><p>อัปเดตรูปหน้างาน</p><h1>บันทึกภาพตามวันที่</h1><span>รูปต้นฉบับอยู่ใน Google Drive โดยตรง ไม่ใช้พื้นที่ Firebase Storage</span></div><button onClick={() => reload()} disabled={busy}>รีเฟรช</button></header><section className="site-update-compose"><form onSubmit={save}><div className="site-update-heading"><b>อัปเดตใหม่</b><small>ใช้งานจากมือถือได้ทันที</small></div><label>โครงการ <span className="field-help">เลือกงานเดิม หรือสร้างเฉพาะสำหรับรายงานหน้างาน</span><select value={projectId} onChange={event => setProjectId(event.target.value)} disabled={busy || projectBusy}>{projects.map(item => <option key={`${item.source || 'website'}-${item.id}`} value={item.id}>{item.title}</option>)}</select></label><button className="site-add-project" type="button" onClick={() => setAddingProject(value => !value)} disabled={busy || projectBusy}>{addingProject ? 'ยกเลิกสร้างโครงการ' : '＋ สร้างโครงการใหม่'}</button>{addingProject && <div className="site-new-project"><input value={newProjectName} onChange={event => setNewProjectName(event.target.value)} maxLength="160" placeholder="เช่น บ้านคุณสมชาย ซอยเพชรเกษม 69" disabled={projectBusy}/><button type="button" onClick={addProject} disabled={projectBusy || !newProjectName.trim()}>{projectBusy ? 'กำลังบันทึก…' : 'บันทึกโครงการ'}</button></div>}<label>วันที่<input type="date" value={date} onChange={event => setDate(event.target.value)} disabled={busy}/></label><label>ข้อความสำคัญ <small>เว้นว่างได้</small><textarea value={note} onChange={event => setNote(event.target.value)} maxLength="2000" placeholder="เช่น เทปูนพื้นชั้น 1 เสร็จแล้ว / รอส่งกระเบื้อง" disabled={busy}/></label><label className="site-photo-picker"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={chooseFiles} disabled={busy}/><b>＋ เลือกรูปจากแกลเลอรี่หรือกล้อง</b><span>{files.length ? `เลือกแล้ว ${files.length} รูป` : 'JPG, PNG, WebP, HEIC · รูปละไม่เกิน 12 MB'}</span></label>{files.length > 0 && <div className="site-file-list">{files.map(file => <span key={`${file.name}-${file.lastModified}`}>{file.name}<small>{Math.ceil(file.size / 1024 / 1024 * 10) / 10} MB</small></span>)}</div>}<button className="site-save" disabled={busy || !files.length}>{busy ? (progress || 'กำลังบันทึก…') : 'เชื่อม Drive และบันทึกรูป'}</button>{progress && <p className="site-progress" role="status">{progress}</p>}{error && <p className="site-error" role="alert">{error}</p>}</form></section><section className="site-summary-actions"><div><b>สรุปโครงการ</b><span>{savedProjectUpdates.length ? `มี ${savedProjectUpdates.length} วันบันทึก` : 'เลือกโครงการที่มีรายการบันทึกแล้ว'}</span></div><button onClick={createAndShareSummary} disabled={busy || !savedProjectUpdates.length}>PDF + แชร์ไป LINE</button></section><section className="site-update-list"><div><p>รายการล่าสุด</p><h2>อัปเดตรูปหน้างาน</h2></div>{updates.length === 0 && <p className="site-empty">ยังไม่มีอัปเดต เริ่มได้จากฟอร์มด้านบน</p>}{updates.map(item => <article key={item.id}><div className="site-update-meta"><b>{item.projectName}</b><span>{formatDate(item.updateDate)} · {statusLabel[item.status] || item.status}</span>{item.note && <p>{item.note}</p>}</div><div className="site-thumbs">{(item.photos || []).slice(0, 4).map(photo => photo.thumbnailUrl ? <img key={photo.id} src={photo.thumbnailUrl} alt={photo.caption || photo.name} /> : <span key={photo.id} className="site-drive-photo">รูป {photo.order}</span>)}</div><footer>{item.driveUrl && <a href={item.driveUrl} target="_blank" rel="noreferrer">เปิด Drive ↗</a>}<button onClick={() => viewPhotos(item)} disabled={busy || !(item.photos || []).length}>ดูรูป</button><button onClick={() => shareDaily(item)} disabled={busy || !(item.photos || []).length}>ส่งรูปไป LINE</button><button onClick={() => archiveSiteUpdate(item.id).then(reload)} disabled={busy}>เก็บ</button><button className="site-delete" onClick={() => removeUpdate(item)} disabled={busy}>ลบ</button></footer></article>)}</section></main>{viewing && <div className="site-photo-modal" role="dialog" aria-modal="true" aria-label="ดูรูปหน้างาน"><section><header><div><b>{viewing.projectName}</b><span>{formatDate(viewing.updateDate)}</span></div><button onClick={() => setViewing(null)} aria-label="ปิด">×</button></header><div className="site-photo-modal-grid">{(viewing.photos || []).map(photo => viewImages[photo.id] ? <img key={photo.id} src={viewImages[photo.id]} alt={photo.name || `รูปที่ ${photo.order}`} /> : <div key={photo.id} className="site-summary-photo-fallback">รูป {photo.order}<small>อ่านรูปไม่สำเร็จ</small></div>)}</div></section></div>}<div id="site-summary-pdf" className="site-summary-pdf" aria-hidden="true">{summaryPages.map(({ item, photos, continuation }, pageIndex) => <section className="site-summary-pdf-page" key={`${item.id}-${pageIndex}`}><header><span>BS BUILD</span><small>รายงานภาพความคืบหน้าโครงการ</small></header><h1>{project?.title}</h1><div className="site-summary-date"><b>{formatDate(item.updateDate)}</b>{continuation && <span>ภาพต่อเนื่อง</span>}</div>{item.note && !continuation && <p className="site-summary-note">{item.note}</p>}<div className="site-summary-photo-grid">{photos.map(photo => <figure key={photo.id}>{summaryImages[photo.id] ? <img src={summaryImages[photo.id]} alt="" /> : <div className="site-summary-photo-fallback">รูป {photo.order}<small>เปิดจาก Drive</small></div>}<figcaption>{photo.caption || photo.name || `รูปที่ ${photo.order}`}</figcaption></figure>)}</div><footer>BS Build Workspace · {pageIndex + 1} / {summaryPages.length}</footer></section>)}</div></>;
}
