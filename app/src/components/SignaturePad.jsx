import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function drawStroke(context, stroke, width, height) {
  if (!stroke.points.length) return;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#10213d';
  const points = stroke.points;
  if (points.length === 1) {
    const point = points[0];
    context.beginPath();
    context.arc(point.x * width, point.y * height, 1.7 + point.pressure * 2.2, 0, Math.PI * 2);
    context.fillStyle = '#10213d';
    context.fill();
    return;
  }
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    context.beginPath();
    context.lineWidth = 1.5 + ((previous.pressure + current.pressure) / 2) * 3.5;
    context.moveTo(previous.x * width, previous.y * height);
    context.lineTo(current.x * width, current.y * height);
    context.stroke();
  }
}

function croppedPng(canvas) {
  const context = canvas.getContext('2d');
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (pixels.data[(y * canvas.width + x) * 4 + 3] > 12) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left || bottom < top) throw new Error('กรุณาเซ็นชื่อก่อนยืนยัน');
  const padding = Math.max(16, Math.round(canvas.width * 0.02));
  left = Math.max(0, left - padding); top = Math.max(0, top - padding);
  right = Math.min(canvas.width - 1, right + padding); bottom = Math.min(canvas.height - 1, bottom + padding);
  const output = document.createElement('canvas');
  output.width = right - left + 1; output.height = bottom - top + 1;
  output.getContext('2d').drawImage(canvas, left, top, output.width, output.height, 0, 0, output.width, output.height);
  return output.toDataURL('image/png');
}

export default function SignaturePad({ title, onCancel, onSave }) {
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);
  const redoRef = useRef([]);
  const activePointerRef = useRef(null);
  const penModeRef = useRef(false);
  const [history, setHistory] = useState({ undo: 0, redo: 0 });
  const [deviceLabel, setDeviceLabel] = useState('ใช้นิ้วหรือปากกาเขียนในพื้นที่ด้านล่าง');
  const [error, setError] = useState('');

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const ratio = canvas.width / Math.max(1, canvas.clientWidth);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    strokesRef.current.forEach(stroke => drawStroke(context, stroke, canvas.clientWidth, canvas.clientHeight));
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      redraw();
    };
    const escape = event => { if (event.key === 'Escape') onCancel(); };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', escape);
    };
  }, [onCancel, redraw]);

  const pointFromEvent = (event, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const pressure = event.pressure > 0 ? event.pressure : 0.5;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
      pressure: Math.max(0.12, Math.min(1, pressure)),
    };
  };
  const pointerDown = event => {
    if (event.button !== 0 || (event.pointerType === 'touch' && penModeRef.current)) return;
    event.preventDefault();
    if (event.pointerType === 'pen') {
      penModeRef.current = true;
      setDeviceLabel('ตรวจพบปากกา · ระบบป้องกันเส้นจากฝ่ามือแล้ว');
    } else setDeviceLabel(event.pointerType === 'touch' ? 'กำลังเซ็นด้วยการสัมผัส' : 'กำลังเซ็นด้วยเมาส์');
    activePointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    strokesRef.current.push({ points: [pointFromEvent(event, event.currentTarget)] });
    redoRef.current = [];
    setError('');
    redraw();
  };
  const pointerMove = event => {
    if (activePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    const stroke = strokesRef.current.at(-1);
    const events = typeof event.nativeEvent.getCoalescedEvents === 'function' ? event.nativeEvent.getCoalescedEvents() : [event.nativeEvent];
    events.forEach(item => stroke.points.push(pointFromEvent(item, event.currentTarget)));
    redraw();
  };
  const pointerUp = event => {
    if (activePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    activePointerRef.current = null;
    setHistory({ undo: strokesRef.current.length, redo: redoRef.current.length });
  };
  const undo = () => {
    const stroke = strokesRef.current.pop();
    if (stroke) redoRef.current.push(stroke);
    setHistory({ undo: strokesRef.current.length, redo: redoRef.current.length }); redraw();
  };
  const redo = () => {
    const stroke = redoRef.current.pop();
    if (stroke) strokesRef.current.push(stroke);
    setHistory({ undo: strokesRef.current.length, redo: redoRef.current.length }); redraw();
  };
  const clear = () => {
    if (strokesRef.current.length) redoRef.current.push(...strokesRef.current.splice(0));
    setHistory({ undo: strokesRef.current.length, redo: redoRef.current.length }); redraw(); setError('');
  };
  const save = () => {
    try { onSave(croppedPng(canvasRef.current)); }
    catch (saveError) { setError(saveError.message); }
  };

  return createPortal(<div className="signature-modal" role="dialog" aria-modal="true" aria-labelledby="signature-title">
    <div className="signature-panel">
      <header><div><p>ลงนามบนเอกสาร</p><h2 id="signature-title">{title}</h2></div><button type="button" onClick={onCancel} aria-label="ปิดหน้าต่างเซ็น">×</button></header>
      <p className="signature-device-status">{deviceLabel}</p>
      <div className="signature-canvas-wrap"><canvas ref={canvasRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-label="พื้นที่เขียนลายเซ็น" /></div>
      {error && <p className="signature-error" role="alert">{error}</p>}
      <div className="signature-tools">
        <button type="button" onClick={undo} disabled={!history.undo}>↶ ย้อนกลับ</button>
        <button type="button" onClick={redo} disabled={!history.redo}>↷ ทำซ้ำ</button>
        <button type="button" onClick={clear} disabled={!history.undo}>ล้างทั้งหมด</button>
        <button type="button" className="signature-confirm" onClick={save}>ยืนยันลายเซ็น</button>
      </div>
    </div>
  </div>, document.body);
}
