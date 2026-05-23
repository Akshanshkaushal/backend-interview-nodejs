# Login/Signup Authentication System

A production-grade Express authentication system with JWT tokens, bcrypt password hashing, and MongoDB.

## Features

- ✅ User registration with validation
- ✅ User login with password verification
- ✅ JWT token-based authentication
- ✅ Bcrypt password hashing with salt
- ✅ Protected routes
- ✅ Password strength validation
- ✅ Email validation
- ✅ Error handling

## Project Structure

```
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   └── authController.js     # Auth business logic
├── middleware/
│   └── auth.js               # JWT verification
├── models/
│   └── User.js               # User schema with bcrypt
├── routes/
│   └── authRoutes.js         # API endpoints
├── utils/
│   └── helpers.js            # Helper functions
├── app.js                    # Express app setup
├── package.json              # Dependencies
└── README.md                 # Documentation
```

## Installation

1. **Clone and setup:**
   ```bash
   cd login-signup
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   ```

3. **Update .env with your MongoDB URI:**
   ```
   MONGO_URI=mongodb://localhost:27017/login-signup
   JWT_SECRET=your-secret-key
   ```

## Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server starts on `http://localhost:5000`

## API Endpoints

### 1. **Signup**
- **URL:** `POST /api/auth/signup`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "userId": "65abc123def456ghi789jkl0",
      "name": "John Doe",
      "email": "john@example.com",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 2. **Login**
- **URL:** `POST /api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "Password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "userId": "65abc123def456ghi789jkl0",
      "name": "John Doe",
      "email": "john@example.com",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 3. **Get Profile** (Protected)
- **URL:** `GET /api/auth/profile`
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
      "_id": "65abc123def456ghi789jkl0",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
  ```

## Key Implementation Details

### Password Security
- **Bcrypt Salting:** Automatically generates salt with 10 rounds
- **Pre-save Hook:** Hashes password before storing in database
- **Comparison Method:** `comparePassword()` safely compares plaintext with hash

### JWT Authentication
- **Token Expiry:** 7 days
- **Payload:** userId, email, name
- **Verification:** Middleware checks token validity

### Validation
- Email format validation using regex
- Password minimum length requirement (6 characters)
- Unique email constraint on database level
- Input sanitization

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Testing with Postman

1. **Signup:** Send POST request with user data
2. **Copy token** from response
3. **Login:** Send POST request with credentials
4. **Get Profile:** Use token in Authorization header as `Bearer <token>`

## Best Practices Implemented

✅ Separation of concerns (MVC pattern)
✅ Input validation and sanitization
✅ Error handling with proper status codes
✅ Security-first approach with bcrypt
✅ JWT for stateless authentication
✅ Middleware for protected routes
✅ Descriptive error messages
✅ Code comments for clarity
✅ Scalable structure for adding features
