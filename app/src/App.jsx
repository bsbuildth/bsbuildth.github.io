import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import './index.css';
import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedProjects from './components/FeaturedProjects';
import BeforeAfter from './components/BeforeAfter';
import Calculator from './components/Calculator';
import AboutUs from './components/AboutUs';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import Reference from './components/Reference';
import LineButton from './components/LineButton';
import BlogTeaser from './components/BlogTeaser';
import WorkProcess from './components/WorkProcess';
const Admin = lazy(() => import('./pages/Admin'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Blog = lazy(() => import('./pages/Blog'));
const Article = lazy(() => import('./pages/Article'));
import { hasAdminAccess } from './lib/admin-access';
import { getSettings } from './firebase/api';

const Quotations = lazy(() => import('./pages/Quotations'));

const MainSite = () => {
  const [show, setShow] = useState({});

  useEffect(() => {
    getSettings()
      .then(data => {
        const obj = {};
        data.forEach(s => { obj[s.setting_key] = s.setting_value; });
        setShow(obj);
      })
      .catch(err => console.error('Error fetching section settings:', err));
  }, []);

  // Scroll to a #hash target after mount (e.g. arriving from /blog via "/#contact")
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const t = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 600);
      return () => clearTimeout(t);
    }
  }, []);

  // default visible: only hide when the flag is explicitly false
  const on = (key) => show[key] !== false;

  return (
    <>
      <Header />
      <main>
        {on('show_hero') && <Hero />}
        {on('show_beforeafter') && <BeforeAfter />}
        {on('show_projects') && <FeaturedProjects />}
        {on('show_reference') && <Reference />}
        {on('show_calculator') && <Calculator />}
        {on('show_process') && <WorkProcess />}
        {on('show_about') && <AboutUs />}
        {on('show_services') && <Services />}
        {on('show_reviews') && <Testimonials />}
        {on('show_blog') && <BlogTeaser />}
        <Footer />
      </main>
      <LineButton />
    </>
  );
};

const ProtectedRoute = ({ isAuthenticated, element }) => {
  return isAuthenticated ? element : <Navigate to="/admin/login" replace />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let generation = 0;
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      const current = ++generation;
      setIsAuthenticated(false);
      try {
        const token = user ? await user.getIdTokenResult() : null;
        if (current === generation) setIsAuthenticated(hasAdminAccess(token?.claims, user?.email));
      } catch { if (current === generation) setIsAuthenticated(false); }
      finally { if (current === generation) setLoading(false); }
    });
    return () => { generation++; unsubscribe(); };
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  return (
    <Suspense fallback={<p role="status">กำลังโหลด...</p>}><Routes>
      <Route path="/" element={<MainSite />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<Article />} />
      <Route path="/admin/login" element={<AdminLogin setIsAuthenticated={setIsAuthenticated} />} />
      <Route
        path="/admin"
        element={<ProtectedRoute isAuthenticated={isAuthenticated} element={<Admin setIsAuthenticated={setIsAuthenticated} />} />}
      />
      <Route path="/admin/quotations" element={<ProtectedRoute isAuthenticated={isAuthenticated} element={<Quotations />} />} />
      <Route path="*" element={<main className="container"><h1>ไม่พบหน้านี้</h1><a href="/">กลับหน้าแรก</a></main>} />
    </Routes></Suspense>
  );
}

export default App;
