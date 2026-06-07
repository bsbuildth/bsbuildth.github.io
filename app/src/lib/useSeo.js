import { useEffect } from 'react';

const DEFAULTS = {
  title: 'BSBuildTh รับเหมาต่อเติม–รีโนเวทบ้านครบวงจร ย่านเพชรเกษม-บางแค | ประสบการณ์ 30 ปี',
  description:
    'BSBuildTh ผู้รับเหมาต่อเติมบ้าน รีโนเวทบ้านกรุงเทพฯ ย่านเพชรเกษม-บางแค ครบวงจร ประสบการณ์กว่า 30 ปี รับประกันงาน 1 ปี ประเมินราคาฟรี',
  image: 'https://bsbuildth.github.io/hero_bg.png',
  canonical: 'https://bsbuildth.github.io/',
};

function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Per-page SEO for the SPA. Sets document.title + description + canonical +
 * Open Graph tags. Helps Google (which renders JS); social scrapers still read
 * the static tags in index.html. Restores site defaults on unmount.
 *
 * Optional `jsonLd` injects a <script type="application/ld+json"> for the page
 * (e.g. an Article schema), removed on unmount.
 */
export default function useSeo({ title, description, image, canonical, jsonLd } = {}) {
  useEffect(() => {
    const t = title || DEFAULTS.title;
    const d = description || DEFAULTS.description;
    const img = image || DEFAULTS.image;
    const url = canonical || DEFAULTS.canonical;

    document.title = t;
    setMeta('name', 'description', d);
    setMeta('property', 'og:title', t);
    setMeta('property', 'og:description', d);
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', t);
    setMeta('name', 'twitter:description', d);
    setMeta('name', 'twitter:image', img);
    setCanonical(url);

    let ld;
    if (jsonLd) {
      ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify(jsonLd);
      ld.setAttribute('data-page-ld', 'true');
      document.head.appendChild(ld);
    }

    return () => {
      // restore site-wide defaults when leaving the page
      document.title = DEFAULTS.title;
      setMeta('name', 'description', DEFAULTS.description);
      setMeta('property', 'og:title', DEFAULTS.title);
      setMeta('property', 'og:description', DEFAULTS.description);
      setMeta('property', 'og:image', DEFAULTS.image);
      setMeta('property', 'og:url', DEFAULTS.canonical);
      setCanonical(DEFAULTS.canonical);
      if (ld && ld.parentNode) ld.parentNode.removeChild(ld);
    };
  }, [title, description, image, canonical, jsonLd]);
}
