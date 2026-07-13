import React, { useState, useEffect } from 'react';
import { Award, LogOut, ArrowLeft, Plus, Trash2, Search, Check, AlertCircle, Menu, X, User } from 'lucide-react';
import logo from '../assets/logo.png';

const API_URL = window.location.origin.includes('localhost:5173')
  ? 'http://localhost:5000/api'
  : '/api';

export default function Recognition({ user, onLogout, onNavigateToHome }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Recognition Form States
  const [selections, setSelections] = useState([{ id: '', searchVal: '', dropdownOpen: false }]);
  const [workDescription, setWorkDescription] = useState('');
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch all volunteers for the dropdown selection
  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/volunteers?all=true`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load volunteers.');
      setVolunteers(data.volunteers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  // Handle Search Input Change within a specific dropdown row
  const handleDropdownSearchChange = (index, val) => {
    const updated = [...selections];
    updated[index].searchVal = val;
    updated[index].id = ''; // Clear ID to force selecting from the list if they edit the text
    setSelections(updated);
  };

  // Toggle Dropdown visibility
  const toggleDropdown = (index, isOpen) => {
    const updated = [...selections];
    updated[index].dropdownOpen = isOpen;
    setSelections(updated);
  };

  // Select a volunteer in a row
  const handleSelectVolunteer = (index, volunteer) => {
    const updated = [...selections];
    updated[index].id = volunteer.id;
    updated[index].searchVal = `${volunteer.name} (${volunteer.id})`;
    updated[index].dropdownOpen = false;
    setSelections(updated);
    setFormError('');
  };

  // Add a new volunteer selection row
  const handleAddMoreRow = () => {
    setSelections([...selections, { id: '', searchVal: '', dropdownOpen: false }]);
  };

  // Remove a volunteer selection row
  const handleRemoveRow = (index) => {
    if (selections.length === 1) {
      // Just reset the row if it's the last one left
      setSelections([{ id: '', searchVal: '', dropdownOpen: false }]);
      return;
    }
    const updated = selections.filter((_, idx) => idx !== index);
    setSelections(updated);
  };

  // Handle Recognition Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    // Extract valid non-empty IDs
    const selectedIds = selections.map(s => s.id).filter(id => id !== '');

    if (selectedIds.length === 0) {
      setFormError('Please select at least one volunteer to recognize.');
      return;
    }

    if (!workDescription.trim()) {
      setFormError('Work description is required.');
      return;
    }

    setFormSubmitLoading(true);

    try {
      const response = await fetch(`${API_URL}/recognitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workDescription,
          recipients: selectedIds,
          executiveId: user.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit recognition.');
      }

      setFormSuccess('Recognition recorded successfully! points awarded to volunteers.');
      // Reset form states
      setSelections([{ id: '', searchVal: '', dropdownOpen: false }]);
      setWorkDescription('');
      
      // Refresh local volunteers points
      fetchVolunteers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Filter list of volunteers for a specific dropdown row, excluding already selected volunteers
  const getFilteredVolunteers = (index) => {
    const currentSearch = selections[index].searchVal.toLowerCase();
    
    // Get all currently selected volunteer IDs except for this row
    const selectedIdsInOtherRows = selections
      .filter((_, idx) => idx !== index)
      .map(s => s.id)
      .filter(id => id !== '');

    return volunteers.filter(vol => {
      // Exclude already selected volunteers
      if (selectedIdsInOtherRows.includes(vol.id)) return false;
      
      // Filter by search match in name or ID
      return vol.name.toLowerCase().includes(currentSearch) || vol.id.includes(currentSearch);
    });
  };

  // Determine if the "Add More" button should be displayed
  // Show it if the last selection row is successfully filled
  const shouldShowAddMore = () => {
    if (selections.length === 0) return false;
    const lastRow = selections[selections.length - 1];
    return lastRow.id !== ''; // last row has a selected user ID
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
              <span className="profile-name">{user.name}</span>
              <span className="role-tag role-executive">Executive</span>
            </div>
          </div>

          <div className="navbar-right desktop-nav-menu">
            <button className="btn btn-secondary nav-action-btn" onClick={onNavigateToHome}>
              <ArrowLeft size={16} />
              Back to Home
            </button>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
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
              <span className="role-tag role-executive">Executive</span>
            </div>

            <button 
              className="btn btn-secondary mobile-menu-item" 
              onClick={() => { setMobileMenuOpen(false); onNavigateToHome(); }}
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>
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
            <h2>Add Volunteer Recognition</h2>
            <p>Log project milestones and award points to outstanding volunteers.</p>
          </div>
        </header>

        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Loading validation parameters...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        ) : (
          <div className="glass-card recognition-card animate-fade-in">
            {formSuccess && (
              <div className="alert alert-success animate-fade-in">
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="alert alert-danger animate-fade-in">
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="recognition-form">
              {/* Select Volunteers Section */}
              <div className="form-group">
                <label className="form-label font-semibold">Select Volunteers</label>
                <p className="form-helper-text">Select one or more volunteers to receive recognition points (1 point each).</p>
                
                <div className="selections-list">
                  {selections.map((selection, idx) => {
                    const filteredList = getFilteredVolunteers(idx);
                    
                    return (
                      <div key={idx} className="selection-row animate-fade-in">
                        <span className="row-number">#{idx + 1}</span>
                        
                        <div className="custom-dropdown-container">
                          {/* Search Input field acting as dropdown trigger */}
                          <div className="input-with-icon">
                            <Search size={16} className="input-icon" />
                            <input
                              type="text"
                              className="form-input text-input"
                              placeholder="Type name or student ID to search..."
                              value={selection.searchVal}
                              onChange={(e) => handleDropdownSearchChange(idx, e.target.value)}
                              onFocus={() => toggleDropdown(idx, true)}
                              onBlur={() => setTimeout(() => toggleDropdown(idx, false), 200)}
                              disabled={formSubmitLoading}
                              autoComplete="off"
                            />
                            {selection.id && (
                              <Check size={16} className="selection-checked-icon" />
                            )}
                          </div>

                          {/* Dropdown Options List */}
                          {selection.dropdownOpen && (
                            <div className="dropdown-options-list">
                              <div className="dropdown-search-header">
                                Volunteers matching "{selection.searchVal || 'All'}"
                              </div>
                              {filteredList.length === 0 ? (
                                <div className="dropdown-option no-results">
                                  No matching volunteers found
                                </div>
                              ) : (
                                filteredList.map(vol => (
                                  <button
                                    key={vol.id}
                                    type="button"
                                    className="dropdown-option"
                                    onClick={() => handleSelectVolunteer(idx, vol)}
                                  >
                                    <span className="vol-option-name">{vol.name}</span>
                                    <span className="vol-option-id">({vol.id})</span>
                                  </button>
                                ))
                              )}
                              
                              <button 
                                type="button" 
                                className="dropdown-close-btn" 
                                onClick={() => toggleDropdown(idx, false)}
                              >
                                Close Dropdown
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Remove Row Button */}
                        <button
                          type="button"
                          className="btn-remove-row"
                          onClick={() => handleRemoveRow(idx)}
                          title="Remove this volunteer row"
                          disabled={formSubmitLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add More Button (appears once previous row has a selection) */}
                {shouldShowAddMore() && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-add-more animate-fade-in"
                    onClick={handleAddMoreRow}
                    disabled={formSubmitLoading}
                  >
                    <Plus size={16} />
                    Add More
                  </button>
                )}
              </div>

              {/* Work Description Field */}
              <div className="form-group">
                <label className="form-label" htmlFor="workDesc">Work Description <span className="text-red">*</span></label>
                <textarea
                  id="workDesc"
                  className="form-input form-textarea"
                  rows={4}
                  placeholder="Describe the contribution, event, or task these volunteers successfully completed..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  disabled={formSubmitLoading}
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-submit-recognition" 
                  disabled={formSubmitLoading}
                >
                  <Award size={18} />
                  {formSubmitLoading ? 'Submitting Recognition...' : 'Confirm & Award Points'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <style>{`
        .page-header {
          max-width: 720px;
          margin: 0 auto 1.5rem auto;
          width: 100%;
        }

        .recognition-card {
          max-width: 720px;
          margin: 0 auto 3rem;
          padding: 2.5rem;
        }

        .recognition-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-helper-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          margin-top: -0.25rem;
        }

        .selections-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .selection-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: relative;
        }

        .row-number {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--primary);
          min-width: 24px;
        }

        .custom-dropdown-container {
          position: relative;
          flex: 1;
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

        .selection-checked-icon {
          position: absolute;
          right: 1rem;
          color: var(--success);
        }

        .text-input {
          padding-left: 2.75rem !important;
          padding-right: 2.75rem !important;
        }

        /* Dropdown options styles */
        .dropdown-options-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          margin-top: 0.25rem;
          max-height: 240px;
          overflow-y: auto;
          z-index: 10;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }

        .dropdown-search-header {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
          background: rgba(0, 0, 0, 0.1);
        }

        .dropdown-option {
          display: flex;
          width: 100%;
          padding: 0.7rem 1rem;
          background: transparent;
          border: none;
          text-align: left;
          color: var(--text-primary);
          cursor: pointer;
          font-size: 0.95rem;
          transition: background var(--transition-fast);
          gap: 0.5rem;
          align-items: center;
        }

        .dropdown-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .vol-option-name {
          font-weight: 600;
        }

        .vol-option-id {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .no-results {
          color: var(--text-muted);
          font-style: italic;
          padding: 1rem;
          cursor: default;
        }

        .dropdown-close-btn {
          width: 100%;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: none;
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          text-align: center;
          font-weight: 600;
        }

        .dropdown-close-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.04);
        }

        .btn-remove-row {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-remove-row:hover:not(:disabled) {
          background: var(--danger);
          color: white;
        }

        .btn-remove-row:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-add-more {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .text-red {
          color: var(--danger);
        }

        .form-actions {
          margin-top: 1.5rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
        }

        .btn-submit-recognition {
          width: 100%;
        }

        @media (max-width: 480px) {
          .recognition-card {
            padding: 1.75rem 1.25rem;
          }
          
          .selection-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
            width: 100%;
          }

          .selection-row:not(:last-child) {
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1.25rem;
          }

          .custom-dropdown-container {
            width: 100%;
          }

          .row-number {
            display: none;
          }

          .btn-remove-row {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }
          
          .btn-remove-row::after {
            content: 'Remove Row';
            font-size: 0.85rem;
            font-weight: 600;
          }
        }
      `}</style>
    </div>
  );
}
