import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticleBySlug } from '../firebase/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LineButton from '../components/LineButton';
import useSeo from '../lib/useSeo';
import './Article.css';

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return ''; }
};

const Article = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    let alive = true;
    getArticleBySlug(slug)
      .then(a => { if (alive) setArticle(a); })
      .catch(() => { if (alive) setArticle(null); });
    return () => { alive = false; };
  }, [slug]);

  useSeo(article ? {
    title: `${article.title} | BSBuildTh`,
    description: article.excerpt,
    image: article.cover && article.cover.startsWith('http') ? article.cover : undefined,
    canonical: `https://bsbuildth.github.io/blog/${article.slug}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt,
      datePublished: article.created_at,
      author: { '@type': 'Organization', name: 'BSBuildTh' },
      publisher: { '@type': 'Organization', name: 'BSBuildTh' },
    },
  } : {});

  const paragraphs = (article?.content || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  return (
    <>
      <Header />
      <main className="article-page">
        {article === undefined ? (
          <p className="article-empty">กำลังโหลด...</p>
        ) : article === null ? (
          <div className="article-empty">
            <p>ไม่พบบทความนี้</p>
            <Link to="/blog" className="article-back">← กลับไปหน้าบทความ</Link>
          </div>
        ) : (
          <article className="article-wrap">
            <Link to="/blog" className="article-back">← บทความทั้งหมด</Link>

            {article.category && <span className="article-cat">{article.category}</span>}
            <h1 className="article-title">{article.title}</h1>
            <p className="article-date">{fmtDate(article.created_at)}</p>

            {article.cover && (
              <div className="article-cover">
                <img src={article.cover} alt={article.title} decoding="async" />
              </div>
            )}

            <div className="article-body">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>

            <div className="article-cta">
              <h3>สนใจต่อเติม–รีโนเวทบ้าน?</h3>
              <p>ปรึกษาฟรี ประเมินราคาเบื้องต้นโดยทีมช่างประสบการณ์กว่า 30 ปี</p>
              <a href="/#contact" className="btn btn-solid">ขอใบเสนอราคา →</a>
            </div>
          </article>
        )}
      </main>
      <Footer />
      <LineButton />
    </>
  );
};

export default Article;
