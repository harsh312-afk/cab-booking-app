import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Search,
  AlertCircle,
  Receipt,
  Star,
  ArrowRight,
  ChevronRight,
  FileText
} from 'lucide-react';

const MyRides = () => {
  const { user, isDriver } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const navigate = useNavigate();

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/rides');
      setRides(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load trips history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRides();
    }
  }, [user]);

  const filteredRides = rides.filter((ride) => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'active'
        ? ['requested', 'accepted', 'in_progress'].includes(ride.status)
        : ride.status === activeTab;

    const matchesSearch =
      searchQuery.trim() === '' ||
      ride.pickup?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.dropoff?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.driver?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'requested':
        return <span className="status-badge badge-amber">⏳ Looking for Driver</span>;
      case 'accepted':
        return <span className="status-badge badge-blue">🚘 Driver Assigned</span>;
      case 'in_progress':
        return <span className="status-badge badge-purple">⚡ In Transit</span>;
      case 'completed':
        return <span className="status-badge badge-green">✓ Completed</span>;
      case 'cancelled':
        return <span className="status-badge badge-red">✕ Cancelled</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="my-rides-page">
      <div className="my-rides-header">
        <div>
          <h2>{isDriver ? 'Driver Trip History' : 'My Ride History'}</h2>
          <p>Review past bookings, view live active rides, and download trip invoices</p>
        </div>

        {!isDriver && (
          <button className="btn-primary" onClick={() => navigate('/book-ride')}>
            <Car size={18} /> Book New Ride
          </button>
        )}
      </div>

      <div className="rides-filter-bar">
        <div className="filter-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Trips ({rides.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active (
            {
              rides.filter((r) =>
                ['requested', 'accepted', 'in_progress'].includes(r.status)
              ).length
            }
            )
          </button>
          <button
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({rides.filter((r) => r.status === 'completed').length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled ({rides.filter((r) => r.status === 'cancelled').length})
          </button>
        </div>

        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by location, date or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="alert-box error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading trip history...</div>
      ) : filteredRides.length === 0 ? (
        <div className="empty-trips-box">
          <Car size={48} />
          <h3>No Trips Found</h3>
          <p>There are no rides matching your current filter criteria.</p>
          {!isDriver && (
            <button className="btn-primary mt-3" onClick={() => navigate('/book-ride')}>
              Book Your First Ride
            </button>
          )}
        </div>
      ) : (
        <div className="rides-history-list">
          {filteredRides.map((ride) => {
            const isActive = ['requested', 'accepted', 'in_progress'].includes(ride.status);
            const dateStr = new Date(ride.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={ride._id} className={`ride-history-card ${isActive ? 'active-card' : ''}`}>
                <div className="card-header-row">
                  <div className="card-header-left">
                    <span className="ride-date-tag">{dateStr}</span>
                    <span className="tier-tag">{ride.vehicleType?.toUpperCase() || 'COMFORT'}</span>
                  </div>
                  <div className="card-header-right">
                    {getStatusBadge(ride.status)}
                    <span className="card-fare-text">${ride.fare?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="card-body-route">
                  <div className="route-stop">
                    <div className="dot green"></div>
                    <div className="stop-text">
                      <span className="stop-label">Pickup</span>
                      <strong>{ride.pickup?.address || 'Pickup Point'}</strong>
                    </div>
                  </div>

                  <div className="route-stop">
                    <div className="dot red"></div>
                    <div className="stop-text">
                      <span className="stop-label">Dropoff</span>
                      <strong>{ride.dropoff?.address || 'Destination Point'}</strong>
                    </div>
                  </div>
                </div>

                <div className="card-footer-row">
                  <div className="footer-driver-info">
                    {isDriver ? (
                      <span>Passenger: <strong>{ride.user?.name || 'Rider'}</strong></span>
                    ) : (
                      <span>
                        Driver:{' '}
                        <strong>
                          {ride.driver?.name ? `${ride.driver.name} (${ride.driver.vehicleModel || 'Car'})` : 'Assigning...'}
                        </strong>
                      </span>
                    )}
                    {ride.rating?.score && (
                      <span className="user-rating-chip">
                        <Star size={13} fill="#f59e0b" color="#f59e0b" /> {ride.rating.score} / 5
                      </span>
                    )}
                  </div>

                  <div className="footer-btn-actions">
                    {ride.status === 'completed' && (
                      <button
                        className="btn-sm btn-receipt"
                        onClick={() => setSelectedReceipt(ride)}
                      >
                        <Receipt size={14} /> Receipt
                      </button>
                    )}

                    <button
                      className={`btn-sm ${isActive ? 'btn-live-track' : 'btn-details'}`}
                      onClick={() => navigate(`/rides/${ride._id}`)}
                    >
                      {isActive ? (
                        <>
                          <span className="pulse-dot"></span> Live Tracker <ArrowRight size={14} />
                        </>
                      ) : (
                        <>View Details <ChevronRight size={14} /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedReceipt && (
        <div className="modal-backdrop" onClick={() => setSelectedReceipt(null)}>
          <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-header">
              <div className="receipt-brand">
                <Car size={24} className="text-brand" />
                <h3>Official Trip Receipt</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedReceipt(null)}>
                ✕
              </button>
            </div>

            <div className="receipt-body">
              <div className="receipt-meta-grid">
                <div>
                  <span className="r-label">Trip ID</span>
                  <strong>#{selectedReceipt._id.substring(selectedReceipt._id.length - 8).toUpperCase()}</strong>
                </div>
                <div>
                  <span className="r-label">Date & Time</span>
                  <strong>{new Date(selectedReceipt.createdAt).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="r-label">Vehicle Tier</span>
                  <strong>{selectedReceipt.vehicleType?.toUpperCase()}</strong>
                </div>
                <div>
                  <span className="r-label">Payment Status</span>
                  <strong className="text-success">PAID via {selectedReceipt.paymentMethod?.toUpperCase()}</strong>
                </div>
              </div>

              <div className="receipt-route-box">
                <div>
                  <span className="r-label">Pickup</span>
                  <p>{selectedReceipt.pickup?.address}</p>
                </div>
                <div className="mt-2">
                  <span className="r-label">Destination</span>
                  <p>{selectedReceipt.dropoff?.address}</p>
                </div>
              </div>

              <div className="receipt-fare-table">
                <div className="r-fare-row">
                  <span>Base Booking Fee</span>
                  <span>${((selectedReceipt.vehicleType === 'auto' ? 2.5 : selectedReceipt.vehicleType === 'economy' ? 3.5 : selectedReceipt.vehicleType === 'suv' ? 7.5 : selectedReceipt.vehicleType === 'premium' ? 10.0 : 5.0)).toFixed(2)}</span>
                </div>
                <div className="r-fare-row">
                  <span>Distance Charge ({selectedReceipt.distance} km)</span>
                  <span>${Math.max(0, selectedReceipt.fare - (selectedReceipt.vehicleType === 'auto' ? 2.5 : selectedReceipt.vehicleType === 'economy' ? 3.5 : selectedReceipt.vehicleType === 'suv' ? 7.5 : selectedReceipt.vehicleType === 'premium' ? 10.0 : 5.0)).toFixed(2)}</span>
                </div>
                <div className="r-fare-row">
                  <span>Taxes & Surcharge</span>
                  <span>$0.00</span>
                </div>
                <div className="r-fare-row total-fare">
                  <strong>Total Amount Paid</strong>
                  <strong>${selectedReceipt.fare?.toFixed(2)}</strong>
                </div>
              </div>

              {selectedReceipt.rating?.score && (
                <div className="receipt-rating-box">
                  <span>Feedback Rating:</span>
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= selectedReceipt.rating.score ? '#f59e0b' : 'none'}
                        color="#f59e0b"
                      />
                    ))}
                    <span className="ms-2">"{selectedReceipt.rating.comment || 'Smooth trip!'}"</span>
                  </div>
                </div>
              )}
            </div>

            <div className="receipt-footer">
              <button className="btn-secondary" onClick={() => window.print()}>
                <FileText size={16} /> Print / Save PDF
              </button>
              <button className="btn-primary" onClick={() => setSelectedReceipt(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRides;
