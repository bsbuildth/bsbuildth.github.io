import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function AiShareDialog({ busy, onClose, onShare, onDownload }) {
  const [redacted, setRedacted] = useState(true);
  useEffect(() => {
    const escape = event => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [busy, onClose]);
  return createPortal(<div className="ai-share-modal" role="dialog" aria-modal="true" aria-labelledby="ai-share-title">
    <div className="ai-share-panel">
      <header><div><p>ตรวจความถูกต้องก่อนส่งลูกค้า</p><h2 id="ai-share-title">แชร์ใบเสนอราคาให้ AI ตรวจ</h2></div><button type="button" disabled={busy} onClick={onClose} aria-label="ปิด">×</button></header>
      <label className="ai-redact-option"><input type="checkbox" checked={redacted} disabled={busy} onChange={event => setRedacted(event.target.checked)} /><span><b>สร้างสำเนาสำหรับ AI</b><small>ปกปิดชื่อลูกค้า โครงการ เบอร์โทร เลขภาษี เลขบัญชี และลายเซ็น</small></span></label>
      {!redacted && <p className="ai-share-notice">ไฟล์ฉบับเต็มมีข้อมูลลูกค้า บัญชีธนาคาร และลายเซ็น</p>}
      <div className="ai-share-actions"><button type="button" className="ai-share-primary" disabled={busy} onClick={() => onShare(redacted)}>แชร์ผ่านมือถือ…</button><button type="button" disabled={busy} onClick={() => onDownload(redacted)}>ดาวน์โหลด PDF + คัดลอกคำสั่งตรวจ</button></div>
      <div className="ai-destinations"><span>หลังดาวน์โหลด สามารถเปิดเพื่อแนบไฟล์:</span><a href="https://chatgpt.com/" target="_blank" rel="noreferrer">เปิด ChatGPT</a><a href="https://gemini.google.com/app" target="_blank" rel="noreferrer">เปิด Gemini</a></div>
      <p className="ai-share-help">บน Galaxy หรือ iPad หากติดตั้งแอปและแอปรับไฟล์ PDF ได้ แอป ChatGPT หรือ Gemini จะปรากฏในเมนู “แชร์ผ่านมือถือ”</p>
    </div>
  </div>, document.body);
}
