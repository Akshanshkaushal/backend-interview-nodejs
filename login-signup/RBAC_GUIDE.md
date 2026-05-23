# RBAC (Role-Based Access Control) Implementation Guide

## Overview

This authentication system now includes **Role-Based Access Control (RBAC)** with three user roles:

1. **user** (Normal User) - Default role, can only access their own profile
2. **admin** - Can view all users and dashboard stats
3. **superadmin** - Full access, can manage users, assign roles, deactivate accounts

---

## Database Schema Changes

### User Model with Role Field

```javascript
// Added to User Schema
{
  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user",
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}
```

**Default role assignment:** Every new user registered gets `role: "user"`

---

## Middleware Implementation

### 1. **verifyToken** Middleware
Authenticates the user via JWT token.

```javascript
Usage: app.get("/route", verifyToken, handler)

How it works:
- Extracts token from Authorization header
- Verifies JWT signature using secret key
- Adds userId to req object
- Allows request to proceed if valid
```

### 2. **authorize** Middleware
Checks if user has required role(s).

```javascript
Usage: app.get("/route", verifyToken, authorize("admin"), handler)

How it works:
- Must come AFTER verifyToken
- Fetches user from database
- Checks if user's role is in allowed roles
- Returns 403 Forbidden if role doesn't match
```

---

## Authentication Flow

### Step 1: User Registration (Signup)
```javascript
POST /api/auth/signup
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}

Response:
{
  "success": true,
  "data": {
    "userId": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",  // ⬅️ Default role
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Step 2: User Login
```javascript
POST /api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "userId": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",  // ⬅️ User's current role
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Step 3: Access Protected Route
```javascript
GET /api/auth/profile
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}

Flow:
verifyToken → Checks token → Extracts userId → Allows request
```

### Step 4: Access Admin Route
```javascript
GET /api/admin/users
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}

Flow:
verifyToken → authorize("admin", "superadmin") → Checks role → Allows if admin/superadmin
```

---

## Route Protection Examples

### Public Routes (No Authentication Needed)
```javascript
POST /api/auth/signup        // Register new user
POST /api/auth/login         // Login user
```

### Protected Routes (Authentication + Any Role)
```javascript
GET /api/auth/profile        // User account required
// Middleware: verifyToken
```

### Admin Routes (Authentication + Admin/SuperAdmin)
```javascript
GET /api/admin/users         // View all users
GET /api/admin/dashboard/stats  // View dashboard stats
// Middleware: verifyToken, authorize("admin", "superadmin")
```

### SuperAdmin Only Routes (Authentication + SuperAdmin)
```javascript
PUT /api/admin/users/:userId/role      // Change user role
PUT /api/admin/users/:userId/deactivate // Deactivate user
DELETE /api/admin/users/:userId        // Delete user
// Middleware: verifyToken, authorize("superadmin")
```

---

## Complete Admin API Reference

### 1. Get Dashboard Statistics
```javascript
GET /api/admin/dashboard/stats
Authorization: Bearer <token>
Role Required: admin, superadmin

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

### 2. Get All Users
```javascript
GET /api/admin/users
Authorization: Bearer <token>
Role Required: admin, superadmin

Response: Array of all users (password excluded)
```

### 3. Get User by ID
```javascript
GET /api/admin/users/:userId
Authorization: Bearer <token>
Role Required: admin, superadmin

Response: Single user object
```

### 4. Update User Role (SuperAdmin Only)
```javascript
PUT /api/admin/users/:userId/role
Authorization: Bearer <token>
Role Required: superadmin

Body: {
  "role": "admin"  // "user" | "admin" | "superadmin"
}

Response: Updated user object
```

### 5. Deactivate Account (SuperAdmin Only)
```javascript
PUT /api/admin/users/:userId/deactivate
Authorization: Bearer <token>
Role Required: superadmin

Response: Updated user with isActive: false
Note: User cannot login when deactivated
```

### 6. Activate Account (SuperAdmin Only)
```javascript
PUT /api/admin/users/:userId/activate
Authorization: Bearer <token>
Role Required: superadmin

Response: Updated user with isActive: true
```

### 7. Delete User (SuperAdmin Only)
```javascript
DELETE /api/admin/users/:userId
Authorization: Bearer <token>
Role Required: superadmin

Response: Confirmation of deletion
Note: Cannot delete your own account
```

---

## Practical Examples

### Example 1: Assign Admin Role to User

**Step 1: Login as SuperAdmin**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "data": {
    "userId": "superadmin_id",
    "role": "superadmin",
    "token": "super_admin_token_here"
  }
}
```

**Step 2: Update User Role to Admin**
```bash
curl -X PUT http://localhost:5000/api/admin/users/user_id/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer super_admin_token_here" \
  -d '{"role": "admin"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "name": "John Doe",
    "role": "admin"  // ⬅️ Updated!
  }
}
```

### Example 2: Deactivate User Account

```bash
curl -X PUT http://localhost:5000/api/admin/users/user_id/deactivate \
  -H "Authorization: Bearer super_admin_token_here"
```

**After deactivation:**
- User cannot login
- User's requests will be rejected with "account deactivated" message
- Can be reactivated anytime

### Example 3: Access Denied Scenario

**Regular user tries to access admin route:**
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer user_token_here"
```

**Response:**
```json
{
  "success": false,
  "message": "Access denied. Required role(s): admin, superadmin. Your role: user"
}
```

**Status Code: 403 Forbidden**

---

## Authorization Logic Flowchart

```
Request arrives
    ↓
Check Authorization header (verifyToken)
    ├─ NO TOKEN → 401 Unauthorized
    ├─ INVALID TOKEN → 401 Unauthorized
    ↓
GET USER FROM DATABASE (authorize)
    ├─ USER NOT FOUND → 404 Not Found
    ├─ USER INACTIVE → 403 Forbidden
    ↓
CHECK ROLE
    ├─ ROLE NOT ALLOWED → 403 Forbidden
    ↓
REQUEST ALLOWED ✅ → Continue to handler
```

---

## Security Features

1. **Password Hashing** - Bcrypt with 10-round salt
2. **JWT Expiry** - Tokens expire in 7 days
3. **Role Verification** - Checked on every admin request
4. **Account Deactivation** - Prevents inactive user access
5. **Self-Delete Prevention** - SuperAdmin cannot delete own account
6. **Token Validation** - Invalid tokens rejected
7. **Database-Level Checks** - Role verified from DB, not token

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install bcrypt jsonwebtoken mongoose express dotenv
```

### 2. Create First SuperAdmin (Manual in MongoDB)
```javascript
// Connect to MongoDB and create a superadmin user manually:
db.users.insertOne({
  name: "Super Admin",
  email: "superadmin@example.com",
  password: "$2b$10$...", // Use bcrypt hashed password
  role: "superadmin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or create via API with manual role update in database.

### 3. Use Admin Routes
SuperAdmin can now manage all other users via API.

---

## Best Practices

✅ Always use `verifyToken` before `authorize`  
✅ Check `isActive` status in middleware (already implemented)  
✅ Never trust role from token alone - fetch from DB  
✅ Use specific roles when possible (superadmin for sensitive operations)  
✅ Log admin actions for audit trail  
✅ Validate input before updating roles  
✅ Prevent self-deletion of superadmin accounts  
✅ Use HTTPS in production for token transmission  

---

## Testing the System

See the complete testing guide in the README.md file.
