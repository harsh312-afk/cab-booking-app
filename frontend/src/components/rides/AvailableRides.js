import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AvailableRides = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAvailableRides = async () => {
      try {
        const res = await api.get(`/rides/available`);
        setRides(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load available rides');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'driver') {
      fetchAvailableRides();
    }
  }, [user]);

  if (loading) return <div>Loading available rides...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="available-rides-container">
      <h2>Available Rides</h2>
      {rides.length === 0 ? (
        <p>No available rides at the moment.</p>
      ) : (
        <>
          <table className="rides-table">
            <thead>
              <tr>
                <th>Rider</th>
                <th>Pickup</th>
                <th>Dropoff</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rides.map(ride => (
                <tr key={ride._id}>
                  <td>
                    {ride.user.name} ({ride.user.phone})
                  </td>
                  <td>
                    {ride.pickup.address || `Lat: ${ride.pickup.coordinates[1]}, Lng: ${ride.pickup.coordinates[0]}`}
                  </td>
                  <td>
                    {ride.dropoff.address || `Lat: ${ride.dropoff.coordinates[1]}, Lng: ${ride.dropoff.coordinates[0]}`}
                  </td>
                  <td>
                    <button onClick={() => navigate(`/rides/${ride._id}`)}>
                      View & Accept
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AvailableRides;