import React from 'react';
import './WorkProcess.css';

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
        <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>
      </svg>
    ),
    title: 'สำรวจหน้างาน',
    desc: 'นัดดูหน้างานจริง วัดพื้นที่ ประเมินราคาเบื้องต้นฟรี ไม่มีค่าใช้จ่าย',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>
      </svg>
    ),
    title: 'เสนอราคา–ทำสัญญา',
    desc: 'ใบเสนอราคาระบุวัสดุชัดเจน ทำสัญญาแบ่งงวดจ่ายตามความคืบหน้าจริง',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
        <path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><path d="M9 20v-6h6v6"/>
      </svg>
    ),
    title: 'ลงมือก่อสร้าง',
    desc: 'ทีมช่างประจำคุมงานทุกวัน รายงานความคืบหน้าพร้อมรูปถ่ายให้ตลอดงาน',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
        <path d="M12 2l7 4v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-4z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    title: 'ส่งมอบ–รับประกัน 1 ปี',
    desc: 'ตรวจรับงานร่วมกันก่อนส่งมอบ พร้อมรับประกันผลงาน 1 ปีเต็ม',
  },
];

const WorkProcess = () => (
  <section className="process section" id="process">
    <div className="container">
      <div className="process-head" data-aos="fade-up">
        <p className="eyebrow">HOW WE WORK</p>
        <h2 className="section-title">ขั้นตอนการทำงาน</h2>
        <p className="process-sub">โปร่งใสทุกขั้นตอน ตั้งแต่วันแรกจนถึงวันส่งมอบ</p>
      </div>

      <div className="process-grid">
        {STEPS.map((s, i) => (
          <div className="process-step" key={i} data-aos="fade-up" data-aos-delay={i * 90}>
            <div className="process-step-top">
              <span className="process-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="process-icon">{s.icon}</span>
            </div>
            <h3 className="process-title">{s.title}</h3>
            <p className="process-desc">{s.desc}</p>
            {i < STEPS.length - 1 && <span className="process-connector" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WorkProcess;
