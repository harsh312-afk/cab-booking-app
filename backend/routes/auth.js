const express = require('express');
const router = express.Router();
const { protect, authorize, JWT_SECRET } = require('../middleware/auth');
const User = require('../models/User');
const Ride = require('../models/Ride');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user or driver
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, vehicleModel, vehicleNumber, vehicleType } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Please provide name, email, password, and phone number' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create user object
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      role: role === 'driver' ? 'driver' : 'user'
    };

    if (role === 'driver') {
      userData.vehicleModel = vehicleModel || 'Toyota Camry';
      userData.vehicleNumber = vehicleNumber || 'KA-01-AB-1234';
      userData.vehicleType = vehicleType || 'comfort';
      userData.isAvailable = true;
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isAvailable: user.isAvailable,
      currentLocation: user.currentLocation,
      vehicleModel: user.vehicleModel,
      vehicleNumber: user.vehicleNumber,
      vehicleType: user.vehicleType,
      driverRating: user.driverRating,
      totalEarnings: user.totalEarnings,
      totalRidesCount: user.totalRidesCount,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isAvailable: user.isAvailable,
      currentLocation: user.currentLocation,
      vehicleModel: user.vehicleModel,
      vehicleNumber: user.vehicleNumber,
      vehicleType: user.vehicleType,
      driverRating: user.driverRating,
      totalEarnings: user.totalEarnings,
      totalRidesCount: user.totalRidesCount,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.phone) user.phone = req.body.phone.trim();
    if (req.body.email && req.body.email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
      user.email = req.body.email.toLowerCase().trim();
    }

    if (user.role === 'driver') {
      if (req.body.vehicleModel) user.vehicleModel = req.body.vehicleModel;
      if (req.body.vehicleNumber) user.vehicleNumber = req.body.vehicleNumber;
      if (req.body.vehicleType) user.vehicleType = req.body.vehicleType;
      if (req.body.isAvailable !== undefined) user.isAvailable = req.body.isAvailable;
    }

    // If updating password, assign plain password and pre('save') hashes it once
    if (req.body.password && req.body.password.trim() !== '') {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isAvailable: updatedUser.isAvailable,
      currentLocation: updatedUser.currentLocation,
      vehicleModel: updatedUser.vehicleModel,
      vehicleNumber: updatedUser.vehicleNumber,
      vehicleType: updatedUser.vehicleType,
      driverRating: updatedUser.driverRating,
      totalEarnings: updatedUser.totalEarnings,
      totalRidesCount: updatedUser.totalRidesCount
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: error.message || 'Server error updating profile' });
  }
});

// @desc    Toggle driver online status / update location
// @route   PUT /api/auth/driver-status
// @access  Private (driver)
router.put('/driver-status', protect, authorize('driver'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (req.body.isAvailable !== undefined) {
      user.isAvailable = req.body.isAvailable;
    }

    if (req.body.coordinates && Array.isArray(req.body.coordinates)) {
      user.currentLocation = {
        type: 'Point',
        coordinates: req.body.coordinates,
        address: req.body.address || user.currentLocation.address
      };
    }

    await user.save();

    // Broadcast driver status update via socket if IO attached
    const io = req.app.get('io');
    if (io) {
      io.emit('driver_status_changed', {
        driverId: user._id,
        isAvailable: user.isAvailable,
        location: user.currentLocation
      });
    }

    res.json({
      isAvailable: user.isAvailable,
      currentLocation: user.currentLocation
    });
  } catch (error) {
    console.error('Driver status update error:', error);
    res.status(500).json({ message: 'Server error updating driver status' });
  }
});

// @desc    Get dashboard metrics for user or driver
// @route   GET /api/auth/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const isDriver = req.user.role === 'driver';

    const filter = isDriver ? { driver: userId } : { user: userId };

    const totalRides = await Ride.countDocuments(filter);
    const completedRides = await Ride.countDocuments({ ...filter, status: 'completed' });
    const cancelledRides = await Ride.countDocuments({ ...filter, status: 'cancelled' });
    const activeRides = await Ride.countDocuments({
      ...filter,
      status: { $in: ['requested', 'accepted', 'in_progress'] }
    });

    const rides = await Ride.find({ ...filter, status: 'completed' }).select('fare');
    const totalAmount = rides.reduce((sum, r) => sum + (r.fare || 0), 0);

    res.json({
      totalRides,
      completedRides,
      cancelledRides,
      activeRides,
      totalAmount: Math.round(totalAmount * 100) / 100,
      rating: isDriver ? req.user.driverRating : 5.0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error retrieving statistics' });
  }
});

// @desc    Get all active drivers
// @route   GET /api/auth/drivers
// @access  Private
router.get('/drivers', protect, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', isAvailable: true }).select('-password');
    res.json(drivers);
  } catch (error) {
    console.error('Drivers fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
