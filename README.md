# Cab Booking Application

A full-stack cab booking application built with:

- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React, React Router
- **Authentication**: JWT-based authentication
- **Real-time features**: Ride booking, tracking, and management

## Features

### For Users (Riders)
- User registration and login
- Profile management
- Book rides with pickup and dropoff locations
- View ride history
- Track ride status (requested, accepted, in progress, completed, cancelled)

### For Drivers
- Driver registration and login
- View available ride requests
- Accept ride requests
- Update ride status (start, complete, cancel)
- View assigned rides

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose ODM
- JWT (JSON Web Tokens) for authentication
- Bcryptjs for password hashing
- CORS middleware

### Frontend
- React.js
- React Router for client-side routing
- Context API for state management
- Axios for HTTP requests
- CSS3 for styling

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `GET /api/auth/drivers` - Get all drivers (protected)

### Rides
- `POST /api/rides/request` - Request a new ride (protected, user)
- `GET /api/rides` - Get user's rides (protected)
- `GET /api/rides/:id` - Get ride by ID (protected)
- `PATCH /api/rides/:id` - Update ride status (protected)
- `GET /api/rides/available` - Get available rides for drivers (protected, driver)

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or provide a connection string)
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from example):
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file to set:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/cabbookingdb
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   ```

4. Start the server:
   ```bash
   npm start
   ```
   The backend will run on `http://localhost:5000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## Environment Variables

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/cabbookingdb |
| JWT_SECRET | Secret key for JWT signing | your_secret_key_here |

### Frontend (.env)
Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Project Structure

```
cab-booking-app/
├── backend/
│   ├── controllers/
│   ├── models/
│   │   ├── User.js
│   │   └── Ride.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── rides.js
│   ├── middleware/
│   │   └── auth.js
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   └── Register.js
│   │   │   ├── rides/
│   │   │   │   ├── BookRide.js
│   │   │   │   ├── RideDetails.js
│   │   │   │   ├── MyRides.js
│   │   │   │   └── AvailableRides.js
│   │   │   ├── Navbar.js
│   │   │   ├── Home.js
│   │   │   └── Profile.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── .env
│   └── package.json
└── README.md
```

## How It Works

1. **User Registration/Login**: Users can register as either a rider or driver and login to get a JWT token.

2. **Booking a Ride**: Riders can book rides by providing pickup and dropoff coordinates. The ride is stored in the database with status "requested".

3. **Driver Dashboard**: Drivers can view available ride requests (status: "requested") and accept them.

4. **Ride Tracking**: Once accepted, drivers can update the ride status to "in progress" when they start the ride and "completed" when they finish.

5. **Ride History**: Both riders and drivers can view their ride history with details.

## Security Features

- Passwords are hashed using bcryptjs before storing in database
- JWT-based authentication with expiration
- Protected routes that require valid authentication tokens
- Role-based access control (users vs drivers)
- Input validation on all API endpoints

## Future Enhancements

1. **Real-time updates**: Implement WebSocket connections for live ride tracking
2. **Payment integration**: Add payment processing for completed rides
3. **Rating system**: Allow users to rate drivers and vice versa
4. **Geocoding**: Convert addresses to coordinates automatically
5. **Push notifications**: Send updates to users about ride status
6. **Admin panel**: Administrative features for managing users and rides
7. **Rating and reviews**: Allow riders to rate drivers and leave feedback
8. **Promo codes**: Implement discount and promo code system
9. **Multiple vehicle types**: Support for different vehicle categories (economy, premium, etc.)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- MongoDB for the flexible document database
- Express.js for the robust backend framework
- React.js for the powerful frontend library
- JWT for secure authentication
- All open-source contributors whose work made this project possible