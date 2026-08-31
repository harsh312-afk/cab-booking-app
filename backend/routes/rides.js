const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Ride = require('../models/Ride');
const User = require('../models/User');

// Distance calculation using Haversine formula (km)
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.max(1.0, Math.round(dist * 10) / 10); // Minimum 1.0 km
};

// Calculate fare based on vehicle type and distance
const calculateFare = (distanceKm, vehicleType = 'comfort') => {
  const rates = {
    auto: { base: 2.5, perKm: 0.8 },
    economy: { base: 3.5, perKm: 1.1 },
    comfort: { base: 5.0, perKm: 1.4 },
    suv: { base: 7.5, perKm: 1.9 },
    premium: { base: 10.0, perKm: 2.5 }
  };
  const rate = rates[vehicleType] || rates.comfort;
  const fare = rate.base + distanceKm * rate.perKm;
  return Math.round(fare * 100) / 100;
};

// @desc    Request a new ride
// @route   POST /api/rides/request
// @access  Private
router.post('/request', protect, async (req, res) => {
  try {
    const { pickup, dropoff, vehicleType, paymentMethod } = req.body;

    if (
      !pickup ||
      !dropoff ||
      !Array.isArray(pickup.coordinates) ||
      !Array.isArray(dropoff.coordinates) ||
      pickup.coordinates.length < 2 ||
      dropoff.coordinates.length < 2
    ) {
      return res.status(400).json({ message: 'Please provide valid pickup and dropoff locations with coordinates' });
    }

    const pickupLng = parseFloat(pickup.coordinates[0]);
    const pickupLat = parseFloat(pickup.coordinates[1]);
    const dropoffLng = parseFloat(dropoff.coordinates[0]);
    const dropoffLat = parseFloat(dropoff.coordinates[1]);

    if (isNaN(pickupLng) || isNaN(pickupLat) || isNaN(dropoffLng) || isNaN(dropoffLat)) {
      return res.status(400).json({ message: 'Invalid coordinate values' });
    }

    const distance = calculateDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
    const selectedVehicleType = vehicleType || 'comfort';
    const fare = calculateFare(distance, selectedVehicleType);
    const estimatedDuration = Math.round(distance * 3 + 5); // Approx ~3 mins/km + 5 mins buffer

    const ride = await Ride.create({
      user: req.user._id,
      pickup: {
        type: 'Point',
        coordinates: [pickupLng, pickupLat],
        address: pickup.address || 'Pickup Location'
      },
      dropoff: {
        type: 'Point',
        coordinates: [dropoffLng, dropoffLat],
        address: dropoff.address || 'Dropoff Location'
      },
      driverLocation: {
        type: 'Point',
        coordinates: [pickupLng - 0.01, pickupLat - 0.01]
      },
      vehicleType: selectedVehicleType,
      paymentMethod: paymentMethod || 'card',
      fare,
      distance,
      estimatedDuration,
      status: 'requested'
    });

    const populatedRide = await Ride.findById(ride._id).populate('user', 'name phone email');

    // Notify connected drivers in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('new_ride_alert', populatedRide);
    }

    res.status(201).json(populatedRide);
  } catch (error) {
    console.error('Ride request error:', error);
    res.status(500).json({ message: error.message || 'Server error creating ride request' });
  }
});

// @desc    Get available rides for drivers
// @route   GET /api/rides/available
// @access  Private (driver)
router.get('/available', protect, authorize('driver'), async (req, res) => {
  try {
    const rides = await Ride.find({
      status: 'requested',
      driver: null
    })
      .populate('user', 'name phone')
      .sort({ createdAt: -1 });

    res.json(rides);
  } catch (error) {
    console.error('Available rides error:', error);
    res.status(500).json({ message: 'Server error retrieving available rides' });
  }
});

// @desc    Get rides for logged-in user or driver
// @route   GET /api/rides
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const isDriver = req.user.role === 'driver';
    const { status } = req.query;

    let query = isDriver
      ? { $or: [{ driver: userId }, { user: userId }] }
      : { user: userId };

    if (status && status !== 'all') {
      if (status === 'active') {
        query.status = { $in: ['requested', 'accepted', 'in_progress'] };
      } else {
        query.status = status;
      }
    }

    const rides = await Ride.find(query)
      .populate('user', 'name phone email')
      .populate('driver', 'name phone vehicleModel vehicleNumber vehicleType driverRating')
      .sort({ createdAt: -1 });

    res.json(rides);
  } catch (error) {
    console.error('Fetch rides error:', error);
    res.status(500).json({ message: 'Server error retrieving rides' });
  }
});

