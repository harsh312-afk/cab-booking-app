import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from './useToast'; // We'll create this hook or use a simple alternative

const RideDetails = () => {
  const { user } = useAuth();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState(''); // Simple toast state

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/rides/${id}`);
        setRide(res.data);
      } catch (err) {
        console.error(err);
        setToast('Failed to load ride details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRide();
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.patch(`/rides/${id}`, { status: newStatus });
      setToast(`Ride status updated to ${newStatus}`);
      // Refetch ride to get updated status
      const res = await api.get(`/rides/${id}`);
      setRide(res.data);
    } catch (err) {
      console.error(err);
      setToast('Failed to update ride status');
    }
  };

  if (loading) return <div>Loading ride details...</div>;
  if (!ride) return <div>Ride not found</div>;

  // Check authorization: user must be either the rider or the driver
  const isRider = ride.user && ride.user._id === user._id;
  const isDriver = ride.driver && ride.driver._id === user._id;
  const isAuthorized = isRider || isDriver;

  if (!isAuthorized) {
    return <div>You are not authorized to view this ride</div>;
  }

  return (
    <div className="ride-details-container">
      <h2>Ride Details</h2>
      {toast && <div className="toast">{toast}</div>}
      <div className="ride-info">
        <div>
          <h3>Status:</h3>
          <p>{ride.status}</p>
        </div>
        <div>
          <h3>Pickup:</h3>
          <p>{ride.pickup.address || `Lat: ${ride.pickup.coordinates[1]}, Lng: ${ride.pickup.coordinates[0]}`}</p>
        </div>
        <div>
          <h3>Dropoff:</h3>
          <p>{ride.dropoff.address || `Lat: ${ride.dropoff.coordinates[1]}, Lng: ${ride.dropoff.coordinates[0]}`}</p>
        </div>
        {ride.fare && (
          <div>
            <h3>Fare:</h3>
            <p>${ride.fare.toFixed(2)}</p>
          </div>
        )}
        {ride.distance && (
          <div>
            <h3>Distance:</h3>
            <p>{ride.distance.toFixed(2)} km</p>
          </div>
        )}
        <div>
          <h3>Rider:</h3>
          <p>{ride.user.name} ({ride.user.phone})</p>
        </div>
        {ride.driver && (
          <div>
            <h3>Driver:</h3>
            <p>{ride.driver.name} ({ride.driver.phone})</p>
          </div>
        )}
        <div className="actions">
          {/* Show actions based on user role and current status */}
          {!ride.driver && ride.status === 'requested' && (
            <button onClick={() => handleStatusUpdate('cancelled')}>
              Cancel Ride
            </button>
          )}
          {ride.driver && ride.status === 'requested' && (
            <button onClick={() => handleStatusUpdate('accepted')}>
              Accept Ride
            </button>
          )}
          {ride.driver && ride.status === 'accepted' && (
            <button onClick={() => handleStatusUpdate('in_progress')}>
              Start Ride
            </button>
          )}
          {ride.driver && ride.status === 'in_progress' && (
            <>
              <button onClick={() => handleStatusUpdate('completed')}>
                Complete Ride
              </button>
              <button onClick={() => handleStatusUpdate('cancelled')}>
                Cancel Ride
              </button>
            </>
          )}
          {ride.user && ride.status === 'in_progress' && (
            <button onClick={() => handleStatusUpdate('completed')}>
              Mark as Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideDetails;