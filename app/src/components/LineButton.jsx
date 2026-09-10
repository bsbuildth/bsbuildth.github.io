import { useState, useEffect } from 'react';
import { getBusinessInfo } from '../firebase/api';
import './LineButton.css';

const LineButton = () => {
  const [lineId, setLineId] = useState('');
  const [messengerUrl, setMessengerUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getBusinessInfo()
      .then(data => {
        if (data?.line_id) setLineId(data.line_id);
        if (data?.messenger_url) setMessengerUrl(data.messenger_url);
        if (data?.facebook) setFacebookUrl(data.facebook);
      })
      .catch(err => console.error('Error fetching business info:', err));
  }, []);

  // @ = Official Account → line.me/R/ti/p/@id
  // ไม่มี @ = LINE User ID → line.me/ti/p/~id
  const lineUrl = lineId.startsWith('@')
    ? `https://line.me/R/ti/p/${lineId}`
    : `https://line.me/ti/p/~${lineId}`;

  // Hide the whole widget until at least one channel is configured in Admin,
  // so customers never see a button that links nowhere.
  if (!lineId && !messengerUrl && !facebookUrl) return null;

  return (
    <div className="float-stack">
      {/* LINE */}
      {lineId && (
      <a
        href={lineUrl}
        target="_blank"
        rel="noreferrer"
        className={`float-btn float-btn--line ${open ? 'visible' : ''}`}
        title="ติดต่อผ่าน LINE"
      >
        <svg viewBox="0 0 36 36" width="30" height="30" aria-hidden="true">
          <path fill="#fff" d="M18 5.4c-7 0-12.7 4.6-12.7 10.3 0 5.1 4.5 9.4 10.6 10.2.41.09.97.27 1.11.62.13.32.08.82.04 1.14l-.18 1.08c-.05.32-.25 1.25 1.1.68 1.35-.57 7.28-4.29 9.93-7.34 1.83-2.01 2.71-4.05 2.71-6.36 0-5.7-5.71-10.3-12.66-10.3z"/>
          <path fill="#06C755" d="M14.27 13.6h-.89c-.14 0-.25.11-.25.24v5.55c0 .13.11.24.25.24h.89c.14 0 .25-.11.25-.24v-5.55c0-.13-.11-.24-.25-.24zm6.15 0h-.89c-.14 0-.25.11-.25.24v3.3l-2.54-3.43a.21.21 0 0 0-.02-.03l-.02-.02h-.93c-.14 0-.25.11-.25.24v5.55c0 .13.11.24.25.24h.89c.14 0 .25-.11.25-.24v-3.3l2.55 3.44c.02.02.04.04.06.06h.95c.14 0 .25-.11.25-.24v-5.55c0-.13-.11-.24-.25-.24zm-9.51 4.66H8.49v-4.42c0-.13-.11-.24-.25-.24h-.89c-.14 0-.25.11-.25.24v5.55c0 .07.03.12.07.17.05.04.1.07.17.07h3.57c.14 0 .25-.11.25-.25v-.88c0-.13-.11-.24-.25-.24zm15.15-4.66h-3.57c-.13 0-.24.11-.24.24v5.55c0 .13.11.24.24.24h3.57c.14 0 .25-.11.25-.24v-.89c0-.13-.11-.24-.25-.24h-2.43v-.94h2.43c.14 0 .25-.11.25-.25v-.88c0-.14-.11-.25-.25-.25h-2.43v-.94h2.43c.14 0 .25-.11.25-.24v-.89c0-.13-.11-.24-.25-.24z"/>
        </svg>
        <span className="float-tooltip">แชทผ่าน LINE</span>
      </a>
      )}

      {/* Messenger */}
      {messengerUrl && (
      <a
        href={messengerUrl}
        target="_blank"
        rel="noreferrer"
        className={`float-btn float-btn--messenger ${open ? 'visible' : ''}`}
        title="ติดต่อผ่าน Messenger"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.929 1.46 5.546 3.746 7.255V22l3.42-1.878c.913.253 1.882.39 2.834.39 5.523 0 10-4.144 10-9.269C22 6.145 17.523 2 12 2zm.993 12.478l-2.548-2.718-4.971 2.718 5.469-5.803 2.61 2.718 4.909-2.718-5.469 5.803z"/>
        </svg>
        <span className="float-tooltip">Messenger</span>
      </a>
      )}

      {/* Facebook */}
      {facebookUrl && (
      <a
        href={facebookUrl}
        target="_blank"
        rel="noreferrer"
        className={`float-btn float-btn--facebook ${open ? 'visible' : ''}`}
        title="ติดต่อผ่าน Facebook"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span className="float-tooltip">Facebook</span>
      </a>
      )}

      {/* Toggle button */}
      <button
        className={`float-btn float-btn--toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        title={open ? 'ปิด' : 'ติดต่อเรา'}
        aria-label="toggle contact"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        )}
      </button>
    </div>
  );
};

export default LineButton;
