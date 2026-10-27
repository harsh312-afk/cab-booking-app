const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedUsers = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cabbookingdb';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected for seeding demo accounts...');

    // 1. Seed Demo Rider
    const existingRider = await User.findOne({ email: 'rider@example.com' });
    if (!existingRider) {
      await User.create({
        name: 'Demo Rider',
        email: 'rider@example.com',
        password: 'password123',
        phone: '+1-555-0100',
        role: 'user'
      });
      console.log('✅ Created Demo Rider: rider@example.com / password123');
    } else {
      console.log('ℹ️ Demo Rider already exists');
    }

    // 2. Seed Demo Driver
    const existingDriver = await User.findOne({ email: 'driver@example.com' });
    if (!existingDriver) {
      await User.create({
        name: 'Demo Captain Bob',
        email: 'driver@example.com',
        password: 'password123',
        phone: '+1-555-0200',
        role: 'driver',
        vehicleModel: 'Toyota Camry Hybrid',
        vehicleNumber: 'KA-05-MJ-9999',
        vehicleType: 'comfort',
        isAvailable: true
      });
      console.log('✅ Created Demo Driver: driver@example.com / password123');
    } else {
      console.log('ℹ️ Demo Driver already exists');
    }

    console.log('✨ Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedUsers();
