import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    // User is logged in - show personalized home
    return (
      <div className="home-container">
        <h1>Welcome back, {user.name}! 👋</h1>
        <p>{user.role === 'user' ? 'Ready to book a ride?' : 'Ready to accept ride requests?'}</p>
        <div className="home-buttons">
          {user.role === 'user' && (
            <Link to="/book-ride" className="btn">
              Book a Ride
            </Link>
          )}
          {user.role === 'driver' && (
            <>
              <Link to="/available-rides" className="btn">
                Available Rides
              </Link>
              <Link to="/my-rides" className="btn">
                My Rides
              </Link>
            </>
          )}
          <Link to="/profile" className="btn secondary">
            Profile
          </Link>
        </div>
      </div>
    );
  }

  // User is not logged in - show generic welcome
  return (
    <div className="home-container">
      <h1>Welcome to CabBooking</h1>
      <p>Book rides, become a driver, and enjoy seamless transportation.</p>
      <div className="home-buttons">
        <Link to="/login" className="btn">
          Login
        </Link>
        <Link to="/register" className="btn">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Home;
