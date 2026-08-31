import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Mail,
  Phone,
  Lock,
  Car,
  Shield,
  Star,
  CheckCircle2,
  AlertCircle,
  Save,
  Power
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser, isDriver, toggleDriverAvailability } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [vehicleModel, setVehicleModel] = useState(user?.vehicleModel || '');
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [vehicleType, setVehicleType] = useState(user?.vehicleType || 'comfort');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setVehicleModel(user.vehicleModel || 'Toyota Camry');
      setVehicleNumber(user.vehicleNumber || 'KA-01-AB-1234');
      setVehicleType(user.vehicleType || 'comfort');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        phone,
        ...(password && { password }),
        ...(isDriver && {
          vehicleModel,
          vehicleNumber,
          vehicleType
        })
      };

      const res = await api.put('/auth/profile', payload);
      updateUser(res.data);
      setSuccess('Profile updated successfully!');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="loading-state">Loading user profile...</div>;

  return (
    <div className="profile-page-wrapper">
      <div className="profile-card">
        <div className="profile-banner">
          <div className="profile-avatar-large">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-title-group">
            <h2>{user.name}</h2>
            <div className="profile-meta-tags">
              <span className={`role-pill ${user.role}`}>
                {user.role === 'driver' ? 'Verified Driver' : 'Registered Rider'}
              </span>
              {isDriver && (
                <span className="rating-pill">
                  <Star size={14} className="star-icon" fill="currentColor" /> {user.driverRating?.toFixed(1) || '4.9'}
                </span>
              )}
            </div>
          </div>
        </div>

        {isDriver && (
          <div className="profile-driver-stats">
            <div className="p-stat">
              <span className="p-label">Total Earnings</span>
              <strong className="p-value text-success">${user.totalEarnings || 0}</strong>
            </div>
            <div className="p-stat">
              <span className="p-label">Completed Rides</span>
              <strong className="p-value">{user.totalRidesCount || 0}</strong>
            </div>
            <div className="p-stat">
              <span className="p-label">Availability</span>
              <button
                type="button"
                className={`mini-toggle-btn ${user.isAvailable ? 'online' : 'offline'}`}
                onClick={() => toggleDriverAvailability(!user.isAvailable)}
              >
                <Power size={12} /> {user.isAvailable ? 'Online' : 'Offline'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="alert-box error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert-box success-alert">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section-title">Personal Information</div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <User size={16} /> Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Mail size={16} /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <Phone size={16} /> Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={16} /> Change Password (optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep unchanged"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isDriver && (
            <>
              <div className="form-section-title">Vehicle & Driver Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Car size={16} /> Vehicle Model
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Shield size={16} /> License Plate Number
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Vehicle Category Tier</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="form-select"
                >
                  <option value="auto">Auto / Tuk-Tuk</option>
                  <option value="economy">Economy Mini</option>
                  <option value="comfort">Comfort Sedan</option>
                  <option value="suv">SUV XL (6-seater)</option>
                  <option value="premium">Premium Luxury Sedan</option>
                </select>
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} />
              <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
