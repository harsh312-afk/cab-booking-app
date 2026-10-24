# 🚖 CabPulse - Real-Time Cab Booking & Dispatch Platform

A production-grade, full-stack real-time urban ride-hailing and fleet dispatch platform engineered with **React**, **Node.js/Express**, **Socket.IO**, **Leaflet Maps**, and **MongoDB**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%2019-61dafb.svg)
![Node](https://img.shields.io/badge/Backend-Node%20Express-green.svg)
![Socket.IO](https://img.shields.io/badge/RealTime-Socket.IO-black.svg)
![Leaflet](https://img.shields.io/badge/Maps-Leaflet%20OSM-brightgreen.svg)
![Tests](https://img.shields.io/badge/Tests-Jest%20Passing-success.svg)

---

## ✨ Features

### 👤 For Riders / Passengers
- **Interactive Leaflet Map**: Visual pickup & dropoff pin placement, draggable markers, and route polyline with real-time distance and ETA.
- **City Hub Presets & GPS Auto-Detect**: One-click selection of major urban hubs (Airports, Railway Terminals, Tech Parks, Malls) plus browser GPS geolocation.
- **Multiple Vehicle Tiers**: Choose between **Auto/Tuk-Tuk**, **Economy Mini**, **Comfort Sedan**, **SUV XL**, and **Luxury Premium** with dynamic distance-based pricing.
- **Live Driver GPS Tracking**: Real-time car movement animation along the route with Socket.IO status updates.
- **4-Digit Safety OTP**: Secure trip start verification code shared between rider and captain.
- **5-Star Rating & Review System**: Post-trip driver feedback and tip options with animated confetti celebration.
- **Digital Trip Invoices**: View and print/download official trip receipts with fare breakdown (Base fare, distance rate, taxes, payment method).

### 🚘 For Driver Partners
- **Live Dispatch Radar**: Real-time incoming ride requests broadcasted via Socket.IO with audio/visual pulse alerts.
- **One-Click Accept & Navigate**: Seamlessly accept open requests and switch straight into live navigation mode.
- **Online / Offline Availability Toggle**: Instant status toggle to control when incoming ride broadcasts are received.
- **OTP Verification Pad**: Enter the rider's 4-digit PIN to securely unlock and begin the trip.
- **Driver Earnings & Stats Dashboard**: Live metrics for total earnings, completed trips, average star rating, and active rides.
- **Vehicle Profile Management**: Update vehicle make/model, license plate number, and category tier.

---

## 🛠️ Architecture & Tech Stack

```
cab-booking-app/
├── backend/
│   ├── models/
│   │   ├── User.js          # User, Driver, Vehicle schema with password hashing
│   │   └── Ride.js          # Ride lifecycle, coordinates, OTP, fare, ratings
│   ├── middleware/
│   │   └── auth.js          # JWT verification & role-based access control
│   ├── routes/
│   │   ├── auth.js          # Auth, driver status, metrics, profile endpoints
│   │   └── rides.js         # Ride booking, acceptance, OTP verify, rating, location
│   ├── tests/
│   │   └── rides.test.js    # Comprehensive Jest + Supertest integration suite
│   ├── server.js            # Express + HTTP + Socket.IO server with in-memory Mongo fallback
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # Login & Register with role switcher & demo fills
│   │   │   ├── rides/       # BookRide, AvailableRides, MyRides, RideDetails
│   │   │   ├── Home.js      # Role-specific dashboard & landing showcase
│   │   │   ├── Navbar.js    # Navigation with driver status & user badge
│   │   │   └── Profile.js   # Account and vehicle details editor
│   │   ├── context/         # AuthContext state management
│   │   ├── services/        # Axios API & Socket.IO client instances
│   │   ├── App.css          # Glassmorphism & dark-mode styling system
│   │   └── index.js
│   └── package.json
├── netlify.toml             # Netlify SPA redirect rules
├── render.yaml              # Render deployment configuration
└── package.json             # Root runner scripts
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB** (Optional: the backend automatically initializes an in-memory database if a local Mongo server is not running)

### 1. Installation
Clone the repository and install dependencies for both backend and frontend:

```bash
# Clone repository
git clone git@github.com:harsh312-afk/cab-booking-app.git
cd cab-booking-app

# Install all dependencies
npm run install:all
```

### 2. Configure Environment Variables
Copy the example environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Run Development Servers
Start both backend and frontend:

```bash
# Start backend (Port 5000)
npm run dev:backend

# In a separate terminal, start frontend (Port 3000)
npm run dev:frontend
```

Open `http://localhost:3000` in your browser.

---

## 🧪 Automated Testing

Run the full end-to-end automated test suite across backend and frontend:

```bash
# Run both backend and frontend test suites
npm test

# Run backend integration tests only
npm run test:backend

# Run frontend React component tests only
npm run test:frontend
```

**Test Coverage Summary (20 Automated Tests):**
- ✅ User & Driver registration with vehicle details & password policy validation
- ✅ Password hashing & pre-save hook integrity verification
- ✅ Ride request creation with automatic Haversine distance & tiered fare calculation
- ✅ Driver discovery and unassigned ride acceptance
- ✅ Full ride lifecycle (`requested` ➔ `accepted` ➔ `in_progress` ➔ `completed`)
- ✅ 4-Digit OTP verification before starting ride
- ✅ Post-ride driver ratings and feedback calculation
- ✅ Role-based access control and unauthorized route protection
- ✅ Privacy protection: Rider phone number hidden from available requests list prior to acceptance
- ✅ Security sanitization: OTP PIN hidden from drivers & public broadcasts (rider only)
- ✅ Anti-brute force: Driver OTP verification lockout after 5 failed attempts
- ✅ Concurrency protection: Atomic prevention of double-acceptance race conditions
- ✅ Unauthorized spoofing protection on live driver coordinates
- ✅ Coordinate boundary validation (-90° to 90° latitude, -180° to 180° longitude)
- ✅ Frontend App brand, landing hero, and authentication navigation rendering
- ✅ Frontend Login and Register role toggles and interactive demo credential buttons

---

## 📡 API Reference

### Authentication & Driver Portal
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new Rider or Driver with vehicle specs |
| `POST` | `/api/auth/login` | Public | Authenticate user and return JWT token |
| `GET` | `/api/auth/profile` | Private | Retrieve authenticated user profile |
| `PUT` | `/api/auth/profile` | Private | Update name, phone, password, or vehicle details |
| `PUT` | `/api/auth/driver-status` | Driver | Toggle online/offline status and update GPS coordinates |
| `GET` | `/api/auth/stats` | Private | Retrieve dashboard metrics (earnings, rides, rating) |
| `GET` | `/api/auth/drivers` | Private | List active and available drivers |

### Ride Management & Real-Time Tracking
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/rides/request` | Private | Request a new ride with pickup, dropoff & vehicle tier |
| `GET` | `/api/rides/available` | Driver | List open ride requests waiting for driver pickup |
| `GET` | `/api/rides` | Private | List ride history for logged-in user or driver |
| `GET` | `/api/rides/:id` | Private | Get single ride details and live GPS status |
| `PATCH` | `/api/rides/:id` | Private | Transition ride status (`accepted`, `in_progress`, `completed`, `cancelled`) |
| `POST` | `/api/rides/:id/verify-otp` | Driver | Verify passenger 4-digit PIN to start ride |
| `POST` | `/api/rides/:id/rate` | Rider | Submit 1-5 star rating and comment for completed trip |
| `POST` | `/api/rides/:id/location` | Driver | Push live vehicle coordinate updates to passengers |

---

## 🌐 Real-Time Socket.IO Events

| Event Name | Direction | Payload / Purpose |
|---|---|---|
| `join_ride` | Client ➔ Server | Subscribe to room `ride_{id}` for live trip updates |
| `leave_ride` | Client ➔ Server | Leave ride room |
| `new_ride_alert` | Server ➔ Drivers | Broadcast newly requested ride to all active captains |
| `ride_status_updated_{id}` | Server ➔ Room | Notify rider/driver of status changes (`accepted`, `in_progress`, `completed`) |
| `driver_location_{id}` | Server ➔ Room | Broadcast live latitude/longitude car movement |

---

## 🚢 Deployment

### Frontend (Netlify / Vercel)
The repository includes `netlify.toml` pre-configured with SPA route redirection (`/*` ➔ `/index.html`) so refreshing deep routes never returns 404.

```bash
cd frontend && npm run build
```

### Backend (Render / Fly.io / Railway / Heroku)
The repository includes `render.yaml` with pre-defined environment variables and database bindings.

---

## 📄 License
This project is licensed under the MIT License.
