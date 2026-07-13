import React, { useState, useEffect } from 'react';
import { Award, LogOut, Search, User, ShieldCheck, Settings, Users, Key, Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';

const API_URL = window.location.origin.includes('localhost:5173')
  ? 'http://localhost:5000/api'
  : '/api';

export default function Home({ user, onLogout, onNavigateToRecognition }) {
  const [volunteers, setVolunteers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin secret code state
  const [secretCode, setSecretCode] = useState('');
  const [newSecretCode, setNewSecretCode] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminError, setAdminError] = useState('');

  // Fetch volunteers list (Top 20 or All)
  const fetchVolunteers = async (isAll = false) => {
    setLoading(true);
    setError('');
    try {
      const endpoint = `/volunteers${isAll ? '?all=true' : ''}`;
      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load volunteers.');
      setVolunteers(data.volunteers);
      setIsSearching(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run search query
  const performSearch = async (query) => {
    if (!query.trim()) {
      fetchVolunteers(showAll);
      return;
    }
    setLoading(true);
    setError('');
    setIsSearching(true);
    try {
      const response = await fetch(`${API_URL}/volunteers/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search failed.');
      setVolunteers(data.volunteers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin secret code
  const fetchSecretCode = async () => {
    if (user.role !== 'admin') return;
    setAdminLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/secret-code?adminId=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setSecretCode(data.secretCode);
        setNewSecretCode(data.secretCode);
      }
    } catch (err) {
      console.error('Failed to load secret code:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  // Handle secret code update
  const handleUpdateSecretCode = async (e) => {
    e.preventDefault();
    if (!newSecretCode.trim()) {
      setAdminError('Secret code cannot be empty.');
      return;
    }
    setAdminLoading(true);
    setAdminSuccess('');
    setAdminError('');
    try {
      const response = await fetch(`${API_URL}/admin/secret-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secretCode: newSecretCode, adminId: user.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update.');
      setAdminSuccess('Executive Secret Code updated successfully!');
      setSecretCode(newSecretCode);
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    performSearch(val);
  };

  useEffect(() => {
    fetchVolunteers(showAll);
    if (user.role === 'admin') {
      fetchSecretCode();
    }
  }, [showAll]);

  const handleToggleShowAll = () => {
    setShowAll(!showAll);
    setSearchQuery('');
  };

  const getRankBadge = (index) => {
    if (isSearching) return null;
    if (index === 0) return <span className="rank-badge rank-1">🏆 1st</span>;
    if (index === 1) return <span className="rank-badge rank-2">🥈 2nd</span>;
    if (index === 2) return <span className="rank-badge rank-3">🥉 3rd</span>;
    return <span className="rank-badge rank-normal">#{index + 1}</span>;
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <img src={logo} alt="RCS Logo" className="nav-logo-icon" />
            <div className="nav-divider"></div>
            <div className="user-profile-badge">
              <User size={14} className="profile-icon" />
              <span className="profile-name">{user.name}</span>
              <span className={`role-tag role-${user.role}`}>{user.role}</span>
            </div>
          </div>

          {/* Search bar in Navbar */}
          <div className="navbar-center">
            <div className="nav-search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="nav-search-input"
                placeholder="Search volunteers by Name or ID..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => { setSearchQuery(''); fetchVolunteers(showAll); }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="navbar-right desktop-nav-menu">
            {/* Conditional Executive Page Route */}
            {(user.role === 'executive' || user.role === 'admin') && (
              <button className="btn btn-secondary nav-action-btn" onClick={onNavigateToRecognition}>
                <ShieldCheck size={18} />
                Recognition Panel
              </button>
            )}
            <button className="logout-btn" onClick={onLogout} title="Log Out">
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav-menu animate-fade-in">
            {/* Mobile User Profile badge */}
            <div className="mobile-user-profile">
              <User size={16} className="profile-icon" />
              <span className="profile-name">{user.name}</span>
              <span className={`role-tag role-${user.role}`}>{user.role}</span>
            </div>

            <div className="mobile-search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="nav-search-input"
                placeholder="Search by Name or ID..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            {(user.role === 'executive' || user.role === 'admin') && (
              <button 
                className="btn btn-secondary mobile-menu-item" 
                onClick={() => { setMobileMenuOpen(false); onNavigateToRecognition(); }}
              >
                <ShieldCheck size={18} />
                Recognition Panel
              </button>
            )}
            <button 
              className="logout-btn mobile-menu-item" 
              onClick={() => { setMobileMenuOpen(false); onLogout(); }}
            >
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <header className="page-header animate-fade-in">
          <div className="header-text">
            <h2>
              {isSearching ? `Search Results for "${searchQuery}"` : showAll ? 'All Registered Volunteers' : 'Top 20 Leaderboard'}
            </h2>
            <p>
              {isSearching 
                ? `Found ${volunteers.length} volunteer(s)` 
                : showAll 
                  ? 'Viewing all active volunteers in the system' 
                  : 'Displaying our top contributors sorted by total recognition points'}
            </p>
          </div>
          
          {!isSearching && (
            <button className="btn btn-primary" onClick={handleToggleShowAll}>
              <Users size={18} />
              {showAll ? 'Show Top 20' : 'Show All Volunteers'}
            </button>
          )}
        </header>

        {/* Volunteer Table */}
        <div className="glass-card table-card animate-fade-in">
          {error && (
            <div className="alert alert-danger">
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="table-loader">
              <div className="spinner"></div>
              <p>Fetching volunteer records...</p>
            </div>
          ) : volunteers.length === 0 ? (
            <div className="empty-state">
              <Award size={48} className="empty-state-icon" />
              <h3>No volunteers found</h3>
              <p>Create an account or adjust your search queries.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    {!isSearching && <th style={{ width: '10%' }}>Rank</th>}
                    <th>Volunteer Name</th>
                    <th>Student ID</th>
                    <th style={{ textAlign: 'right' }}>Recognition Points</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((vol, idx) => (
                    <tr key={vol.id}>
                      {!isSearching && <td>{getRankBadge(idx)}</td>}
                      <td>
                        <div className="volunteer-name-cell">
                          <div className="avatar-placeholder">{vol.name.charAt(0)}</div>
                          <div>
                            <span className="vol-name">{vol.name}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="vol-id-badge">{vol.id}</code>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="points-badge">
                          <Award size={14} className="points-icon" />
                          {vol.points} Points
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin Secret Code Settings Panel */}
        {user.role === 'admin' && (
          <section className="admin-panel-section animate-fade-in">
            <div className="glass-card admin-card">
              <div className="admin-card-header">
                <Settings className="admin-icon" />
                <h3>Admin Settings - Secret Code Management</h3>
              </div>
              <p className="admin-desc">
                Change the validation code that Executive Members must input during registration. Keep this secure to prevent unauthorized access to executive functions.
              </p>

              {adminSuccess && (
                <div className="alert alert-success">
                  <span>{adminSuccess}</span>
                </div>
              )}

              {adminError && (
                <div className="alert alert-danger">
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateSecretCode} className="admin-form">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label" htmlFor="currentCode">Current Secret Code</label>
                    <div className="input-read-only">
                      <Key size={16} />
                      <input id="currentCode" type="text" value={secretCode || 'Loading...'} readOnly />
                    </div>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label" htmlFor="newCode">New Secret Code</label>
                    <div className="input-with-icon">
                      <Key size={16} className="input-icon" />
                      <input
                        id="newCode"
                        type="text"
                        className="form-input text-input"
                        placeholder="Enter new code"
                        value={newSecretCode}
                        onChange={(e) => setNewSecretCode(e.target.value)}
                        disabled={adminLoading}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={adminLoading}>
                  {adminLoading ? 'Saving...' : 'Update Secret Code'}
                </button>
              </form>
            </div>
          </section>
        )}
      </main>

      {/* Footer Demo */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">
              <img src={logo} alt="RCS Logo" className="footer-logo-icon" />
              <span>RCS</span>
            </div>
            <p>Recognizing excellence and volunteer dedication since 2018.</p>
          </div>
          <div className="footer-right">
            <span>&copy; {new Date().getFullYear()} RUET Computing Society. All Rights Reserved.</span>
            <div className="footer-links">
              <a href="#about" onClick={(e) => e.preventDefault()}>About</a>
              <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <a href="#support" onClick={(e) => e.preventDefault()}>Support</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        /* Leaderboard Page Header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1.5rem;
        }

        .header-text h2 {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .header-text p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        /* Volunteer Table Styles */
        .table-card {
          margin-bottom: 3rem;
          padding: 1.5rem;
        }

        .table-loader {
          text-align: center;
          padding: 3rem 0;
          color: var(--text-secondary);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 4rem 1rem;
          color: var(--text-secondary);
        }

        .empty-state-icon {
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin-bottom: 0.5rem;
        }

        .volunteer-name-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar-placeholder {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--primary), #818cf8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
        }

        .vol-name {
          font-weight: 600;
        }

        .vol-id-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .points-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--accent-light);
          color: #fbbf24;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .rank-badge {
          display: inline-block;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .rank-1 { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .rank-2 { background: rgba(156, 163, 175, 0.15); color: #d1d5db; }
        .rank-3 { background: rgba(180, 83, 9, 0.15); color: #f59e0b; }
        .rank-normal { color: var(--text-muted); }

        /* Admin Settings Card */
        .admin-panel-section {
          margin-bottom: 3rem;
        }

        .admin-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .admin-icon {
          color: var(--primary);
        }

        .admin-desc {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          max-width: 700px;
        }

        .admin-form {
          margin-top: 1rem;
        }

        .form-row {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }

        .flex-1 {
          flex: 1;
        }

        .input-read-only {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          color: var(--text-muted);
        }

        .input-read-only input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          color: var(--text-muted);
          font-size: 1rem;
        }

        /* Footer styling */
        .footer {
          background: rgba(19, 27, 46, 0.6);
          border-top: 1px solid var(--border-color);
          padding: 2.5rem 1rem;
          margin-top: auto;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
        }

        .footer-left {
          max-width: 400px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          color: white;
        }

        .footer-logo-icon {
          color: var(--primary);
          width: 20px;
          height: 20px;
        }

        .footer-left p {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .footer-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .footer-links {
          display: flex;
          gap: 1.5rem;
        }

        .footer-links a {
          color: var(--text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .footer-links a:hover {
          color: var(--primary);
        }

        /* --- Media Queries for Navbar & Table Responsiveness --- */
        @media (max-width: 900px) {
          .navbar-container {
            flex-wrap: wrap;
          }
          
          .navbar-center {
            order: 3;
            width: 100%;
            max-width: 100%;
          }
        }

        @media (max-width: 768px) {
          .desktop-nav-menu {
            display: none;
          }

          .mobile-menu-toggle {
            display: block;
          }

          .mobile-nav-menu {
            display: flex;
            flex-direction: column;
            width: 100%;
            padding: 1rem 0;
            gap: 1rem;
            border-top: 1px solid var(--border-color);
            order: 4;
          }

          .mobile-search-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;
          }

          .mobile-menu-item {
            width: 100%;
            justify-content: flex-start;
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.02);
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .page-header button {
            width: 100%;
          }

          .form-row {
            flex-direction: column;
            gap: 1rem;
          }

          .footer-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }

          .footer-right {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
