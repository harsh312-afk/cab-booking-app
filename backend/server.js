const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join_ride', (rideId) => {
    socket.join(`ride_${rideId}`);
  });

  socket.on('leave_ride', (rideId) => {
    socket.leave(`ride_${rideId}`);
  });

  socket.on('send_location_update', ({ rideId, coordinates }) => {
    io.to(`ride_${rideId}`).emit(`driver_location_${rideId}`, { coordinates });
  });

  socket.on('disconnect', () => {});
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect Database (with automatic in-memory fallback for local dev / tests)
const connectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    return;
  }
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cabbookingdb';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.log('Local MongoDB not available, falling back to In-Memory MongoDB Server for dev/test...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log('Connected to In-Memory MongoDB at:', memUri);
    } catch (memErr) {
      console.error('Failed to start MongoDB Memory Server:', memErr.message);
    }
  }
};

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Import routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

// Health check and root route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    mongoState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Cab Booking API with Real-time Socket.IO' });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ message: `API route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global API Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Cab Booking Server running on port ${PORT}`);
  });
}

module.exports = { app, server, connectDB };
