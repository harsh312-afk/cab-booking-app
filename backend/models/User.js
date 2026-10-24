const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'driver'],
    default: 'user'
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [77.5946, 12.9716] // Default [lng, lat]
    },
    address: {
      type: String,
      default: 'Downtown Central'
    }
  },
  // Driver-specific fields
  vehicleModel: {
    type: String,
    default: 'Toyota Camry'
  },
  vehicleNumber: {
    type: String,
    default: 'KA-01-AB-1234'
  },
  vehicleType: {
    type: String,
    enum: ['auto', 'economy', 'comfort', 'suv', 'premium'],
    default: 'comfort'
  },
  driverRating: {
    type: Number,
    default: 4.9
  },
  totalRatingsCount: {
    type: Number,
    default: 1
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalRidesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Performance indexes
userSchema.index({ role: 1, isAvailable: 1 });
userSchema.index({ 'currentLocation.coordinates': '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
