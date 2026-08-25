import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">CabBooking</Link>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/">Home</Link>
            {user.role === 'driver' && (
              <>
                <Link to="/available-rides">Available Rides</Link>
                <Link to="/my-rides">My Rides</Link>
              </>
            )}
            {user.role === 'user' && (
              <>
                <Link to="/book-ride">Book a Ride</Link>
                <Link to="/my-rides">My Rides</Link>
              </>
            )}
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;