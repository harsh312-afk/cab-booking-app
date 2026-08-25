import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const MyRides = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await api.get(`/rides`);
        setRides(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load rides');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRides();
    }
  }, [user]);

  if (loading) return <div>Loading rides...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="my-rides-container">
      <h2>My Rides</h2>
      {rides.length === 0 ? (
        <p>You haven't booked any rides yet.</p>
      ) : (
        <>
          <table className="rides-table">
            <thead>
              <tr>
                <th>Pickup</th>
                <th>Dropoff</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rides.map(ride => (
                <tr key={ride._id}>
                  <td>
                    {ride.pickup.address || `Lat: ${ride.pickup.coordinates[1]}, Lng: ${ride.pickup.coordinates[0]}`}
                  </td>
                  <td>
                    {ride.dropoff.address || `Lat: ${ride.dropoff.coordinates[1]}, Lng: ${ride.dropoff.coordinates[0]}`}
                  </td>
                  <td>{ride.status}</td>
                  <td>
                    <button onClick={() => navigate(`/rides/${ride._id}`)}>
                      View Details
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

export default MyRides;