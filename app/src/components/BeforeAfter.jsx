import React, { useState, useEffect, useRef } from 'react';
import { getImages } from '../firebase/api';
import './BeforeAfter.css';

const BeforeAfter = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const [images, setImages] = useState({
    after: '/after_living_room.png',
    before: '/before_living_room.png'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBeforeAfterImages = async () => {
      try {
        const data = await getImages('before_after');

        // Organize images by key: before_after_after and before_after_before
        const imageMap = {};
        data.forEach(img => {
          imageMap[img.image_key] = img;
        });

        setImages({
          after: imageMap['before_after_after']?.image_path || '/after_living_room.png',
          before: imageMap['before_after_before']?.image_path || '/before_living_room.png'
        });
      } catch (err) {
        console.error('Error fetching before/after images:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBeforeAfterImages();
  }, []);

  const handleSliderChange = (e) => {
    setSliderPos(e.target.value);
  };

  const setPosFromX = (clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setSliderPos(Math.max(2, Math.min(98, p)));
  };
  // Single press-and-drag: bind move/up on the document so dragging starts
  // immediately from the first pointer-down (no second click needed).
  const startDrag = (e) => {
    setPosFromX(e.clientX);
    const move = (ev) => setPosFromX(ev.clientX);
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  if (loading) {
    return (
      <section className="before-after section" id="portfolio">
        <div className="container" data-aos="fade-up">
          <h2 className="section-title text-center">BEFORE & AFTER</h2>
          <p className="text-center text-muted mb-3">Slide to see the transformation.</p>
          <div className="slider-container" style={{ height: '400px', background: '#e0e0e0', borderRadius: '8px' }}></div>
        </div>
      </section>
    );
  }

  return (
    <section className="before-after section" id="portfolio">
      <div className="container" data-aos="fade-up">
        <h2 className="section-title text-center">BEFORE & AFTER</h2>
        <p className="text-center text-muted mb-3">Slide to see the transformation.</p>
        <div
          className="slider-container"
          ref={containerRef}
          onPointerDown={startDrag}
        >
          <div className="image-after">
            <img src={images.after} alt="After Renovation" loading="lazy" decoding="async" />
            <span className="ba-tag ba-tag--after">After</span>
          </div>
          <div className="image-before" style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}>
            <img src={images.before} alt="Before Renovation" loading="lazy" decoding="async" />
            <span className="ba-tag ba-tag--before">Before</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={handleSliderChange}
            className="slider-input"
            aria-label="เลื่อนเปรียบเทียบก่อน-หลัง"
          />
          <div className="slider-line" style={{ left: `${sliderPos}%` }}>
            <div className="slider-button">↔</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfter;

