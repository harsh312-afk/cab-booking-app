const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../server');
const User = require('../models/User');
const Ride = require('../models/Ride');

let mongoServer;
let riderToken, driverToken, otherRiderToken;
let riderId, driverId;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Ride.deleteMany({});

  // Create Rider
  const riderRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Alice Rider',
      email: 'alice@test.com',
      password: 'password123',
      phone: '+1-555-0101',
      role: 'user'
    });
  riderToken = riderRes.body.token;
  riderId = riderRes.body._id;

  // Create Driver
  const driverRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Bob Driver',
      email: 'bob@driver.com',
      password: 'password123',
      phone: '+1-555-0202',
      role: 'driver',
      vehicleModel: 'Honda Civic',
      vehicleNumber: 'CAB-999',
      vehicleType: 'comfort'
    });
  driverToken = driverRes.body.token;
  driverId = driverRes.body._id;

  // Create Other Rider
  const otherRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Charlie Rider',
      email: 'charlie@test.com',
      password: 'password123',
      phone: '+1-555-0303',
      role: 'user'
    });
  otherRiderToken = otherRes.body.token;
});

describe('Authentication & Profile Tests', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@test.com',
        password: 'password123'
      });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.name).toBe('Alice Rider');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@test.com',
        password: 'wrongpassword'
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid');
  });

  it('should update profile without corrupting password (pre-save fix)', async () => {
    // 1. Update profile name
    const updateRes = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ name: 'Alice Smith' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Alice Smith');

    // 2. Try logging in again with original password to prove hash was NOT double-hashed
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@test.com',
        password: 'password123'
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.name).toBe('Alice Smith');
  });
});

