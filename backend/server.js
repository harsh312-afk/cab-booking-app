const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cabbookingdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Cab Booking API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});