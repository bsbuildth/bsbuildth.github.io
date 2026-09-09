import { useState, useEffect, useCallback } from 'react';
import { getReferences } from '../firebase/api';
import './Reference.css';

const Reference = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ทั้งหมด');
  const [lightbox, setLightbox] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    getReferences()
      .then(data => { setImages(data); setLoading(false); })
      .catch(err => { console.error('Error fetching references:', err); setLoading(false); });
  }, []);

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  const categories = ['ทั้งหมด', ...Array.from(new Set(images.map(i => i.category)))];
  const filtered = filter === 'ทั้งหมด' ? images : images.filter(i => i.category === filter);
  const countFor = (cat) => cat === 'ทั้งหมด' ? images.length : images.filter(i => i.category === cat).length;

  const getImgSrc = (p) => p?.startsWith('http') ? p : `${apiUrl}${p}`;

  const closeLightbox = () => setLightbox(null);

  const goPrev = useCallback(() => {
    if (lightboxIdx > 0) { setLightboxIdx(lightboxIdx - 1); setLightbox(filtered[lightboxIdx - 1]); }
  }, [lightboxIdx, filtered]);

  const goNext = useCallback(() => {
    if (lightboxIdx < filtered.length - 1) { setLightboxIdx(lightboxIdx + 1); setLightbox(filtered[lightboxIdx + 1]); }
  }, [lightboxIdx, filtered]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, goPrev, goNext]);

  return (
    <section className="ref-section" id="reference">
      {/* Header */}
      <div className="ref-header">
        <div className="ref-header-inner" data-aos="fade-up">
          <span className="ref-label">OUR WORK</span>
          <h2 className="ref-title">Design Reference</h2>
          <p className="ref-desc">แรงบันดาลใจจากงานจริง — เลือกสไตล์ที่ตรงกับความฝันของคุณ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="ref-tabs-wrap" data-aos="fade-up">
        <div className="ref-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`ref-tab ${filter === cat ? 'active' : ''}`}
              onClick={() => { setFilter(cat); setActiveIdx(0); }}
            >
              {cat}
              <span className="ref-tab-count">{countFor(cat)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="ref-container">
        {loading ? (
          <div className="ref-loading">
            {[1,2,3,4,5,6].map(n => <div key={n} className="ref-skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="ref-empty">ยังไม่มีรูปในหมวดนี้</p>
        ) : (
          <div className="ref-accordion" data-aos="fade-up">
            {filtered.map((img, idx) => (
              <div
                key={img.id}
                className={`ref-acc-panel ${activeIdx === idx ? 'active' : ''}`}
                onClick={() => setActiveIdx(idx)}
                style={{ backgroundImage: `url(${getImgSrc(img.img_path)})` }}
              >
                <span className="ref-acc-shade" />

                {/* collapsed view: main title + expand button */}
                <div className="ref-acc-collapsed">
                  <span className="ref-acc-plus" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </span>
                  <span className="ref-acc-vtitle">{img.room_type || img.title}</span>
                </div>

                {/* expanded view: full details */}
                <div className="ref-acc-content">
                  <span className="ref-acc-cat">{img.category}</span>
                  <h4 className="ref-acc-title">{img.room_type || img.title}</h4>
                  <div className="ref-acc-meta">
                    {img.style && <span className="ref-m-style"><strong>สไตล์:</strong> {img.style}</span>}
                    {img.color_tone && <span className="ref-m-tone"><strong>โทนสี:</strong> {img.color_tone}</span>}
                  </div>
                  {img.detail && <p className="ref-acc-detail">{img.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="ref-lb-overlay" onClick={closeLightbox}>
          <div className="ref-lb-box" onClick={e => e.stopPropagation()}>

            {/* Close */}
            <button className="ref-lb-close" onClick={closeLightbox}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Counter */}
            <div className="ref-lb-counter">{lightboxIdx + 1} / {filtered.length}</div>

            {/* Image */}
            <div className="ref-lb-img-wrap">
              <img src={getImgSrc(lightbox.img_path)} alt={lightbox.title} key={lightbox.id} />
            </div>

            {/* Info */}
            <div className="ref-lb-meta">
              <span className="ref-lb-cat-badge">{lightbox.category}</span>
              <p className="ref-lb-title">{lightbox.title}</p>
            </div>

            {/* Nav */}
            <button className="ref-lb-nav ref-lb-prev" onClick={goPrev} disabled={lightboxIdx === 0}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button className="ref-lb-nav ref-lb-next" onClick={goNext} disabled={lightboxIdx === filtered.length - 1}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            {/* Thumbnail strip */}
            <div className="ref-lb-thumbs">
              {filtered.map((img, i) => (
                <div
                  key={img.id}
                  className={`ref-lb-thumb ${i === lightboxIdx ? 'active' : ''}`}
                  onClick={() => { setLightboxIdx(i); setLightbox(img); }}
                >
                  <img src={getImgSrc(img.img_path)} alt={img.title} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Reference;
