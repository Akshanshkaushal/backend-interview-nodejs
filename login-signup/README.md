# Login/Signup Authentication System with RBAC

A production-grade Express authentication system with **JWT tokens**, **bcrypt password hashing**, **MongoDB**, and **Role-Based Access Control (RBAC)**.

## Features

- ✅ User registration with validation
- ✅ User login with password verification
- ✅ JWT token-based authentication
- ✅ Bcrypt password hashing with salt (10 rounds)
- ✅ Protected routes with middleware
- ✅ **Role-Based Access Control (RBAC)** with 3 roles
- ✅ Admin dashboard and user management
- ✅ User activation/deactivation
- ✅ Password strength validation
- ✅ Email validation
- ✅ Comprehensive error handling

## User Roles

Three predefined roles with different permission levels:

| Role | Permissions | Description |
|------|-------------|-------------|
| **user** | View own profile | Default role, normal user |
| **admin** | View all users, dashboard stats | Can see but not modify |
| **superadmin** | Full control | Can assign roles, deactivate, delete users |

## Project Structure

```
├── config/
│   └── db.js                      # MongoDB connection
├── controllers/
│   ├── authController.js          # Auth business logic (signup, login)
│   └── adminController.js         # Admin functions (user management)
├── middleware/
│   └── auth.js                    # JWT & RBAC middleware
├── models/
│   └── User.js                    # User schema with role, bcrypt
├── routes/
│   ├── authRoutes.js              # Auth endpoints
│   └── adminRoutes.js             # Admin endpoints
├── utils/
│   └── helpers.js                 # Helper functions
├── app.js                         # Express app setup
├── package.json                   # Dependencies
├── README.md                      # This file
├── RBAC_GUIDE.md                  # Detailed RBAC implementation
└── .env.example                   # Environment template
```

## Installation

1. **Install dependencies:**
   ```bash
   cd login-signup
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   ```

3. **Configure .env:**
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/login-signup
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

4. **Start server:**
   ```bash
   npm run dev    # Development with nodemon
   npm start      # Production
   ```

Server runs on `http://localhost:5000`

---

## Authentication API

### 1. **Signup (Register)**
```
POST /api/auth/signup
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePass123",
  "confirmPassword": "securePass123"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. **Login**
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "john@example.com",
  "password": "securePass123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 3. **Get Profile** (Protected)
```
GET /api/auth/profile
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-15T...",
    "updatedAt": "2024-01-15T..."
  }
}
```

---

## RBAC Admin API

### Admin Panel Routes

All admin routes require authentication + proper role permission.

**Middleware Chain:** `verifyToken` → `authorize("role")`

#### 1. **Dashboard Statistics** (Admin, SuperAdmin)
```
GET /api/admin/dashboard/stats
Authorization: Bearer <admin_or_superadmin_token>

Response:
{
  "success": true,
  "data": {
    "totalUsers": 10,
    "adminUsers": 2,
    "superAdminUsers": 1,
    "regularUsers": 7,
    "activeUsers": 9,
    "inactiveUsers": 1,
    "roleDistribution": {
      "superadmin": 1,
      "admin": 2,
      "user": 7
    },
    "statusDistribution": {
      "active": 9,
      "inactive": 1
    }
  }
}
```

#### 2. **Get All Users** (Admin, SuperAdmin)
```
GET /api/admin/users
Authorization: Bearer <admin_or_superadmin_token>

Response:
{
  "success": true,
  "totalUsers": 10,
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true
    },
    ...
  ]
}
```

#### 3. **Get User by ID** (Admin, SuperAdmin)
```
GET /api/admin/users/:userId
Authorization: Bearer <admin_or_superadmin_token>

Response: Single user object
```

#### 4. **Update User Role** (SuperAdmin Only)
```
PUT /api/admin/users/:userId/role
Authorization: Bearer <superadmin_token>

Body:
{
  "role": "admin"
}

Allowed roles: "user" | "admin" | "superadmin"

Response:
{
  "success": true,
  "message": "User role updated to admin",
  "data": { user object with updated role }
}
```

#### 5. **Deactivate User** (SuperAdmin Only)
```
PUT /api/admin/users/:userId/deactivate
Authorization: Bearer <superadmin_token>

Response:
{
  "success": true,
  "message": "User account deactivated",
  "data": { user with isActive: false }
}

Effect: User cannot login
```

#### 6. **Activate User** (SuperAdmin Only)
```
PUT /api/admin/users/:userId/activate
Authorization: Bearer <superadmin_token>

Response:
{
  "success": true,
  "message": "User account activated",
  "data": { user with isActive: true }
}
```

#### 7. **Delete User** (SuperAdmin Only)
```
DELETE /api/admin/users/:userId
Authorization: Bearer <superadmin_token>

Response:
{
  "success": true,
  "message": "User deleted successfully",
  "data": { "deletedUserId": "..." }
}

Note: Cannot delete your own account
```

---

## How RBAC Works

### Authentication vs Authorization

| Concept | Definition | Implementation |
|---------|-----------|----------------|
| **Authentication** | *Who are you?* | JWT token verification |
| **Authorization** | *What can you do?* | Role-based middleware |

### Request Flow with RBAC

```
1. Client sends request with token
   ↓
