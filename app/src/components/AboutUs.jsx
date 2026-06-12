import React, { useState, useEffect } from 'react';
import { getContentByKey, getSettings } from '../firebase/api';
import { useCountUp } from '../lib/motion';
import './AboutUs.css';

const AboutUs = () => {
  const [aboutContent, setAboutContent] = useState({
    description: 'ด้วยประสบการณ์ในงานก่อสร้างและงานต่อเติมมากกว่า 30 ปี เราให้บริการงานต่อเติมบ้าน รีโนเวท ปรับปรุงอาคาร และงานก่อสร้างทั่วไป โดยดูแลทุกขั้นตอนตั้งแต่สำรวจหน้างาน ประเมินราคา วางแผนงาน ไปจนถึงการส่งมอบงาน\n\nเราให้ความสำคัญกับคุณภาพ ความปลอดภัย และความรับผิดชอบในทุกโครงการ พร้อมรับประกันผลงาน 1 ปี เพื่อสร้างความมั่นใจให้กับลูกค้าหลังส่งมอบงาน'
  });
  const [stats, setStats] = useState({
    projects: '500',
    team: '30',
    satisfaction: '95'
  });
  const [showStats, setShowStats] = useState(true);
  const projectsRef = useCountUp(stats.projects, { suffix: '+' });
  const teamRef = useCountUp(stats.team, { suffix: '+' });
  const satisfactionRef = useCountUp(stats.satisfaction, { suffix: '%' });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [descData, settingsData] = await Promise.all([
          getContentByKey('about_description'),
          getSettings()
        ]);

        if (descData.thai_content) {
          setAboutContent({ description: descData.thai_content });
        }

        const settingsObj = {};
        settingsData.forEach(s => {
          settingsObj[s.setting_key] = s.setting_value;
        });

        setStats({
          projects: settingsObj.projects_count || '500',
          team: settingsObj.team_count || '30',
          satisfaction: settingsObj.satisfaction_percent || '95'
        });

        setShowStats(settingsObj.show_about_stats !== false);
      } catch (err) {
        console.error('Error fetching about content:', err);
      }
    };
    fetchContent();
  }, []);

  return (
    <section className="about section" id="about">
      <div className="container">
        <div className="about-head">
          <h2 className="section-title text-left">ABOUT US</h2>
          <p className="about-text">{aboutContent.description}</p>
        </div>

        {/* Bento grid — craftsmanship-focused, no people photos needed */}
        <div className="about-bento">
          {/* Large: work-detail photo (no faces) */}
          <div className="bento-cell bento-photo">
            <img
              src="/website/uploads/1779821114162-539615797.png"
              alt="ดีเทลงานตกแต่งห้องน้ำหินอ่อนโดย BSBuildTh"
              loading="lazy"
              decoding="async"
            />
            <span className="bento-photo-tag">งานจริงจากทีมช่างของเรา</span>
          </div>

          {/* Stats */}
          {showStats && (
            <div className="bento-cell bento-stats">
              <div className="stat-item">
                <h3 className="stat-number" ref={projectsRef}>{stats.projects}+</h3>
                <p className="stat-label">Projects</p>
              </div>
              <div className="stat-item">
                <h3 className="stat-number" ref={teamRef}>{stats.team}+</h3>
                <p className="stat-label">Structural Experts</p>
              </div>
              <div className="stat-item">
                <h3 className="stat-number" ref={satisfactionRef}>{stats.satisfaction}%</h3>
                <p className="stat-label">Happy Clients</p>
              </div>
            </div>
          )}

          {/* Guarantee badge */}
          <div className="bento-cell bento-guarantee">
            <span className="bento-guarantee-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="34" height="34">
                <path d="M12 2l7 4v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-4z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </span>
            <h3>รับประกันผลงาน 1 ปี</h3>
            <p>มีปัญหาหลังส่งมอบ เรากลับมาดูแลให้</p>
          </div>

          {/* Why us */}
          <div className="bento-cell bento-why">
            <h3>ทำไมลูกค้าเลือกเรา</h3>
            <ul>
              <li><span>✓</span> คุมงานเองทุกโครงการ ไม่ทิ้งงาน</li>
              <li><span>✓</span> วัสดุมาตรฐาน ระบุในสัญญาชัดเจน</li>
              <li><span>✓</span> แบ่งงวดจ่ายตามความคืบหน้าจริง</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
