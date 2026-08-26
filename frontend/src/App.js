import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BookRide from './components/rides/BookRide';
import MyRides from './components/rides/MyRides';
import AvailableRides from './components/rides/AvailableRides';
import RideDetails from './components/rides/RideDetails';
import Profile from './components/Profile';
import './App.css';

// Protected route component that redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Driver-only route component
const DriverRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'driver') return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route path="/book-ride" element={<ProtectedRoute><BookRide /></ProtectedRoute>} />
              <Route path="/my-rides" element={<ProtectedRoute><MyRides /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/rides/:id" element={<ProtectedRoute><RideDetails /></ProtectedRoute>} />
              <Route path="/available-rides" element={
                <DriverRoute>
                  <AvailableRides />
                </DriverRoute>
              } />
            </Routes>
          </main>
          <SpeedInsights />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;