import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Car, MapPin, List, User, LogOut, Power, Menu, X, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isDriver, toggleDriverAvailability } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleStatusToggle = async () => {
    if (!isDriver) return;
    setTogglingStatus(true);
    await toggleDriverAvailability(!user?.isAvailable);
    setTogglingStatus(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-icon-wrapper">
            <Car className="brand-icon" size={24} />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">CabPulse</span>
            <span className="brand-tag">Realtime Rides</span>
          </div>
        </Link>

        <button
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`navbar-nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          {user ? (
            <>
              <div className="nav-links-group">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Sparkles size={16} /> Home
                </NavLink>

                {isDriver ? (
                  <>
                    <NavLink
                      to="/available-rides"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MapPin size={16} />
                      <span>Available Rides</span>
                      <span className="pulse-dot"></span>
                    </NavLink>

                    <NavLink
                      to="/my-rides"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <List size={16} /> Trips History
                    </NavLink>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/book-ride"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Car size={16} /> Book Ride
                    </NavLink>

                    <NavLink
                      to="/my-rides"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <List size={16} /> My Rides
                    </NavLink>
                  </>
                )}

                <NavLink
                  to="/profile"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={16} /> Profile
                </NavLink>
              </div>

              <div className="nav-user-actions">
                {isDriver && (
                  <button
                    className={`driver-status-badge ${user?.isAvailable ? 'online' : 'offline'}`}
                    onClick={handleStatusToggle}
                    disabled={togglingStatus}
                    title="Click to toggle availability"
                  >
                    <Power size={14} />
                    <span>{user?.isAvailable ? 'Online' : 'Offline'}</span>
                  </button>
                )}

                <div className="user-profile-badge">
                  <div className="user-avatar-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-meta-sm">
                    <span className="user-name-text">{user?.name}</span>
                    <span className={`role-pill ${user?.role}`}>
                      {user?.role === 'driver' ? 'Driver' : 'Rider'}
                    </span>
                  </div>
                </div>

                <button className="btn-logout" onClick={handleLogout} title="Log out">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth-buttons">
              <Link
                to="/login"
                className="nav-link-btn ghost"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="nav-link-btn primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
