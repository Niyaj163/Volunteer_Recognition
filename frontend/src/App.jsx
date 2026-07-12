import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import Recognition from './pages/Recognition';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'recognition'
  const [initLoading, setInitLoading] = useState(true);

  // Check for persistent session on component mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('volunteer_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to load user session:', e);
      localStorage.removeItem('volunteer_user');
    } finally {
      setInitLoading(false);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('volunteer_user');
    setUser(null);
    setCurrentPage('home');
  };

  if (initLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0b0f19',
        color: '#9ca3af',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.08)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <span>Restoring your session...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not logged in, render the Login/Registration page
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Routing Logic
  // Only Admin or Executive can view the Recognition page
  const canAccessRecognition = user.role === 'executive' || user.role === 'admin';

  if (currentPage === 'recognition' && canAccessRecognition) {
    return (
      <Recognition 
        user={user} 
        onLogout={handleLogout} 
        onNavigateToHome={() => setCurrentPage('home')} 
      />
    );
  }

  // Fallback / default to Home dashboard page
  return (
    <Home 
      user={user} 
      onLogout={handleLogout} 
      onNavigateToRecognition={() => setCurrentPage('recognition')} 
    />
  );
}
