import React, { useState } from 'react';
import { User, Shield, Lock, Key } from 'lucide-react';
import logo from '../assets/logo.png';

const API_URL = window.location.origin.includes('localhost:5173')
  ? 'http://localhost:5000/api'
  : '/api';

export default function Login({ onLoginSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [role, setRole] = useState('volunteer'); // 'volunteer' | 'executive'
  
  // Form States
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setStudentId('');
    setSecretCode('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleTabChange = (isLogin) => {
    setIsLoginTab(isLogin);
    resetForm();
  };

  const validateForm = () => {
    if (!isLoginTab && !name.trim()) {
      setError('Full Name is required.');
      return false;
    }
    if (!/^\d{7}$/.test(studentId)) {
      setError('Student ID must be exactly a 7-digit number.');
      return false;
    }
    if (!isLoginTab && role === 'executive' && !secretCode.trim()) {
      setError('Secret Code is required for Executive Members.');
      return false;
    }
    if (!password) {
      setError('Password is required.');
      return false;
    }
    if (!isLoginTab && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isLoginTab ? '/auth/login' : '/auth/register';
      const payload = isLoginTab 
        ? { id: studentId, password } 
        : { name, id: studentId, role, password, secretCode: role === 'executive' ? secretCode : undefined };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      if (isLoginTab) {
        setSuccess('Logged in successfully!');
        // Persist session
        localStorage.setItem('volunteer_user', JSON.stringify(data.user));
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 800);
      } else {
        setSuccess('Registration successful! You can now log in.');
        setIsLoginTab(true);
        // Pre-fill the login form
        const registeredId = studentId;
        resetForm();
        setStudentId(registeredId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-brand animate-fade-in">
        <div className="brand-logo" style={{ padding: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', boxShadow: 'none' }}>
          <img src={logo} alt="RCS Logo" className="logo-icon animate-pulse-soft" />
        </div>
        <h1>RCS Volunteer Hub</h1>
        <p>Acknowledge efforts, inspire commitment, and shape the community.</p>
      </div>

      <div className="glass-card login-card animate-fade-in">
        {/* Dual Tab Toggle */}
        <div className="login-tabs">
          <button 
            type="button" 
            className={`tab-btn ${isLoginTab ? 'active' : ''}`}
            onClick={() => handleTabChange(true)}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className={`tab-btn ${!isLoginTab ? 'active' : ''}`}
            onClick={() => handleTabChange(false)}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
          {/* Conditional Role Selection for Registration */}
          {!isLoginTab && (
            <div className="form-group">
              <span className="form-label">Register As</span>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-btn ${role === 'volunteer' ? 'active' : ''}`}
                  onClick={() => setRole('volunteer')}
                >
                  <User size={18} />
                  Volunteer
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'executive' ? 'active' : ''}`}
                  onClick={() => setRole('executive')}
                >
                  <Shield size={18} />
                  Executive Member
                </button>
              </div>
            </div>
          )}

          {/* Full Name (Registration Only) */}
          {!isLoginTab && (
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="fullName"
                  type="text"
                  className="form-input text-input"
                  placeholder="Kuddus"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* Student ID */}
          <div className="form-group">
            <label className="form-label" htmlFor="studentId">Student ID (7 digits)</label>
            <div className="input-with-icon">
              <Key size={18} className="input-icon" />
              <input
                id="studentId"
                type="text"
                className="form-input text-input"
                placeholder="7103001"
                maxLength={7}
                value={studentId}
                onChange={(e) => {
                  // Only allow digits
                  const val = e.target.value.replace(/\D/g, '');
                  setStudentId(val);
                }}
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group animate-fade-in">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input text-input"
                placeholder={isLoginTab ? "Enter your password" : "Create a password (min 6 chars)"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Secret Code (Registration as Executive Only) */}
          {!isLoginTab && role === 'executive' && (
            <div className="form-group animate-fade-in">
              <label className="form-label" htmlFor="secretCode">Executive Secret Code</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="secretCode"
                  type="password"
                  className="form-input text-input"
                  placeholder="Enter system secret code"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : isLoginTab ? 'Sign In' : 'Register Account'}
          </button>
        </form>
      </div>

      <style>{`
        .login-page-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          min-height: 90vh;
        }

        .login-brand {
          text-align: center;
          margin-bottom: 2rem;
        }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary), #818cf8);
          border-radius: var(--radius-xl);
          padding: 1rem;
          margin-bottom: 1rem;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
        }

        .logo-icon {
          color: white;
        }

        .login-brand h1 {
          font-size: 2.25rem;
          margin-bottom: 0.5rem;
        }

        .login-brand p {
          color: var(--text-secondary);
          max-width: 420px;
          font-size: 0.95rem;
        }

        .login-card {
          width: 100%;
          max-width: 480px;
        }

        .login-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-md);
          padding: 0.35rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border-color);
        }

        .tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 0.6rem;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: calc(var(--radius-md) - 2px);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab-btn.active {
          background: var(--bg-tertiary);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .login-form {
          display: flex;
          flex-direction: column;
        }

        .role-selector {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }

        .role-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          padding: 0.6rem 0.5rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .role-btn.active {
          background: var(--primary-light);
          border-color: var(--primary);
          color: white;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
        }

        .text-input {
          padding-left: 2.75rem !important;
        }

        .login-submit-btn {
          margin-top: 1rem;
          width: 100%;
        }

        @media (max-width: 480px) {
          .login-brand h1 {
            font-size: 1.75rem;
          }
          
          .role-selector {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