// @desc    Get single ride by ID
// @route   GET /api/rides/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('driver', 'name phone vehicleModel vehicleNumber vehicleType driverRating');

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const isRider = ride.user && ride.user._id.toString() === req.user._id.toString();
    const isDriver = ride.driver && ride.driver._id.toString() === req.user._id.toString();
    const isPotentialDriver = req.user.role === 'driver' && ride.status === 'requested';

    if (!isRider && !isDriver && !isPotentialDriver) {
      return res.status(403).json({ message: 'Not authorized to access this ride' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Single ride fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update ride status (accept, start, complete, cancel)
// @route   PATCH /api/rides/:id
// @access  Private
router.patch('/:id', protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const { status, cancellationReason, fare, distance } = req.body;
    const isUser = ride.user.toString() === req.user._id.toString();
    const isAssignedDriver = ride.driver && ride.driver.toString() === req.user._id.toString();
    const isDriverUser = req.user.role === 'driver';

    // State transition validations
    if (status === 'accepted') {
      if (!isDriverUser) {
        return res.status(403).json({ message: 'Only registered drivers can accept rides' });
      }
      if (ride.status !== 'requested') {
        return res.status(400).json({ message: `Ride cannot be accepted because it is currently ${ride.status}` });
      }
      ride.driver = req.user._id;
      ride.status = 'accepted';
      ride.driverLocation = {
        type: 'Point',
        coordinates: [ride.pickup.coordinates[0] - 0.008, ride.pickup.coordinates[1] - 0.008]
      };
    } else if (status === 'in_progress') {
      if (!isAssignedDriver) {
        return res.status(403).json({ message: 'Only the assigned driver can start this ride' });
      }
      if (ride.status !== 'accepted') {
        return res.status(400).json({ message: 'Ride must be accepted before starting' });
      }
      ride.status = 'in_progress';
      ride.startedAt = new Date();
    } else if (status === 'completed') {
      if (!isAssignedDriver && !isUser) {
        return res.status(403).json({ message: 'Not authorized to complete this ride' });
      }
      if (ride.status !== 'in_progress') {
        return res.status(400).json({ message: 'Only in-progress rides can be completed' });
      }
      ride.status = 'completed';
      ride.completedAt = new Date();
      ride.paymentStatus = 'paid';

      // Update driver earnings and ride counter
      if (ride.driver) {
        await User.findByIdAndUpdate(ride.driver, {
          $inc: {
            totalEarnings: ride.fare || 0,
            totalRidesCount: 1
          }
        });
      }
    } else if (status === 'cancelled') {
      if (!isUser && !isAssignedDriver) {
        return res.status(403).json({ message: 'Not authorized to cancel this ride' });
      }
      if (ride.status === 'completed') {
        return res.status(400).json({ message: 'Cannot cancel an already completed ride' });
      }
      ride.status = 'cancelled';
      ride.cancellationReason = cancellationReason || 'Cancelled by ' + (isUser ? 'rider' : 'driver');
      ride.cancelledBy = isUser ? 'user' : 'driver';
    }

    if (fare !== undefined) ride.fare = fare;
    if (distance !== undefined) ride.distance = distance;

    const updatedRide = await ride.save();

    const populated = await Ride.findById(updatedRide._id)
      .populate('user', 'name phone email')
      .populate('driver', 'name phone vehicleModel vehicleNumber vehicleType driverRating');

    // Emit live socket updates
    const io = req.app.get('io');
    if (io) {
      io.emit(`ride_status_updated_${populated._id}`, populated);
      io.emit('ride_updated', populated);
    }

    res.json(populated);
  } catch (error) {
    console.error('Ride status update error:', error);
    res.status(500).json({ message: error.message || 'Server error updating ride' });
  }
});

// @desc    Verify OTP to start ride securely
// @route   POST /api/rides/:id/verify-otp
// @access  Private (driver)
router.post('/:id/verify-otp', protect, authorize('driver'), async (req, res) => {
  try {
    const { otp } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (!ride.driver || ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned driver can verify OTP' });
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ message: 'Ride must be in accepted status to verify OTP' });
    }

    if (ride.otpCode !== otp?.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check with the passenger.' });
    }

    ride.status = 'in_progress';
    ride.startedAt = new Date();
    await ride.save();

    const populated = await Ride.findById(ride._id)
      .populate('user', 'name phone email')
      .populate('driver', 'name phone vehicleModel vehicleNumber vehicleType driverRating');

    const io = req.app.get('io');
    if (io) {
      io.emit(`ride_status_updated_${populated._id}`, populated);
      io.emit('ride_updated', populated);
    }

    res.json({ message: 'OTP verified successfully! Ride started.', ride: populated });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ message: error.message || 'Server error verifying OTP' });
  }
});

// @desc    Rate completed ride
// @route   POST /api/rides/:id/rate
// @access  Private (user)
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { score, comment } = req.body;
    const ratingScore = Number(score);

    if (!ratingScore || ratingScore < 1 || ratingScore > 5) {
      return res.status(400).json({ message: 'Please provide a rating score between 1 and 5' });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the rider can rate this ride' });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed rides can be rated' });
    }

    ride.rating = {
      score: ratingScore,
      comment: comment || '',
      ratedAt: new Date()
    };

    await ride.save();

    // Recalculate driver's overall rating
    if (ride.driver) {
      const driver = await User.findById(ride.driver);
      if (driver) {
        const currentTotal = (driver.driverRating || 5.0) * (driver.totalRatingsCount || 1);
        const newCount = (driver.totalRatingsCount || 1) + 1;
        const newAverage = (currentTotal + ratingScore) / newCount;
        driver.driverRating = Math.round(newAverage * 10) / 10;
        driver.totalRatingsCount = newCount;
        await driver.save();
      }
    }

    res.json({ message: 'Thank you for your rating!', rating: ride.rating });
  } catch (error) {
    console.error('Rate ride error:', error);
    res.status(500).json({ message: 'Server error saving rating' });
  }
});

// @desc    Live driver location update during active ride
// @route   POST /api/rides/:id/location
// @access  Private (driver)
router.post('/:id/location', protect, authorize('driver'), async (req, res) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ message: 'Valid coordinates required' });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    ride.driverLocation = {
      type: 'Point',
      coordinates
    };
    await ride.save();

    const io = req.app.get('io');
    if (io) {
      io.emit(`driver_location_${ride._id}`, { coordinates });
    }

    res.json({ success: true, coordinates });
  } catch (error) {
    console.error('Ride location update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
