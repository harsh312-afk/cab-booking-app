import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Car,
  MapPin,
  ShieldCheck,
  Zap,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Navigation,
  Compass,
  ArrowRight
} from 'lucide-react';

const Home = () => {
  const { user, isDriver } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeRide, setActiveRide] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsRes = await api.get('/auth/stats');
      setStats(statsRes.data);

      // Fetch active rides
      const ridesRes = await api.get('/rides?status=active');
      if (ridesRes.data && ridesRes.data.length > 0) {
        setActiveRide(ridesRes.data[0]);
      } else {
        setActiveRide(null);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  };

  // Logged-in Driver Dashboard
  if (user && isDriver) {
    return (
      <div className="dashboard-container">
        {/* Welcome Header */}
        <div className="dashboard-hero driver-hero">
          <div className="hero-content">
            <span className="badge-pill driver-badge">Driver Partner Portal</span>
            <h1>Welcome back, Captain {user.name}! 🚖</h1>
            <p>
              Status:{' '}
              <strong className={user.isAvailable ? 'text-success' : 'text-muted'}>
                {user.isAvailable ? '🟢 Online & Ready for Requests' : '⚪ Offline'}
              </strong>
              {' • '}
              Vehicle: <strong>{user.vehicleModel || 'Standard Comfort'}</strong> ({user.vehicleNumber || 'CAB-101'})
            </p>
          </div>
          <div className="hero-actions">
            <Link to="/available-rides" className="btn-primary glow-btn">
              <Navigation size={18} /> View Available Requests
            </Link>
          </div>
        </div>

        {/* Active Ride Banner if exists */}
        {activeRide && (
          <div className="active-ride-alert">
            <div className="alert-pulse"></div>
            <div className="active-ride-info">
              <div className="active-title">
                <strong>Active Trip in Progress ({activeRide.status.toUpperCase()})</strong>
              </div>
              <p>
                Rider: {activeRide.user?.name} • Pickup: {activeRide.pickup?.address} ➔ Dropoff: {activeRide.dropoff?.address}
              </p>
            </div>
            <button
              className="btn-accent"
              onClick={() => navigate(`/rides/${activeRide._id}`)}
            >
              Resume Ride Live Tracker <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap emerald">
              <TrendingUp size={24} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Total Earnings</span>
              <h3 className="stat-val">${stats?.totalAmount || 0}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap blue">
              <Navigation size={24} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Completed Trips</span>
              <h3 className="stat-val">{stats?.completedRides || 0}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap amber">
              <Award size={24} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Driver Rating</span>
              <h3 className="stat-val">⭐ {user?.driverRating?.toFixed(1) || '4.9'}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap violet">
              <Clock size={24} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Active / Pending</span>
              <h3 className="stat-val">{stats?.activeRides || 0}</h3>
            </div>
          </div>
        </div>

        {/* Driver Quick Navigation Cards */}
        <div className="quick-cards-grid">
          <div className="action-card" onClick={() => navigate('/available-rides')}>
            <div className="action-card-icon bg-blue">
              <MapPin size={28} />
            </div>
            <h3>Available Ride Requests</h3>
            <p>Browse open passenger requests nearby and accept rides with one click.</p>
            <span className="card-link">Explore Requests <ChevronRight size={16} /></span>
          </div>

          <div className="action-card" onClick={() => navigate('/my-rides')}>
            <div className="action-card-icon bg-emerald">
              <Car size={28} />
            </div>
            <h3>Trip History & Receipts</h3>
            <p>Review all completed rides, trip distances, fares, and passenger reviews.</p>
            <span className="card-link">View Trips <ChevronRight size={16} /></span>
          </div>

          <div className="action-card" onClick={() => navigate('/profile')}>
            <div className="action-card-icon bg-violet">
              <ShieldCheck size={28} />
            </div>
            <h3>Vehicle & Profile Settings</h3>
            <p>Manage your vehicle model, registration number, category, and account security.</p>
            <span className="card-link">Manage Profile <ChevronRight size={16} /></span>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in Passenger / Rider Dashboard
  if (user) {
    return (
      <div className="dashboard-container">
        {/* Rider Hero */}
        <div className="dashboard-hero rider-hero">
          <div className="hero-content">
            <span className="badge-pill rider-badge">Passenger Dashboard</span>
            <h1>Where would you like to go, {user.name}? 🗺️</h1>
            <p>Book premium, safe, and lightning-fast rides in seconds with live GPS tracking.</p>
          </div>
          <div className="hero-actions">
            <Link to="/book-ride" className="btn-primary glow-btn">
              <Car size={18} /> Book a Ride Now
            </Link>
          </div>
        </div>

        {/* Active Ride Banner */}
        {activeRide && (
          <div className="active-ride-alert">
            <div className="alert-pulse"></div>
            <div className="active-ride-info">
              <div className="active-title">
                <strong>Current Ride Status: {activeRide.status.toUpperCase()}</strong>
              </div>
              <p>
                From {activeRide.pickup?.address} ➔ {activeRide.dropoff?.address} • Fare: ${activeRide.fare}
              </p>
            </div>
            <button
              className="btn-accent"
              onClick={() => navigate(`/rides/${activeRide._id}`)}
            >
              Track Driver Live <Navigation size={16} />
            </button>
          </div>
        )}

        {/* Rider Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap blue">
              <Car size={24} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Total Rides Taken</span>
              <h3 className="stat-val">{stats?.totalRides || 0}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap emerald">
              <CreditCard size={24} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Total Spent</span>
              <h3 className="stat-val">${stats?.totalAmount || 0}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap violet">
              <Clock size={24} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Completed Trips</span>
              <h3 className="stat-val">{stats?.completedRides || 0}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap amber">
              <ShieldCheck size={24} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Safety Status</span>
              <h3 className="stat-val">100% Verified</h3>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-cards-grid">
          <div className="action-card primary-card" onClick={() => navigate('/book-ride')}>
            <div className="action-card-icon bg-brand">
              <Compass size={28} />
            </div>
            <h3>Instant Ride Booking</h3>
            <p>Select pickup & destination with visual map markers and vehicle tier picker.</p>
            <span className="card-link">Book Ride <ArrowRight size={16} /></span>
          </div>

          <div className="action-card" onClick={() => navigate('/my-rides')}>
            <div className="action-card-icon bg-emerald">
              <Clock size={28} />
            </div>
            <h3>Ride History & Invoices</h3>
            <p>View your past bookings, driver ratings, and downloadable digital receipts.</p>
            <span className="card-link">View History <ChevronRight size={16} /></span>
          </div>

          <div className="action-card" onClick={() => navigate('/profile')}>
            <div className="action-card-icon bg-violet">
              <ShieldCheck size={28} />
            </div>
            <h3>Account & Preferences</h3>
            <p>Update your contact info, saved addresses, and security credentials.</p>
            <span className="card-link">Edit Profile <ChevronRight size={16} /></span>
          </div>
        </div>
      </div>
    );
  }

  // Public Landing Page (Guest)
  return (
    <div className="landing-page-container">
      {/* Hero Section */}
      <section className="hero-landing">
        <div className="hero-landing-content">
          <span className="hero-badge">⚡ Modern Urban Mobility</span>
          <h1 className="hero-headline">
            Fast, Reliable & <span className="gradient-text">Real-Time</span> Cab Booking
          </h1>
          <p className="hero-subtext">
            Experience next-generation transportation with interactive maps, live driver tracking,
            transparent upfront fares, and verified professional captains.
          </p>
          <div className="hero-btn-group">
            <Link to="/register" className="btn-primary glow-btn large">
              Book a Ride Now <ArrowRight size={18} />
            </Link>
            <Link to="/register?role=driver" className="btn-secondary large">
              Drive with Us & Earn
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose CabPulse?</h2>
          <p>Engineered for speed, safety, and seamless urban transit.</p>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon bg-blue">
              <Zap size={26} />
            </div>
            <h3>Live GPS Tracking</h3>
            <p>Watch your driver navigate in real-time on our interactive Leaflet maps with dynamic ETA.</p>
          </div>

          <div className="feature-box">
            <div className="feature-icon bg-emerald">
              <CreditCard size={26} />
            </div>
            <h3>Transparent Upfront Fares</h3>
            <p>No hidden surges or surprise charges. Precise distance-based calculations upfront.</p>
          </div>

          <div className="feature-box">
            <div className="feature-icon bg-amber">
              <ShieldCheck size={26} />
            </div>
            <h3>4-Digit Safety OTP</h3>
            <p>Every trip is secured with a one-time start verification code to ensure rider safety.</p>
          </div>

          <div className="feature-box">
            <div className="feature-icon bg-violet">
              <Car size={26} />
            </div>
            <h3>Multiple Vehicle Tiers</h3>
            <p>Choose from Auto, Economy Mini, Comfort Sedan, SUV XL, and Premium Luxury rides.</p>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>Ready to hit the road?</h2>
          <p>Create your account in under 30 seconds and take your first ride.</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-primary">
              Create Free Account
            </Link>
            <Link to="/login" className="btn-outline">
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
