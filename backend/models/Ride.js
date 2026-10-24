const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  pickup: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      default: 'Pickup Location'
    }
  },
  dropoff: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      default: 'Dropoff Location'
    }
  },
  driverLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  vehicleType: {
    type: String,
    enum: ['auto', 'economy', 'comfort', 'suv', 'premium'],
    default: 'comfort'
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  fare: {
    type: Number,
    required: true
  },
  distance: {
    type: Number, // In kilometers
    required: true
  },
  estimatedDuration: {
    type: Number, // In minutes
    default: 15
  },
  otpCode: {
    type: String,
    default: () => Math.floor(1000 + Math.random() * 9000).toString()
  },
  otpAttempts: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'wallet', 'upi'],
    default: 'card'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  cancelledBy: {
    type: String,
    enum: ['user', 'driver', null],
    default: null
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      default: ''
    },
    ratedAt: {
      type: Date
    }
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Query performance and geospatial indexes
rideSchema.index({ user: 1, createdAt: -1 });
rideSchema.index({ driver: 1, createdAt: -1 });
rideSchema.index({ status: 1, createdAt: -1 });
rideSchema.index({ 'pickup.coordinates': '2dsphere' });
rideSchema.index({ 'driverLocation.coordinates': '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
