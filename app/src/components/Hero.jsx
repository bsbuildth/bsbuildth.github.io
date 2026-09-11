import { useState, useEffect } from 'react';
import { getImages, getContentByKey } from '../firebase/api';
import { useParallax } from '../lib/motion';
import './Hero.css';

const Hero = () => {
  const [content, setContent] = useState({
    title: 'รับเหมาต่อเติม–รีโนเวทบ้านครบวงจร ย่านเพชรเกษม–บางแค',
    description: 'ต่อเติม · รีโนเวท · ตกแต่งภายใน — ประสบการณ์กว่า 30 ปี รับประกันงาน 1 ปี',
  });
  const [heroImg, setHeroImg] = useState('/hero.jpg');
  const [mediaType, setMediaType] = useState('image');
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const parallaxRef = useParallax(0.15);

  useEffect(() => {
    getImages('hero')
      .then(data => {
        const bg = Array.isArray(data) ? data.find(i => i.image_key === 'hero_background') : null;
        if (bg?.image_path) { setHeroImg(bg.image_path); setMediaType(bg.media_type || 'image'); }
      })
      .catch(() => {});
    (async () => {
      try {
        const [t, d] = await Promise.all([
          getContentByKey('hero_title'),
          getContentByKey('hero_description'),
        ]);
        setContent(c => ({
          title: t.thai_content || c.title,
          description: d.thai_content || c.description,
        }));
      } catch { /* keep defaults */ }
    })();
  }, []);

  const src = (heroImg.startsWith('http') || heroImg.startsWith('/website'))
    ? heroImg : apiUrl + heroImg;

  return (
    <section className="hero" id="home">
      {mediaType === 'video' ? (
        <video ref={parallaxRef} className="hero-bg" src={src} autoPlay loop muted playsInline aria-hidden="true" />
      ) : (
        <div ref={parallaxRef} className="hero-bg" style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
      )}
      <div className="hero-scrim" aria-hidden="true"></div>

      <div className="container hero-shell">
        <div className="hero-content" data-aos="fade-up">
          <p className="hero-eyebrow">BS BUILD · PROFESSIONAL CONSTRUCTION</p>
          {content.title && <h1 className="hero-title">{content.title}</h1>}
          {content.description && <p className="hero-description">{content.description}</p>}
          <div className="hero-actions">
            <a href="#contact" className="btn btn-solid hero-cta">นัดสำรวจหน้างาน <span>→</span></a>
            <a href="#reference" className="hero-link">ดูแนวทางงาน <span>↗</span></a>
          </div>
          <div className="hero-proof" aria-label="จุดเด่นบริการ">
            <span>คุมงานเป็นขั้นตอน</span><span>แบ่งจ่ายตามความคืบหน้า</span><span>รับประกันผลงาน</span>
          </div>
        </div>

        <aside className="hero-architecture" aria-hidden="true">
          <div className="hero-orbit"><span></span><span></span><span></span></div>
          <div className="hero-model">
            <i className="model-slab model-slab-1"></i><i className="model-slab model-slab-2"></i><i className="model-wall model-wall-1"></i><i className="model-wall model-wall-2"></i>
          </div>
          <p><small>FROM PLAN TO PLACE</small>คิดครบ ตั้งแต่พื้นที่จนถึงรายละเอียด</p>
        </aside>
      </div>

      <div className="hero-trust-strip">
        <div><strong>30+</strong><span>ปีประสบการณ์</span></div>
        <div><strong>1 ปี</strong><span>รับประกันผลงาน</span></div>
        <div><strong>ฟรี</strong><span>สำรวจและประเมินหน้างาน</span></div>
      </div>
    </section>
  );
};

export default Hero;
