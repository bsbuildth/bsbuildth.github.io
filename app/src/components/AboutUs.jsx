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
      <div className="container about-container">
        <div className="about-content">
          <h2 className="section-title text-left">ABOUT US</h2>
          <p className="about-text">
            {aboutContent.description}
          </p>
          {showStats && <div className="about-stats">
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
          }
        </div>
        <div className="about-image-wrapper">
          <img src="/project_1.png" alt="Professional team at construction site" className="about-image" />
          <div className="about-image-accent"></div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;

