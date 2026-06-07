import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getMenus } from '../firebase/api';
import './Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [lang, setLang] = useState('th');
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const savedLang = localStorage.getItem('website_lang');
    if (savedLang) setLang(savedLang);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    getMenus()
      .then(data => setMenus(data))
      .catch(err => console.error('Error fetching menus:', err));
  }, []);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMenu = () => setMobileMenuOpen(false);

  // Section links work from any route: scroll if already home, else go home + scroll.
  const goSection = (e, id) => {
    closeMenu();
    if (pathname === '/') {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      e.preventDefault();
      navigate('/#' + id);
    }
  };
  const goHome = (e) => {
    closeMenu();
    if (pathname === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const toggleLang = () => {
    const newLang = lang === 'th' ? 'en' : 'th';
    setLang(newLang);
    localStorage.setItem('website_lang', newLang);
  };

  const regularMenus = menus.filter(m => !m.is_cta);
  const ctaMenu = menus.find(m => m.is_cta);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-container">
        <Link
          to="/"
          className="logo"
          onClick={goHome}
          style={{ cursor: 'pointer', textDecoration: 'none' }}
          title="กลับหน้าหลัก"
        >
          <span className="logo-text">BSBuildTh</span>
          <span className="logo-subtext">Professional Construction</span>
        </Link>
        
        <nav className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {menus.length === 0 ? (
            <>
              <a href="/#services" className="nav-link" onClick={(e) => goSection(e, 'services')}>บริการ</a>
              <a href="/#calculator" className="nav-link" onClick={(e) => goSection(e, 'calculator')}>ประเมินราคา</a>
              <a href="/#projects" className="nav-link" onClick={(e) => goSection(e, 'projects')}>ผลงาน</a>
              <Link to="/blog" className="nav-link" onClick={closeMenu}>บทความ</Link>
              <a href="/#contact" className="btn btn-solid nav-btn" onClick={(e) => goSection(e, 'contact')}>ขอใบเสนอราคา</a>
            </>
          ) : (
            <>
              {regularMenus.map(menu => (
                <a key={menu.id} href={menu.link_url} className="nav-link" onClick={closeMenu}>
                  {lang === 'th' ? menu.label_thai : menu.label_english}
                </a>
              ))}
              {ctaMenu && (
                <a href={ctaMenu.link_url} className="btn btn-solid nav-btn" onClick={closeMenu}>
                  {lang === 'th' ? ctaMenu.label_thai : ctaMenu.label_english}
                </a>
              )}
            </>
          )}
          
          <button onClick={toggleLang} className="lang-toggle-btn" title="Switch Language">
            {lang === 'th' ? 'EN' : 'TH'}
          </button>
        </nav>

        <div className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </header>
  );
};

export default Header;