2. verifyToken checks JWT signature
   ├─ Invalid? → Return 401
   ├─ Valid? → Extract userId
   ↓
3. authorize("role") checks user's role
   ├─ Fetch user from DB
   ├─ Check isActive
   ├─ Check role matches allowed
   ├─ Not allowed? → Return 403
   ├─ Allowed? → Continue
   ↓
4. Handler executes with full access
```

### Middleware Examples

**Regular User Route:**
```javascript
app.get("/api/auth/profile", 
  verifyToken,  // Authentication
  getProfile
);
```

**Admin Route:**
```javascript
app.get("/api/admin/users",
  verifyToken,                        // Authentication
  authorize("admin", "superadmin"),   // Authorization
  getAllUsers
);
```

**SuperAdmin-Only Route:**
```javascript
app.put("/api/admin/users/:userId/role",
  verifyToken,           // Authentication
  authorize("superadmin"),  // Authorization
  updateUserRole
);
```

---

## Security Implementation

### Password Security
- 🔒 **10-round bcrypt salt** generated automatically
- 🔒 **Pre-save Mongoose hook** hashes before DB storage
- 🔒 **Safe comparison** via `bcrypt.compare()`
- 🔒 **isModified() check** prevents re-hashing

### JWT Security
- 🔒 **Expiration:** 7 days
- 🔒 **Secret key** stored in environment variables
- 🔒 **User role included** in token payload
- 🔒 **Database verification** of role (not trusted from token alone)

### Access Control
- 🔒 **Account deactivation** blocks all access
- 🔒 **Role validation** on every admin request
- 🔒 **Self-delete prevention** for superadmins
- 🔒 **Proper HTTP status codes** (401, 403, 404)

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": "Detailed technical error (development only)"
}
```

### Common Status Codes

| Code | Scenario |
|------|----------|
| **200** | Success |
| **201** | Resource created (signup) |
| **400** | Validation error, missing fields |
| **401** | Missing/invalid token |
| **403** | Insufficient permissions |
| **404** | User/resource not found |
| **500** | Server error |

---

## Testing with Postman

### 1. Create Test Users

**Signup as regular user:**
```
POST http://localhost:5000/api/auth/signup
{
  "name": "John User",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```
Save the token → Create .env variable `USER_TOKEN`

**Signup as admin:**
```
POST http://localhost:5000/api/auth/signup
{
  "name": "Jane Admin",
  "email": "admin@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```
Save the token → Create .env variable `ADMIN_TOKEN`

### 2. Update Roles (Need SuperAdmin)

For testing, manually set roles in MongoDB:
```javascript
// Connect to MongoDB
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
);

db.users.updateOne(
  { email: "superadmin@example.com" },
  { $set: { role: "superadmin" } }
);
```

### 3. Test Routes

**User can access own profile:**
```
GET /api/auth/profile
Authorization: Bearer {{USER_TOKEN}}
✅ Success
```

**User cannot access admin route:**
```
GET /api/admin/users
Authorization: Bearer {{USER_TOKEN}}
❌ 403 Forbidden
```

**Admin can view users:**
```
GET /api/admin/users
Authorization: Bearer {{ADMIN_TOKEN}}
✅ Success
```

**Admin cannot change roles:**
```
PUT /api/admin/users/:userId/role
Authorization: Bearer {{ADMIN_TOKEN}}
Body: { "role": "admin" }
❌ 403 Forbidden
```

**SuperAdmin can do everything:**
```
PUT /api/admin/users/:userId/role
Authorization: Bearer {{SUPERADMIN_TOKEN}}
Body: { "role": "admin" }
✅ Success
```

---

## Best Practices Implemented

✅ **Separation of Concerns** - MVC pattern with controllers, models, middleware  
✅ **Input Validation** - Email regex, password strength, required fields  
✅ **Password Security** - Bcrypt 10-round salt, never stored plain  
✅ **Token Verification** - JWT with expiry, signature validation  
✅ **Role-Based Access** - Database-verified roles, not token-based  
✅ **Account Status** - isActive flag for deactivation/suspension  
✅ **Error Handling** - Consistent responses, proper HTTP codes  
✅ **Middleware Chain** - Proper ordering (auth → auth → handler)  
✅ **Self-Deletion Prevention** - SuperAdmin cannot delete self  
✅ **Code Documentation** - Comments explaining key logic  

---

## Detailed RBAC Guide

See **[RBAC_GUIDE.md](RBAC_GUIDE.md)** for:
- Complete authorization flow diagrams
- Advanced middleware patterns
- Real-world usage examples
- Troubleshooting guide
- Database schema details

---

## Future Enhancements

- [ ] Permission-based system (finer control)
- [ ] Audit logging (track admin actions)
- [ ] 2FA/MFA support
- [ ] Refresh tokens
- [ ] Password reset flow
- [ ] Email verification
- [ ] Rate limiting
- [ ] Session management

---

## License

ISC

