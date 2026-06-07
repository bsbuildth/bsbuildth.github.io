import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles } from '../firebase/api';
import './BlogTeaser.css';

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return ''; }
};

const BlogTeaser = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    getArticles()
      .then(data => setArticles(data.slice(0, 3)))
      .catch(err => console.error('Failed to load articles:', err));
  }, []);

  if (articles.length === 0) return null;

  return (
    <section className="blogteaser section" id="articles">
      <div className="container">
        <div className="blogteaser-head" data-aos="fade-up">
          <div>
            <p className="eyebrow">ARTICLES & KNOWLEDGE</p>
            <h2 className="section-title">บทความ &amp; ความรู้</h2>
          </div>
          <Link to="/blog" className="blogteaser-all">อ่านบทความทั้งหมด →</Link>
        </div>

        <div className="blogteaser-grid">
          {articles.map(a => (
            <Link to={`/blog/${a.slug}`} className="blogteaser-card" key={a.id} data-aos="fade-up">
              <div className="blogteaser-img">
                {a.cover && <img src={a.cover} alt={a.title} loading="lazy" decoding="async" />}
              </div>
              <div className="blogteaser-body">
                {a.category && <span className="blogteaser-cat">{a.category}</span>}
                <h3 className="blogteaser-title">{a.title}</h3>
                <span className="blogteaser-date">{fmtDate(a.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogTeaser;
