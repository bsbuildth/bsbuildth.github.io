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
