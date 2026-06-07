import React, { useState, useEffect, useRef } from 'react';
import { getProjects, getProject } from '../firebase/api';
import './FeaturedProjects.css';

const CATEGORY_LABELS = {
  interior: 'ตกแต่งภายใน',
  exterior: 'ต่อเติมภายนอก',
  renovation: 'รีโนเวท'
};

const FeaturedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [procIdx, setProcIdx] = useState(0);

  const scrollRef = useRef(null);
  const pausedRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const resumeTimer = useRef(null);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    getProjects()
      .then(data => { setProjects(data); setLoading(false); })
      .catch(err => { console.error('Failed to fetch projects:', err); setLoading(false); });
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedProject ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProject]);

  const filteredProjects = (projects || []).filter(p => filter === 'all' || (p.category || 'renovation') === filter);

  // Auto-scroll loop (pauses on hover / user interaction). Cards are duplicated
  // once so scrollLeft can wrap seamlessly at the halfway point.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || filteredProjects.length === 0) return;
    let raf;
    const tick = () => {
      if (el && !pausedRef.current && !dragRef.current.active) {
        el.scrollLeft += 0.5;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [filteredProjects.length, filter]);

  const pauseThenResume = (delay = 1500) => {
    pausedRef.current = true;
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { pausedRef.current = false; }, delay);
  };

  const onWheel = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      pauseThenResume();
    }
  };

  const onPointerDown = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    pausedRef.current = true;
    el.classList.add('dragging');
  };
  const onPointerMove = (e) => {
    const el = scrollRef.current;
    if (!el || !dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 4) dragRef.current.moved = true;
    el.scrollLeft = dragRef.current.startScroll - dx;
  };
  const endDrag = () => {
    const el = scrollRef.current;
    if (el) el.classList.remove('dragging');
    dragRef.current.active = false;
    pauseThenResume(1500);
  };

  const handleOpenDetail = async (project) => {
    setSelectedProject(project);
    setProjectDetail(null);
    setProcIdx(0);
    setDetailLoading(true);
    try {
      const data = await getProject(project.id);
      setProjectDetail(data || project);
    } catch (err) {
      console.error('Error loading project details:', err);
      setProjectDetail(project);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
    setProjectDetail(null);
  };

  const getImgSrc = (img) =>
    img && img.startsWith('http') ? img : `${apiUrl}${img}`;

  const processImages = projectDetail?.process_images || [];
  const goProc = (dir) => setProcIdx(i => {
    const n = processImages.length;
    return (i + dir + n) % n;
  });

  const renderCard = (project, keyPrefix = '') => (
    <article
      className="project-card fp-card"
      key={`${keyPrefix}${project.id}`}
      onClick={() => { if (!dragRef.current.moved) handleOpenDetail(project); }}
    >
      <div className="project-img-wrapper">
        <img src={getImgSrc(project.img)} alt={project.title} className="project-img" loading="lazy" decoding="async" />
        <div className="project-shade" />
        <div className="project-caption">
          <span className="project-cat">{CATEGORY_LABELS[project.category] || 'รีโนเวท'}</span>
          <h3 className="project-title">{project.title}</h3>
          <span className="project-btn">ดูรายละเอียด <em>→</em></span>
        </div>
      </div>
    </article>
  );

  return (
    <section className="featured-projects" id="projects">
      <div className="container fp-head" data-aos="fade-up">
        <div>
          <p className="eyebrow">Selected Works</p>
          <h2 className="section-title">ผลงานที่ผ่านมา</h2>
        </div>
        <div className="project-filters">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>ทั้งหมด</button>
          <button className={`filter-btn ${filter === 'interior' ? 'active' : ''}`} onClick={() => setFilter('interior')}>ตกแต่งภายใน</button>
          <button className={`filter-btn ${filter === 'exterior' ? 'active' : ''}`} onClick={() => setFilter('exterior')}>ต่อเติมภายนอก</button>
          <button className={`filter-btn ${filter === 'renovation' ? 'active' : ''}`} onClick={() => setFilter('renovation')}>รีโนเวท</button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading projects...</p>
      ) : filteredProjects.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>ยังไม่มีผลงานในหมวดนี้</p>
      ) : (
        <div
          className="fp-scroller"
          ref={scrollRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { if (!dragRef.current.active) pausedRef.current = false; }}
        >
          {filteredProjects.map(p => renderCard(p, 'a-'))}
          {filteredProjects.map(p => renderCard(p, 'b-'))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedProject && (
        <div className="project-modal-overlay" onClick={handleCloseModal}>
          <div className="project-modal" onClick={e => e.stopPropagation()}>
            <button className="project-modal-close" onClick={handleCloseModal}>✕</button>

            <div className="project-modal-hero">
              <img src={getImgSrc(selectedProject.img)} alt={selectedProject.title} />
              <span className="project-modal-category">
                {CATEGORY_LABELS[selectedProject.category] || 'รีโนเวท'}
              </span>
            </div>

            <div className="project-modal-body">
              <h2 className="project-modal-title">{selectedProject.title}</h2>

              {detailLoading ? (
                <p style={{ color: 'var(--ink-soft)', textAlign: 'center', padding: '2rem' }}>กำลังโหลด...</p>
              ) : (
                <>
                  {projectDetail?.description && (
                    <div className="project-modal-description">
                      <h4>รายละเอียดโครงการ</h4>
                      <p>{projectDetail.description}</p>
                    </div>
                  )}

                  {processImages.length > 0 && (
                    <div className="project-modal-process">
                      <h4>ภาพระหว่างดำเนินการ</h4>
                      <div className="proc-slider">
                        <div className="proc-stage">
                          <img src={getImgSrc(processImages[procIdx].img_path)} alt={processImages[procIdx].caption || 'ระหว่างดำเนินการ'} />
                          {processImages.length > 1 && (
                            <>
                              <button className="proc-nav proc-prev" onClick={() => goProc(-1)} aria-label="ก่อนหน้า">‹</button>
                              <button className="proc-nav proc-next" onClick={() => goProc(1)} aria-label="ถัดไป">›</button>
                              <span className="proc-counter">{procIdx + 1} / {processImages.length}</span>
                            </>
                          )}
                        </div>
                        {processImages[procIdx].caption && (
                          <p className="proc-caption">{processImages[procIdx].caption}</p>
                        )}
                        {processImages.length > 1 && (
                          <div className="proc-dots">
                            {processImages.map((img, i) => (
                              <button
                                key={img.id ?? i}
                                className={`proc-dot ${i === procIdx ? 'active' : ''}`}
                                onClick={() => setProcIdx(i)}
                                aria-label={`รูปที่ ${i + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!projectDetail?.description && processImages.length === 0 && (
                    <p style={{ color: 'var(--ink-soft)', textAlign: 'center', padding: '1rem 0' }}>ยังไม่มีรายละเอียดเพิ่มเติม</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedProjects;
