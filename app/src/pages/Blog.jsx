import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles } from '../firebase/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LineButton from '../components/LineButton';
import useSeo from '../lib/useSeo';
import './Blog.css';

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return ''; }
};

const Blog = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: 'บทความ & ความรู้งานต่อเติม–รีโนเวทบ้าน | BSBuildTh',
    description: 'รวมบทความ ไอเดีย และความรู้เรื่องต่อเติมบ้าน รีโนเวทบ้าน และการเลือกผู้รับเหมา จากทีมช่างประสบการณ์กว่า 30 ปี',
    canonical: 'https://bsbuildth.github.io/blog',
  });

  useEffect(() => {
    getArticles()
      .then(data => { setArticles(data); setLoading(false); })
      .catch(err => { console.error('Failed to load articles:', err); setLoading(false); });
  }, []);

  return (
    <>
      <Header />
      <main className="blog-page">
        <div className="blog-hero">
          <span className="blog-eyebrow">ARTICLES & KNOWLEDGE</span>
          <h1 className="blog-title">บทความ & ความรู้</h1>
          <p className="blog-sub">ไอเดียและคำแนะนำเรื่องต่อเติม–รีโนเวทบ้าน จากทีมช่างประสบการณ์กว่า 30 ปี</p>
        </div>

        <div className="blog-container">
          {loading ? (
            <p className="blog-empty">กำลังโหลดบทความ...</p>
          ) : articles.length === 0 ? (
            <p className="blog-empty">ยังไม่มีบทความ</p>
          ) : (
            <div className="blog-grid">
              {articles.map(a => (
                <Link to={`/blog/${a.slug}`} className="blog-card" key={a.id}>
                  <div className="blog-card-img">
                    {a.cover && <img src={a.cover} alt={a.title} loading="lazy" decoding="async" />}
                  </div>
                  <div className="blog-card-body">
                    {a.category && <span className="blog-card-cat">{a.category}</span>}
                    <h2 className="blog-card-title">{a.title}</h2>
                    <p className="blog-card-excerpt">{a.excerpt}</p>
                    <div className="blog-card-foot">
                      <span className="blog-card-date">{fmtDate(a.created_at)}</span>
                      <span className="blog-card-more">อ่านต่อ →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <LineButton />
    </>
  );
};

export default Blog;
