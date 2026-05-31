import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './premium.css'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { initReveal } from './lib/motion'

const RootApp = () => {
  useEffect(() => {
    AOS.init({
      duration: 900,
      once: true,
      offset: 80,
      easing: 'ease-out-cubic',
    });

    // Firestore data loads async and changes the page height, which makes AOS's
    // cached trigger offsets stale (sections can stay stuck at opacity:0).
    // Recalculate after load + a few delays so every section reveals reliably.
    const refresh = () => { try { AOS.refreshHard(); } catch (e) {} };
    window.addEventListener('load', refresh);
    const timers = [600, 1400, 2600, 4000].map(t => setTimeout(refresh, t));

    // Custom scroll-reveal for .reveal elements (incl. async Firestore sections)
    initReveal();

    // Data now comes from Firestore — unregister the old API-caching service
    // worker so it can't serve stale /api responses from a previous deploy.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(regs => regs.forEach(reg => reg.unregister()))
        .catch(() => {});
    }
  }, []);

  return (
    <BrowserRouter basename="/">
      <App />
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
)
