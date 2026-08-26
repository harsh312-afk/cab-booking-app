import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const BookRide = () => {
  const [pickup, setPickup] = useState({ lat: '', lng: '', address: '' });
  const [dropoff, setDropoff] = useState({ lat: '', lng: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate inputs
    if (!pickup.lat || !pickup.lng || !dropoff.lat || !dropoff.lng) {
      setError('Please provide valid coordinates for pickup and dropoff');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/rides/request', {
        pickup: {
          coordinates: [parseFloat(pickup.lng), parseFloat(pickup.lat)], // Note: GeoJSON expects [lng, lat]
          address: pickup.address
        },
        dropoff: {
          coordinates: [parseFloat(dropoff.lng), parseFloat(dropoff.lat)],
          address: dropoff.address
        }
      });
      setLoading(false);
      navigate(`/rides/${res.data._id}`);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to book ride');
    }
  };

  return (
    <div className="book-ride-container">
      <h2>Book a Ride</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <h3>Pickup Location</h3>
          <div>
            <label>Latitude:</label>
            <input
              type="number"
              step="any"
              value={pickup.lat}
              onChange={(e) => setPickup({ ...pickup, lat: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Longitude:</label>
            <input
              type="number"
              step="any"
              value={pickup.lng}
              onChange={(e) => setPickup({ ...pickup, lng: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Address (optional):</label>
            <input
              type="text"
              value={pickup.address}
              onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
            />
          </div>
        </div>

        <div>
          <h3>Dropoff Location</h3>
          <div>
            <label>Latitude:</label>
            <input
              type="number"
              step="any"
              value={dropoff.lat}
              onChange={(e) => setDropoff({ ...dropoff, lat: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Longitude:</label>
            <input
              type="number"
              step="any"
              value={dropoff.lng}
              onChange={(e) => setDropoff({ ...dropoff, lng: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Address (optional):</label>
            <input
              type="text"
              value={dropoff.address}
              onChange={(e) => setDropoff({ ...dropoff, address: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Booking ride...' : 'Book Ride'}
        </button>
      </form>
    </div>
  );
};

export default BookRide;