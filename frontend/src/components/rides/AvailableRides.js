import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import socket from '../../services/socket';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  Clock,
  Phone,
  Car,
  AlertCircle,
  RefreshCw,
  Power,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const AvailableRides = () => {
  const { user, toggleDriverAvailability } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [newAlert, setNewAlert] = useState(false);
  const navigate = useNavigate();

  const fetchAvailableRides = async () => {
    try {
      setError('');
      const res = await api.get('/rides/available');
      setRides(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load available rides. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'driver') {
      fetchAvailableRides();

      socket.on('new_ride_alert', (newRide) => {
        setRides((prev) => {
          if (prev.find((r) => r._id === newRide._id)) return prev;
          return [newRide, ...prev];
        });
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 5000);
      });

      socket.on('ride_updated', (updatedRide) => {
        if (updatedRide.status !== 'requested') {
          setRides((prev) => prev.filter((r) => r._id !== updatedRide._id));
        }
      });

      return () => {
        socket.off('new_ride_alert');
        socket.off('ride_updated');
      };
    }
  }, [user]);

  const handleAcceptRide = async (rideId) => {
    setAcceptingId(rideId);
    try {
      await api.patch(`/rides/${rideId}`, { status: 'accepted' });
      navigate(`/rides/${rideId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept ride. It may have been taken.');
      setAcceptingId(null);
      fetchAvailableRides();
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="spin-icon" size={32} />
        <p>Scanning for nearby ride requests...</p>
      </div>
    );
  }

  return (
    <div className="available-rides-page">
      <div className="available-header">
        <div>
          <h2>Available Ride Requests</h2>
          <p>Real-time incoming passenger requests waiting for driver pickup</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchAvailableRides} title="Refresh requests">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {!user?.isAvailable && (
        <div className="offline-notice-banner">
          <div className="notice-content">
            <Power size={20} />
            <span>You are currently <strong>Offline</strong>. Turn on your status to accept incoming rides and receive live alerts.</span>
          </div>
          <button className="btn-go-online" onClick={() => toggleDriverAvailability(true)}>
            Go Online Now
          </button>
        </div>
      )}

      {newAlert && (
        <div className="new-alert-toast">
          <Sparkles size={18} />
          <span>New ride request just posted nearby!</span>
        </div>
      )}

      {error && (
        <div className="alert-box error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {rides.length === 0 ? (
        <div className="empty-requests-box">
          <div className="empty-icon-wrap">
            <Car size={48} />
          </div>
          <h3>No Open Ride Requests Right Now</h3>
          <p>All active rides have been accepted. Stay online and new requests will appear here automatically.</p>
        </div>
      ) : (
        <div className="rides-card-grid">
          {rides.map((ride) => (
            <div key={ride._id} className="driver-ride-card">
              <div className="card-top-row">
                <div className="rider-avatar-group">
                  <div className="avatar-letter">
                    {ride.user?.name ? ride.user.name.charAt(0).toUpperCase() : 'R'}
                  </div>
                  <div>
                    <h4 className="rider-name">{ride.user?.name || 'Passenger'}</h4>
                    <span className="rider-phone">
                      <Phone size={12} /> {ride.user?.phone || 'Hidden until accepted'}
                    </span>
                  </div>
                </div>
                <div className="fare-badge">
                  <span className="fare-amount">${ride.fare?.toFixed(2)}</span>
                  <span className="fare-type">{ride.paymentMethod?.toUpperCase()}</span>
                </div>
              </div>

              <div className="ride-route-timeline">
                <div className="route-stop">
                  <div className="dot green"></div>
                  <div className="stop-text">
                    <span className="stop-label">Pickup Point</span>
                    <strong className="stop-addr">{ride.pickup?.address || 'Pickup Coordinates'}</strong>
                  </div>
                </div>
                <div className="route-line-vertical"></div>
                <div className="route-stop">
                  <div className="dot red"></div>
                  <div className="stop-text">
                    <span className="stop-label">Dropoff Destination</span>
                    <strong className="stop-addr">{ride.dropoff?.address || 'Dropoff Coordinates'}</strong>
                  </div>
                </div>
              </div>

              <div className="ride-meta-footer">
                <div className="meta-item">
                  <Navigation size={14} />
                  <span>{ride.distance} km</span>
                </div>
                <div className="meta-item">
                  <Clock size={14} />
                  <span>~{ride.estimatedDuration || 15} mins</span>
                </div>
                <div className="meta-item">
                  <Car size={14} />
                  <span className="tier-tag">{ride.vehicleType || 'comfort'}</span>
                </div>
              </div>

              <div className="card-btn-row">
                <button
                  className="btn-accept-ride"
                  onClick={() => handleAcceptRide(ride._id)}
                  disabled={acceptingId === ride._id}
                >
                  {acceptingId === ride._id ? (
                    'Accepting...'
                  ) : (
                    <>
                      <span>Accept Ride & Start Navigation</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableRides;
