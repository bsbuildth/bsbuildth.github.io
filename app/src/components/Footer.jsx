import { useState, useEffect, useMemo } from 'react';
import { getCalculatorTypes, getBusinessInfo, submitContact, getSettings } from '../firebase/api';
import './Footer.css';
import { createContactSender } from '../lib/contact';

const Footer = () => {
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
    email: '',
    message: '',
    serviceType: ''
  });
  const [status, setStatus] = useState('');
  const [calculatorTypes, setCalculatorTypes] = useState([]);
  const [businessInfo, setBusinessInfo] = useState({
    company_name: 'BS Build',
    phone: '02-322-0000',
    line_id: '@bsbuild',
    address: 'กรุงเทพมหานคร'
  });
  // per-channel notification toggles (admin-controlled, default all on)
  const [notifEnable, setNotifEnable] = useState({ email: true, line: true, messenger: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [types, info, settings] = await Promise.all([
          getCalculatorTypes(),
          getBusinessInfo(),
          getSettings()
        ]);

        setCalculatorTypes(types);
        if (types.length > 0) {
          setFormData(prev => prev.serviceType ? prev : { ...prev, serviceType: types[0].type_name });
        }

        const s = {};
        (settings || []).forEach(x => { s[x.setting_key] = x.setting_value; });
        setNotifEnable({
          email: s.notif_email !== false,
          line: s.notif_line !== false,
          messenger: s.notif_messenger !== false,
        });

        if (info) {
          setBusinessInfo({
            company_name: info.company_name || 'BS Build',
            phone: info.phone || '02-322-0000',
            line_id: info.line_id || '',
            address: info.address || 'กรุงเทพมหานคร',
            map_url: info.map_url || '',
            landmark: info.landmark || '',
            email: info.email || '',
            facebook: info.facebook || ''
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  // Prefill the quotation form from the Calculator's "ขอใบเสนอราคา" button
  useEffect(() => {
    const handler = (e) => {
      const d = e.detail || {};
      setFormData(prev => ({
        ...prev,
        message: d.message || prev.message,
        serviceType: d.serviceType || prev.serviceType,
      }));
    };
    window.addEventListener('prefill-quote', handler);
    return () => window.removeEventListener('prefill-quote', handler);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const [sending, setSending] = useState(false);
  const sendContact = useMemo(() => createContactSender(submitContact, (data) => {
    const url = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!url) return;
    return fetch(url, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ ...data, notify: notifEnable }),
    });
  }), [notifEnable]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setStatus('⏳ กำลังส่ง...');
    try {
      const saved = await sendContact(formData);
      if (!saved) return;
      setStatus('✅ บันทึกคำขอแล้ว เราจะติดต่อกลับตามข้อมูลที่ให้ไว้');
      setFormData({ name: '', contactInfo: '', email: '', message: '', serviceType: calculatorTypes[0]?.type_name || '' });
    } catch (error) {
      console.error('Contact save failed:', error);
      setStatus('⚠️ บันทึกไม่สำเร็จ กรุณาตรวจข้อมูลและลองอีกครั้ง ข้อมูลของคุณยังอยู่');
    } finally { setSending(false); }
  };

  return (
    <footer className="footer" id="contact">
      <div className="container footer-container">
        <div className="footer-left">
          <h2 className="footer-title">Let's Create<br />Something Exceptional.</h2>
          <p style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>ระบบขอใบเสนอราคาออนไลน์ กรอกข้อมูลเพื่อให้เราติดต่อกลับพร้อมประเมินราคาให้ฟรี!</p>
          <div className="footer-contact-info">
            {businessInfo.phone && (
            <a href={`tel:${businessInfo.phone}`} className="contact-item" title="โทรศัพท์">
              <span className="contact-icon">📞</span>
              <p>{businessInfo.phone}</p>
            </a>
            )}
            {(businessInfo.map_url || businessInfo.address) && (
            <a href={businessInfo.map_url || `https://www.google.com/maps/search/${encodeURIComponent(businessInfo.address)}`} className="contact-item" target="_blank" rel="noopener noreferrer" title="ดูแผนที่ Google Maps">
              <span className="contact-icon">📍</span>
              <p>{businessInfo.address || 'Google Maps'}</p>
            </a>
            )}
            {businessInfo.landmark && (
            <div className="contact-item" title="จุดสังเกต">
              <span className="contact-icon">⭐</span>
              <p>{businessInfo.landmark}</p>
            </div>
            )}
          </div>
        </div>
        
        <div className="footer-right">
          <form className="contact-form" onSubmit={handleSubmit} style={{background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h3 style={{marginBottom: '1.5rem', color: 'var(--color-accent)'}}>ขอใบเสนอราคา (Quotation)</h3>
            <fieldset disabled={sending} style={{ border: 0, padding: 0, minWidth: 0 }}><div className="form-group">
              <input type="text" name="name" placeholder="ชื่อ-นามสกุล *" value={formData.name} onChange={handleChange} required style={{background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '4px', padding: '0.75rem', width: '100%'}} />
              <input type="text" name="contactInfo" placeholder="Line ID / เบอร์โทร *" value={formData.contactInfo} onChange={handleChange} required style={{background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '4px', padding: '0.75rem', width: '100%'}} />
            </div>
            <div className="form-group" style={{marginTop: '1rem'}}>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="quote-select"
                style={{padding: '0.75rem', background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '4px', width: '100%'}}
              >
                <option value="" disabled hidden>เลือกประเภทงาน</option>
                {calculatorTypes.map(type => (
                  <option key={type.id} value={type.type_name} style={{ color: '#222', background: '#fff' }}>
                    {type.type_name}
                  </option>
                ))}
              </select>
            </div>
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} style={{marginTop: '1rem', background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '4px', padding: '0.75rem', width: '100%'}} />
            <textarea name="message" placeholder="รายละเอียดงานที่ต้องการ..." rows="3" value={formData.message} onChange={handleChange} style={{marginTop: '1rem', background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '4px', padding: '0.75rem', width: '100%'}}></textarea>
            <button type="submit" disabled={sending} className="btn btn-solid submit-btn" style={{width: '100%'}}>{sending ? 'กำลังบันทึก...' : 'ขอใบเสนอราคา'}</button>
            </fieldset>
            {status && <p role="status" aria-live="polite" style={{ marginTop: '1rem', color: status.includes('✅') ? '#4caf50' : status.includes('⚠️') ? '#f44336' : '#ffca4b', textAlign: 'center' }}>{status}</p>}
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <div className="logo-text" style={{ fontSize: '1.5rem' }}>{businessInfo.company_name}</div>
          <p className="copyright">&copy; 2026 {businessInfo.company_name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

