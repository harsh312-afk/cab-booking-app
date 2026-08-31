import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, Car, AlertCircle } from 'lucide-react';

const Register = () => {
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  const [vehicleModel, setVehicleModel] = useState('Toyota Camry');
  const [vehicleNumber, setVehicleNumber] = useState('KA-01-AB-1234');
  const [vehicleType, setVehicleType] = useState('comfort');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('role') === 'driver') {
      setRole('driver');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      name,
      email,
      password,
      phone,
      role,
      ...(role === 'driver' && {
        vehicleModel,
        vehicleNumber,
        vehicleType
      })
    };

    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <User size={26} className="text-brand" />
          </div>
          <h2>Create Your Account</h2>
          <p>Join the next-generation cab network as a passenger or driver</p>
        </div>

        <div className="role-switcher">
          <button
            type="button"
            className={`role-tab ${role === 'user' ? 'active' : ''}`}
            onClick={() => setRole('user')}
          >
            <User size={18} />
            <span>Passenger / Rider</span>
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'driver' ? 'active' : ''}`}
            onClick={() => setRole('driver')}
          >
            <Car size={18} />
            <span>Driver Partner</span>
          </button>
        </div>

        {error && (
          <div className="alert-box error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>
              <User size={16} /> Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
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
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Phone size={16} /> Phone Number
            </label>
            <input
              type="tel"
              placeholder="+1-555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} /> Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {role === 'driver' && (
            <div className="driver-extra-fields">
              <div className="section-divider">
                <span>Vehicle Information</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda City"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>License Plate</label>
                  <input
                    type="text"
                    placeholder="e.g. KA-01-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Vehicle Category</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="form-select"
                >
                  <option value="auto">Auto / Tuk-Tuk (3-wheeler)</option>
                  <option value="economy">Economy Mini (Hatchback)</option>
                  <option value="comfort">Comfort Sedan (4-seater)</option>
                  <option value="suv">SUV XL (6-seater)</option>
                  <option value="premium">Premium Luxury Sedan</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating Account...' : `Register as ${role === 'driver' ? 'Driver Partner' : 'Rider'}`}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