describe('Ride Booking and Driver Workflow Tests', () => {
  it('should allow rider to book a ride with automatic fare calculation', async () => {
    const res = await request(app)
      .post('/api/rides/request')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({
        pickup: {
          coordinates: [77.5946, 12.9716],
          address: 'MG Road, Bangalore'
        },
        dropoff: {
          coordinates: [77.6387, 12.9352],
          address: 'Koramangala 5th Block'
        },
        vehicleType: 'comfort',
        paymentMethod: 'card'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('requested');
    expect(res.body.fare).toBeGreaterThan(0);
    expect(res.body.distance).toBeGreaterThan(0);
    expect(res.body.otpCode).toBeDefined();
  });

  it('should allow driver to view available rides and accept a requested ride', async () => {
    // 1. Rider requests ride
    const reqRes = await request(app)
      .post('/api/rides/request')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({
        pickup: { coordinates: [77.59, 12.97], address: 'Location A' },
        dropoff: { coordinates: [77.62, 12.95], address: 'Location B' },
        vehicleType: 'comfort'
      });
    const rideId = reqRes.body._id;

    // 2. Driver views available rides
    const availRes = await request(app)
      .get('/api/rides/available')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(availRes.status).toBe(200);
    expect(availRes.body.length).toBe(1);

    // 3. Driver accepts the ride
    const acceptRes = await request(app)
      .patch(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'accepted' });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.status).toBe('accepted');
    expect(acceptRes.body.driver._id.toString()).toBe(driverId);
  });

  it('should complete full ride lifecycle: Request -> Accept -> OTP Verify -> Complete -> Rate', async () => {
    // 1. Request
    const createRes = await request(app)
      .post('/api/rides/request')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({
        pickup: { coordinates: [77.59, 12.97], address: 'City Center' },
        dropoff: { coordinates: [77.65, 12.99], address: 'Airport Hub' },
        vehicleType: 'comfort'
      });
    const rideId = createRes.body._id;
    const otpCode = createRes.body.otpCode;

    // 2. Accept
    await request(app)
      .patch(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'accepted' });

    // 3. Verify OTP to start
    const otpRes = await request(app)
      .post(`/api/rides/${rideId}/verify-otp`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ otp: otpCode });
    expect(otpRes.status).toBe(200);
    expect(otpRes.body.ride.status).toBe('in_progress');

    // 4. Complete
    const completeRes = await request(app)
      .patch(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'completed' });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe('completed');
    expect(completeRes.body.paymentStatus).toBe('paid');

    // 5. Rider rates driver
    const rateRes = await request(app)
      .post(`/api/rides/${rideId}/rate`)
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ score: 5, comment: 'Great driver, on time!' });
    expect(rateRes.status).toBe(200);
    expect(rateRes.body.rating.score).toBe(5);
  });

  it('should block unauthorized users from updating or viewing private rides', async () => {
    const createRes = await request(app)
      .post('/api/rides/request')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({
        pickup: { coordinates: [77.59, 12.97] },
        dropoff: { coordinates: [77.65, 12.99] }
      });
    const rideId = createRes.body._id;

    // Another rider tries to view it
    const forbiddenRes = await request(app)
      .get(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${otherRiderToken}`);
    expect(forbiddenRes.status).toBe(403);
  });

  it('should hide otpCode and phone from driver prior to acceptance for privacy & security', async () => {
    // 1. Rider requests ride
    const reqRes = await request(app)
      .post('/api/rides/request')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({
        pickup: { coordinates: [77.5946, 12.9716], address: 'Location A' },
        dropoff: { coordinates: [77.6387, 12.9352], address: 'Location B' },
        vehicleType: 'comfort'
      });
    const rideId = reqRes.body._id;
    expect(reqRes.body.otpCode).toBeDefined();

    // 2. Driver fetches available list - rider phone and OTP must be hidden
    const availRes = await request(app)
      .get('/api/rides/available')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(availRes.status).toBe(200);
    const rideInList = availRes.body.find((r) => r._id === rideId);
    expect(rideInList).toBeDefined();
    expect(rideInList.otpCode).toBeUndefined();
    expect(rideInList.user.phone).toBeUndefined();

    // 3. Driver queries single ride by ID before acceptance - otpCode must be hidden
    const driverViewRes = await request(app)
      .get(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(driverViewRes.status).toBe(200);
    expect(driverViewRes.body.otpCode).toBeUndefined();
  });

  it('should reject invalid or out-of-bounds coordinate values', async () => {
    const invalidRes = await request(app)
      .post('/api/rides/request')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({
        pickup: { coordinates: [77.59, 999.0] }, // Lat > 90
        dropoff: { coordinates: [77.65, 12.99] }
      });
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.message).toContain('coordinate');
  });

  it('should lock out driver verification after 5 failed OTP attempts', async () => {
    const reqRes = await request(app)
      .post('/api/rides/request')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({
        pickup: { coordinates: [77.59, 12.97] },
        dropoff: { coordinates: [77.65, 12.99] }
      });
    const rideId = reqRes.body._id;

    // Accept ride
    await request(app)
      .patch(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'accepted' });

    // Send 5 incorrect attempts
    for (let i = 0; i < 5; i++) {
      const failRes = await request(app)
        .post(`/api/rides/${rideId}/verify-otp`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ otp: '0000' });
      expect(failRes.status).toBe(400);
    }

    // 6th attempt should be locked out (429)
    const lockedRes = await request(app)
      .post(`/api/rides/${rideId}/verify-otp`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ otp: '0000' });
    expect(lockedRes.status).toBe(429);
    expect(lockedRes.body.message).toContain('Too many');
  });

  it('should block non-assigned drivers from updating ride location', async () => {
    const reqRes = await request(app)
      .post('/api/rides/request')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({
        pickup: { coordinates: [77.59, 12.97] },
        dropoff: { coordinates: [77.65, 12.99] }
      });
    const rideId = reqRes.body._id;

    // Driver 2 registers
    const driver2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dave Driver',
        email: 'dave@driver.com',
        password: 'password123',
        phone: '+1-555-0404',
        role: 'driver'
      });
    const driver2Token = driver2Res.body.token;

    // Bob accepts ride
    await request(app)
      .patch(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'accepted' });

    // Dave tries to update Bob's ride location
    const spoofRes = await request(app)
      .post(`/api/rides/${rideId}/location`)
      .set('Authorization', `Bearer ${driver2Token}`)
      .send({ coordinates: [77.60, 12.98] });
    expect(spoofRes.status).toBe(403);
  });

  it('should prevent race conditions on simultaneous acceptance of requested ride', async () => {
    const reqRes = await request(app)
      .post('/api/rides/request')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({
        pickup: { coordinates: [77.59, 12.97] },
        dropoff: { coordinates: [77.65, 12.99] }
      });
    const rideId = reqRes.body._id;

    // Driver 2 registers
    const driver2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Eva Driver',
        email: 'eva@driver.com',
        password: 'password123',
        phone: '+1-555-0505',
        role: 'driver'
      });
    const driver2Token = driver2Res.body.token;

    // Driver 1 accepts
    const firstAccept = await request(app)
      .patch(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'accepted' });
    expect(firstAccept.status).toBe(200);

    // Driver 2 attempts to accept already accepted ride
    const secondAccept = await request(app)
      .patch(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${driver2Token}`)
      .send({ status: 'accepted' });
    expect(secondAccept.status).toBe(400);
    expect(secondAccept.body.message).toContain('already been accepted');
  });
});
