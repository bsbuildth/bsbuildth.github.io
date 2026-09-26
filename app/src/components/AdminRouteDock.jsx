import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminRouteDock.css';

const links = [
  ['/admin', '⌂', 'หน้าทำงาน'],
  ['/admin/quotations', '▤', 'ใบเสนอราคา'],
  ['/admin/receipts', '◫', 'ใบเสร็จรับเงิน'],
  ['/admin/prices', '⌁', 'คลังราคา'],
  ['/admin/site-updates', '◉', 'อัปเดตรูปหน้างาน'],
  ['/admin/site-survey', '⌑', 'สำรวจหน้างาน'],
];

export default function AdminRouteDock({ activePath, actions = [] }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bsbuild-dock-position'));
      if (saved && ['left', 'right'].includes(saved.side) && Number.isFinite(saved.y)) return saved;
    } catch { /* use the default position */ }
    return { side: 'left', y: 0.7 };
  });
  const dragRef = useRef({ active: false, moved: false, suppressClick: false });
  const panelTop = typeof window === 'undefined' ? 360 : Math.max(132, Math.min(window.innerHeight - 132, position.y * window.innerHeight));
  const handleStyle = { top: `${position.y * 100}vh`, left: position.side === 'left' ? 0 : 'auto', right: position.side === 'right' ? 0 : 'auto' };
  const menuStyle = { top: `${panelTop}px`, left: position.side === 'left' ? '12px' : 'auto', right: position.side === 'right' ? '12px' : 'auto' };

  const handlePointerDown = event => {
    dragRef.current = { active: true, moved: false, suppressClick: false, startX: event.clientX, startY: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handlePointerMove = event => {
    const drag = dragRef.current;
    if (!drag.active) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
    drag.moved = true;
    if (open) setOpen(false);
    const safeTop = 58;
    const safeBottom = 58;
    const y = Math.min(window.innerHeight - safeBottom, Math.max(safeTop, event.clientY)) / window.innerHeight;
    setPosition({ side: event.clientX < window.innerWidth / 2 ? 'left' : 'right', y });
  };
  const handlePointerUp = () => {
    const drag = dragRef.current;
    drag.active = false;
    if (!drag.moved) return;
    drag.suppressClick = true;
    setPosition(current => {
      const next = { ...current, y: Math.round(current.y * 1000) / 1000 };
      localStorage.setItem('bsbuild-dock-position', JSON.stringify(next));
      return next;
    });
  };

  return <>
    <button className={`route-dock-handle route-dock-${position.side} ${open ? 'is-open' : ''}`} style={handleStyle} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onClick={() => { if (dragRef.current.suppressClick) { dragRef.current.suppressClick = false; return; } setOpen(value => !value); }} aria-expanded={open} aria-label="เมนูหลัก">{open ? '×' : '☰'}</button>
    {open && <button className="route-dock-backdrop" onClick={() => setOpen(false)} aria-label="ปิดเมนู" />}
    <nav className={`route-dock-menu route-dock-${position.side} ${open ? 'is-open' : ''}`} style={menuStyle} aria-label="เมนูหลัก">
      {actions.length > 0 ? actions.map(({ id, icon, label, onClick, disabled, active }, index) => <button key={id} className={active ? 'active' : ''} style={{ '--dock-index': index }} disabled={disabled} onClick={() => { setOpen(false); onClick(); }}><i>{icon}</i><span>{label}</span></button>) : links.map(([path, icon, label], index) => <button key={path} style={{ '--dock-index': index }} className={activePath === path ? 'active' : ''} onClick={() => { setOpen(false); navigate(path); }}><i>{icon}</i><span>{label}</span></button>)}
    </nav>
  </>;
}
