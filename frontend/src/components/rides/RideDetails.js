import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import socket from '../../services/socket';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import confetti from 'canvas-confetti';
import {
  Car,
  Phone,
  Star,
  CheckCircle2,
  KeyRound,
  Play,
  Check,
  X,
  Receipt,
  FileText
} from 'lucide-react';

const RideDetails = () => {
  const { user, isDriver } = useAuth();
  const { id } = useParams();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Rating Modal state
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Cancellation Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');

  // Map & Simulation Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const simIntervalRef = useRef(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchRide = async () => {
    try {
      const res = await api.get(`/rides/${id}`);
      setRide(res.data);
      if (res.data.rating?.score) {
        setRatingSubmitted(true);
      }
    } catch (err) {
      console.error('Fetch ride error:', err);
      showToastMsg('Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRide();

      // Join socket room for this ride
      socket.emit('join_ride', id);

      // Listen for status changes
      socket.on(`ride_status_updated_${id}`, (updatedRide) => {
        setRide(updatedRide);
        if (updatedRide.status === 'completed') {
          confetti({ particleCount: 80, spread: 60 });
        }
      });

      // Listen for driver location updates
      socket.on(`driver_location_${id}`, ({ coordinates }) => {
        if (driverMarkerRef.current && coordinates) {
          driverMarkerRef.current.setLatLng([coordinates[1], coordinates[0]]);
        }
      });

      return () => {
        socket.emit('leave_ride', id);
        socket.off(`ride_status_updated_${id}`);
        socket.off(`driver_location_${id}`);
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!ride || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const pickupCoord = [ride.pickup.coordinates[1], ride.pickup.coordinates[0]];
      const dropoffCoord = [ride.dropoff.coordinates[1], ride.dropoff.coordinates[0]];

      const map = L.map(mapContainerRef.current).setView(pickupCoord, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Custom Pin Icons
      const pickupIcon = L.divIcon({
        className: 'custom-map-pin pickup-pin',
        html: `<div class="pin-badge pin-green"><span>A</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const dropoffIcon = L.divIcon({
        className: 'custom-map-pin dropoff-pin',
        html: `<div class="pin-badge pin-red"><span>B</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const carIcon = L.divIcon({
        className: 'custom-map-pin car-pin',
        html: `<div class="car-badge-icon">🚖</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      // Add Markers
      L.marker(pickupCoord, { icon: pickupIcon }).addTo(map).bindPopup('<b>Pickup</b>: ' + ride.pickup.address);
      L.marker(dropoffCoord, { icon: dropoffIcon }).addTo(map).bindPopup('<b>Destination</b>: ' + ride.dropoff.address);

      // Add Driver Marker
      const initialDriverLoc = ride.driverLocation?.coordinates?.length === 2
        ? [ride.driverLocation.coordinates[1], ride.driverLocation.coordinates[0]]
        : [pickupCoord[0] - 0.005, pickupCoord[1] - 0.005];

      driverMarkerRef.current = L.marker(initialDriverLoc, { icon: carIcon })
        .addTo(map)
        .bindPopup('<b>Driver Vehicle</b>');

      // Polyline Route
      L.polyline([pickupCoord, dropoffCoord], {
        color: '#2563eb',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8
      }).addTo(map);

      // Fit bounds
      const bounds = L.latLngBounds([pickupCoord, dropoffCoord]);
      map.fitBounds(bounds, { padding: [60, 60] });

      mapInstanceRef.current = map;
    }
  }, [ride]);

  // Status Handlers
  const handleStatusUpdate = async (newStatus, extraBody = {}) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/rides/${id}`, { status: newStatus, ...extraBody });
      setRide(res.data);
      showToastMsg(`Ride updated to ${newStatus.toUpperCase()}`);
      if (newStatus === 'completed') {
        confetti({ particleCount: 100, spread: 70 });
      }
    } catch (err) {
      console.error(err);
      showToastMsg(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
      setShowCancelModal(false);
    }
  };

  // OTP Verification Handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput.trim()) {
      setOtpError('Please enter the 4-digit code');
      return;
    }

    setActionLoading(true);
    setOtpError('');
    try {
      const res = await api.post(`/rides/${id}/verify-otp`, { otp: otpInput });
      setRide(res.data.ride);
      showToastMsg('OTP Verified! Ride is now in progress.');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Incorrect OTP code. Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Rate Ride Handler
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/rides/${id}/rate`, {
        score: ratingScore,
        comment: ratingComment
      });
      setRatingSubmitted(true);
      showToastMsg('Thank you for rating your driver!');
      confetti({ particleCount: 50 });
      fetchRide();
    } catch (err) {
      showToastMsg('Failed to submit rating: ' + (err.response?.data?.message || 'Error'));
    }
  };

  // Live Driver Simulation Tool
  const toggleSimulation = () => {
    if (isSimulating) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setIsSimulating(false);
    } else {
      if (!ride) return;
      setIsSimulating(true);

      const pLat = ride.pickup.coordinates[1];
      const pLng = ride.pickup.coordinates[0];
      const dLat = ride.dropoff.coordinates[1];
      const dLng = ride.dropoff.coordinates[0];

      let step = 0;
      const totalSteps = 20;

      simIntervalRef.current = setInterval(() => {
        step++;
        const progress = step / totalSteps;
        const currentLat = pLat + (dLat - pLat) * progress;
        const currentLng = pLng + (dLng - pLng) * progress;

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([currentLat, currentLng]);
        }

        // Send location to server
        api.post(`/rides/${id}/location`, {
          coordinates: [currentLng, currentLat]
        }).catch(() => {});

        if (step >= totalSteps) {
          clearInterval(simIntervalRef.current);
          setIsSimulating(false);
        }
      }, 1200);
    }
  };

  if (loading) return <div className="loading-state">Loading trip details & map...</div>;
  if (!ride) return <div className="loading-state">Ride not found or was removed.</div>;

  const isRider = ride.user && (ride.user._id === user?._id || ride.user === user?._id);
  const isAssignedDriver = ride.driver && (ride.driver._id === user?._id || ride.driver === user?._id);

  return (
    <div className="ride-details-page">
      {/* Toast Alert */}
      {toast && <div className="toast-notification">{toast}</div>}

      <div className="ride-layout-grid">
        {/* Left Side: Live Map & Visualizer */}
        <div className="ride-map-panel">
          <div ref={mapContainerRef} className="ride-leaflet-map" />

          {/* Stepper Status Bar */}
          <div className="ride-status-stepper">
            <div className={`step-item ${['requested', 'accepted', 'in_progress', 'completed'].includes(ride.status) ? 'active' : ''}`}>
              <div className="step-circle">1</div>
              <span>Requested</span>
            </div>
            <div className={`step-line ${['accepted', 'in_progress', 'completed'].includes(ride.status) ? 'active-line' : ''}`}></div>
            <div className={`step-item ${['accepted', 'in_progress', 'completed'].includes(ride.status) ? 'active' : ''}`}>
              <div className="step-circle">2</div>
              <span>Driver Assigned</span>
            </div>
            <div className={`step-line ${['in_progress', 'completed'].includes(ride.status) ? 'active-line' : ''}`}></div>
            <div className={`step-item ${['in_progress', 'completed'].includes(ride.status) ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <span>In Transit</span>
            </div>
            <div className={`step-line ${ride.status === 'completed' ? 'active-line' : ''}`}></div>
            <div className={`step-item ${ride.status === 'completed' ? 'active' : ''}`}>
              <div className="step-circle">4</div>
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Right Side: Trip Details, OTP, Action Controls */}
        <div className="ride-info-panel">
          {/* Header Card */}
          <div className="trip-status-header">
            <div>
              <span className="trip-id-tag">TRIP #{ride._id.substring(ride._id.length - 6).toUpperCase()}</span>
              <h2 className="trip-status-title">
                {ride.status === 'requested' && 'Searching for Captain...'}
                {ride.status === 'accepted' && 'Captain is on the way!'}
                {ride.status === 'in_progress' && 'Trip is in Progress 🚖'}
                {ride.status === 'completed' && 'Trip Completed Successfully! 🎉'}
                {ride.status === 'cancelled' && 'Trip Cancelled'}
              </h2>
            </div>
            <div className="fare-badge-large">
              <span className="fare-curr">$</span>
              <span className="fare-num">{ride.fare?.toFixed(2)}</span>
            </div>
          </div>

          {/* 4-Digit Security OTP Card */}
          {ride.status === 'requested' || ride.status === 'accepted' ? (
            <div className="otp-security-card">
              <div className="otp-icon-wrap">
                <KeyRound size={22} />
              </div>
              <div className="otp-content">
                <span className="otp-label">
                  {isDriver ? 'Passenger Start OTP Code' : 'Your 4-Digit Ride PIN'}
                </span>
                <div className="otp-pin-display">{ride.otpCode || '4829'}</div>
                <p className="otp-hint">
                  {isDriver
                    ? 'Ask passenger for this code before starting ride.'
                    : 'Share this PIN with your captain when you board.'}
                </p>
              </div>
            </div>
          ) : null}

          {/* Route Addresses */}
          <div className="trip-route-card">
            <div className="route-stop">
              <div className="dot green"></div>
              <div className="stop-text">
                <span className="stop-label">Pickup Location</span>
                <strong>{ride.pickup?.address || 'Pickup Coordinates'}</strong>
              </div>
            </div>
            <div className="route-line-vertical"></div>
            <div className="route-stop">
              <div className="dot red"></div>
              <div className="stop-text">
                <span className="stop-label">Dropoff Destination</span>
                <strong>{ride.dropoff?.address || 'Dropoff Coordinates'}</strong>
              </div>
            </div>
          </div>

          {/* Trip Metrics */}
          <div className="trip-metrics-grid">
            <div className="metric-box">
              <span className="m-label">Distance</span>
              <strong>{ride.distance} km</strong>
            </div>
            <div className="metric-box">
              <span className="m-label">Est. Time</span>
              <strong>~{ride.estimatedDuration} mins</strong>
            </div>
            <div className="metric-box">
              <span className="m-label">Vehicle</span>
              <strong className="text-brand">{ride.vehicleType?.toUpperCase()}</strong>
            </div>
            <div className="metric-box">
              <span className="m-label">Payment</span>
              <strong>{ride.paymentMethod?.toUpperCase()}</strong>
            </div>
          </div>

          {/* Driver or Rider Contact Card */}
          <div className="profile-contact-card">
            {isDriver ? (
              <div className="contact-info-row">
                <div className="contact-avatar">
                  {ride.user?.name ? ride.user.name.charAt(0).toUpperCase() : 'R'}
                </div>
                <div className="contact-meta">
                  <h4>{ride.user?.name || 'Passenger'}</h4>
                  <span>Passenger • {ride.user?.phone || 'No phone'}</span>
                </div>
                <div className="contact-actions">
                  <a href={`tel:${ride.user?.phone}`} className="btn-icon-circle" title="Call Passenger">
                    <Phone size={18} />
                  </a>
                </div>
              </div>
            ) : ride.driver ? (
              <div className="contact-info-row">
                <div className="contact-avatar">
                  {ride.driver?.name ? ride.driver.name.charAt(0).toUpperCase() : 'D'}
                </div>
                <div className="contact-meta">
                  <div className="driver-name-row">
                    <h4>{ride.driver?.name}</h4>
                    <span className="rating-tag">⭐ {ride.driver?.driverRating?.toFixed(1) || '4.9'}</span>
                  </div>
                  <span>
                    {ride.driver?.vehicleModel || 'Sedan'} • <strong>{ride.driver?.vehicleNumber || 'CAB-001'}</strong>
                  </span>
                </div>
                <div className="contact-actions">
                  <a href={`tel:${ride.driver?.phone}`} className="btn-icon-circle" title="Call Driver">
                    <Phone size={18} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="looking-driver-box">
                <div className="radar-spinner"></div>
                <div>
                  <strong>Broadcasting request to nearby drivers...</strong>
                  <p>A captain will accept your ride shortly.</p>
                </div>
              </div>
            )}
          </div>

          {/* Driver OTP Verification Form */}
          {isDriver && isAssignedDriver && ride.status === 'accepted' && (
            <div className="driver-verify-otp-box">
              <h4>Verify Passenger OTP to Start Ride</h4>
              {otpError && <div className="alert-box error-alert mini">{otpError}</div>}
              <form onSubmit={handleVerifyOtp} className="otp-form-row">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Enter 4-digit PIN"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="otp-input-field"
                  required
                />
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  <Check size={16} /> Verify & Start
                </button>
              </form>
            </div>
          )}

          {/* Action Control Buttons */}
          <div className="trip-actions-row">
            {/* Driver accepts open ride */}
            {isDriver && ride.status === 'requested' && (
              <button
                className="btn-primary w-full"
                onClick={() => handleStatusUpdate('accepted')}
                disabled={actionLoading}
              >
                <Check size={18} /> Accept This Ride Request
              </button>
            )}

            {/* In-progress actions */}
            {ride.status === 'in_progress' && (
              <button
                className="btn-success w-full"
                onClick={() => handleStatusUpdate('completed')}
                disabled={actionLoading}
              >
                <CheckCircle2 size={18} /> Complete Ride & Finish
              </button>
            )}

            {/* Cancel ride button */}
            {['requested', 'accepted'].includes(ride.status) && (
              <button
                className="btn-danger-outline"
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
              >
                <X size={16} /> Cancel Ride
              </button>
            )}

            {/* Simulation toggle button */}
            {['accepted', 'in_progress'].includes(ride.status) && (
              <button
                type="button"
                className={`btn-sim ${isSimulating ? 'active' : ''}`}
                onClick={toggleSimulation}
                title="Simulate live GPS car movement along route"
              >
                <Play size={14} /> {isSimulating ? 'Pause GPS Simulation' : 'Simulate GPS Movement'}
              </button>
            )}

            {/* Completed trip: View Receipt button */}
            {ride.status === 'completed' && (
              <button className="btn-secondary w-full" onClick={() => setShowReceipt(true)}>
                <Receipt size={18} /> View Official Trip Receipt
              </button>
            )}
          </div>

          {/* Rating Section for Rider */}
          {ride.status === 'completed' && isRider && !ratingSubmitted && (
            <div className="rider-rating-card">
              <h4>Rate your Driver & Trip</h4>
              <form onSubmit={handleSubmitRating}>
                <div className="stars-selector">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="star-btn"
                      onClick={() => setRatingScore(star)}
                    >
                      <Star
                        size={26}
                        fill={star <= ratingScore ? '#f59e0b' : 'none'}
                        color="#f59e0b"
                      />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Leave a quick review (optional)"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="rating-comment-input"
                />
                <button type="submit" className="btn-primary w-full mt-2">
                  Submit Feedback
                </button>
              </form>
            </div>
          )}

          {/* Already rated tag */}
          {ride.status === 'completed' && ratingSubmitted && (
            <div className="rated-confirmation-box">
              <CheckCircle2 size={18} className="text-success" />
              <span>You rated this trip {ride.rating?.score || ratingScore} / 5 stars</span>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="modal-backdrop" onClick={() => setShowCancelModal(false)}>
          <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Ride Request</h3>
            <p>Please select a reason for cancellation:</p>
            <div className="cancel-options">
              {['Change of plans', 'Driver is taking too long', 'Wrong pickup location', 'Other'].map((opt) => (
                <label key={opt} className="cancel-radio-label">
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={opt}
                    checked={cancelReason === opt}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <div className="modal-btn-row">
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                Keep Ride
              </button>
              <button
                className="btn-danger"
                onClick={() => handleStatusUpdate('cancelled', { cancellationReason: cancelReason })}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="modal-backdrop" onClick={() => setShowReceipt(false)}>
          <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-header">
              <div className="receipt-brand">
                <Car size={24} className="text-brand" />
                <h3>Trip Receipt</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setShowReceipt(false)}>
                ✕
              </button>
            </div>

            <div className="receipt-body">
              <div className="receipt-meta-grid">
                <div>
                  <span className="r-label">Trip ID</span>
                  <strong>#{ride._id.substring(ride._id.length - 8).toUpperCase()}</strong>
                </div>
                <div>
                  <span className="r-label">Date & Time</span>
                  <strong>{new Date(ride.createdAt).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="r-label">Vehicle Tier</span>
                  <strong>{ride.vehicleType?.toUpperCase()}</strong>
                </div>
                <div>
                  <span className="r-label">Payment</span>
                  <strong className="text-success">PAID ({ride.paymentMethod?.toUpperCase()})</strong>
                </div>
              </div>

              <div className="receipt-route-box">
                <div>
                  <span className="r-label">Pickup</span>
                  <p>{ride.pickup?.address}</p>
                </div>
                <div className="mt-2">
                  <span className="r-label">Destination</span>
                  <p>{ride.dropoff?.address}</p>
                </div>
              </div>

              <div className="receipt-fare-table">
                <div className="r-fare-row">
                  <span>Base Fare</span>
                  <span>$3.50</span>
                </div>
                <div className="r-fare-row">
                  <span>Distance ({ride.distance} km)</span>
                  <span>${(ride.fare - 3.50).toFixed(2)}</span>
                </div>
                <div className="r-fare-row total-fare">
                  <strong>Total Paid</strong>
                  <strong>${ride.fare?.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="receipt-footer">
              <button className="btn-secondary" onClick={() => window.print()}>
                <FileText size={16} /> Print / Save
              </button>
              <button className="btn-primary" onClick={() => setShowReceipt(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideDetails;
