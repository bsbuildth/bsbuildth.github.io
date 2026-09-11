import { useState, useEffect } from 'react';
import { FeatherIcon } from './IconMap';
import { getServices } from '../firebase/api';
import './Services.css';

const DEFAULT_SERVICES = [
  { id: 'extension', icon: 'home', title_thai: 'ต่อเติมบ้าน', description_thai: 'ครัว โรงจอดรถ หลังคา และพื้นที่ใช้งานใหม่ วางแผนโครงสร้างและหน้างานให้เหมาะกับบ้านเดิม' },
  { id: 'renovation', icon: 'tool', title_thai: 'รีโนเวทครบวงจร', description_thai: 'ปรับพื้นที่เก่าให้ตอบโจทย์การใช้ชีวิต ตั้งแต่งานรื้อ ระบบ ไปจนถึงงานตกแต่งและเก็บรายละเอียด' },
  { id: 'interior', icon: 'layers', title_thai: 'ตกแต่งภายใน', description_thai: 'จัดสัดส่วน วัสดุ แสง และงานบิลต์อินให้ภาพรวมสวย ใช้งานจริงได้ และควบคุมงบประมาณชัดเจน' },
];

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading) {
    return (
      <section className="services section bg-light" id="services">
        <div className="container">
          <h2 className="section-title">SERVICES</h2>
          <div className="services-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '8px' }}></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const visibleServices = services.length ? services : DEFAULT_SERVICES;

  return (
    <section className="services section bg-light" id="services">
      <div className="container">
        <div className="services-head"><div><p className="eyebrow">What we build</p><h2 className="section-title">พื้นที่ใหม่ที่คิดเพื่อชีวิตจริง</h2></div><p>ตั้งแต่ต่อเติมหนึ่งห้องจนถึงรีโนเวททั้งหลัง เราช่วยวางขอบเขต วัสดุ งบประมาณ และลำดับงานให้เห็นภาพก่อนเริ่ม</p></div>
        <div className="services-grid">
          {visibleServices.map((service, index) => (
            <article className="service-card" key={service.id}>
              <span className="service-index">0{index + 1}</span>
              <div className="service-icon-wrapper">
                <div className="service-icon-placeholder">
                  <FeatherIcon
                    iconName={service.icon}
                    size={48}
                    color="var(--color-accent)"
                  />
                </div>
              </div>
              <h3 className="service-title">{service.title_thai}</h3>
              <p className="service-desc">{service.description_thai}</p>
            </article>
          ))}
        </div>
        <a href="#contact" className="services-cta">เล่าไอเดียพื้นที่ของคุณ <span>→</span></a>
      </div>
    </section>
  );
};

export default Services;

