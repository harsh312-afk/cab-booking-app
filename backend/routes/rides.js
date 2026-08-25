const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Ride = require('../models/Ride');
const User = require('../models/User');

// @desc    Request a ride
// @route   POST /api/rides/request
// @access  Private (user)
router.post('/request', protect, authorize('user'), async (req, res) => {
  try {
    const { pickup, dropoff } = req.body;

    // Validate input
    if (!pickup || !dropoff || !pickup.coordinates || !dropoff.coordinates) {
      return res.status(400).json({ message: 'Please provide pickup and dropoff locations' });
    }

    // Create ride
    const ride = await Ride.create({
      user: req.user._id,
      pickup: {
        type: 'Point',
        coordinates: pickup.coordinates,
        address: pickup.address || ''
      },
      dropoff: {
        type: 'Point',
        coordinates: dropoff.coordinates,
        address: dropoff.address || ''
      }
    });

    res.status(201).json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all rides for the logged-in user
// @route   GET /api/rides
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const rides = await Ride.find({ user: req.user._id })
      .populate('driver', 'name phone')
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get ride by ID
// @route   GET /api/rides/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('user', 'name phone')
      .populate('driver', 'name phone');

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if the ride belongs to the user or the user is the driver
    if (ride.user._id.toString() !== req.user._id.toString() &&
        ride.driver && ride.driver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this ride' });
    }

    res.json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update ride status (accept, start, complete, cancel)
// @route   PATCH /api/rides/:id
// @access  Private (driver or user depending on status)
router.patch('/:id', protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Only allow the user who requested the ride or a driver to update
    const isUser = ride.user._id.toString() === req.user._id.toString();
    const isDriver = ride.driver && ride.driver._id.toString() === req.user._id.toString();

    if (!isUser && !isDriver) {
      return res.status(403).json({ message: 'Not authorized to update this ride' });
    }

    const { status, fare, distance } = req.body;

    // Update ride
    if (status) ride.status = status;
    if (fare !== undefined) ride.fare = fare;
    if (distance !== undefined) ride.distance = distance;
    ride.updatedAt = Date.now();

    // If status is accepted and user is driver, assign driver
    if (status === 'accepted' && isDriver) {
      ride.driver = req.user._id;
    }

    const updatedRide = await ride.save();

    // Populate user and driver for response
    await updatedRide.populate('user', 'name phone');
    if (updatedRide.driver) {
      await updatedRide.populate('driver', 'name phone');
    }

    res.json(updatedRide);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all rides for drivers (to see available rides)
// @route   GET /api/rides/available
// @access  Private (driver)
router.get('/available', protect, authorize('driver'), async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'requested' })
      .populate('user', 'name phone')
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;