import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { hasAdminAccess } from '../lib/admin-access';
import { auth } from '../firebase/config';
import '../components/Header.css';

const AdminLogin = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, username.trim(), password);
      const token = await user.getIdTokenResult(true);
      if (!hasAdminAccess(token.claims, user.email)) {
        await signOut(auth);
        setError('บัญชีนี้ยังไม่ได้รับสิทธิ์ผู้ดูแล กรุณาติดต่อเจ้าของระบบ');
        return;
      }
      setIsAuthenticated(true);
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d2b29 0%, #245b55 100%)',
      fontFamily: 'var(--font-body)'
    }}>
      <div style={{
        background: 'rgba(255, 253, 248, 0.96)',
        padding: '2rem',
        borderRadius: '0',
        boxShadow: '0 18px 52px rgba(5, 31, 29, 0.24)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.5rem', color: '#173432', fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>
            ทีมผู้รับเหมา
          </h1>
          <h2 style={{ margin: '0', color: '#60706a', fontSize: '1.2rem', fontWeight: 'normal' }}>
            Admin Dashboard
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#36554d',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin@example.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #bdcbc4',
                borderRadius: '0',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#36554d',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #bdcbc4',
                borderRadius: '0',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              color: '#d32f2f',
              marginBottom: '1rem',
              padding: '0.75rem',
              background: '#ffebee',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#aebfb7' : '#174b47',
              color: '#fff',
              border: 'none',
              borderRadius: '0',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#0d2b29')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#174b47')}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          color: '#718078',
          marginTop: '1.5rem',
          fontSize: '0.9rem'
        }}>
          Professional Construction Management System
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;

