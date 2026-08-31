import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Sparkles, Car, Shield } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const fillDemoRider = () => {
    setEmail('rider@example.com');
    setPassword('password123');
  };

  const fillDemoDriver = () => {
    setEmail('driver@example.com');
    setPassword('password123');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <LogIn size={26} className="text-brand" />
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to manage your rides and track trips in real-time</p>
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
              <Mail size={16} /> Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} /> Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="demo-credentials-box">
          <span className="demo-hint">
            <Sparkles size={14} /> Quick Demo Logins:
          </span>
          <div className="demo-btn-group">
            <button type="button" className="btn-demo" onClick={fillDemoRider}>
              <Car size={14} /> Rider Demo
            </button>
            <button type="button" className="btn-demo" onClick={fillDemoDriver}>
              <Shield size={14} /> Driver Demo
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account yet? <Link to="/register" className="auth-link">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
