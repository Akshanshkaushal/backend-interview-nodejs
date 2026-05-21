# Task Allocation System

A simple task allocation system built with Express and MongoDB. Users can allocate tasks to others and track task status.

## Features

- **User Management**: Create and manage users
- **Task Allocation**: Allocate tasks to users
- **Task Tracking**: Tasks have three states (todo, progress, done)
- **View Tasks**: 
  - See all tasks assigned to you
  - See all tasks you allocated
  - See all tasks in the system

## Project Structure

```
task allocation/
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── User.js            # User schema
│   └── Task.js            # Task schema
├── controllers/
│   ├── userController.js  # User business logic
│   └── taskController.js  # Task business logic
├── routes/
│   ├── userRoutes.js      # User endpoints
│   └── taskRoutes.js      # Task endpoints
├── utils/
│   └── helpers.js         # Utility functions
├── app.js                 # Main Express app
└── package.json
```

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# For development (with auto-reload)
npm run dev
```

## API Endpoints

### Users

#### 1. Create User
```
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Get All Users
```
GET /api/users
```

#### 3. Get User by ID
```
GET /api/users/:id
```

---

### Tasks

#### 1. Create Task (Allocate to User)
```
POST /api/tasks
Content-Type: application/json

{
  "title": "Design Homepage",
  "description": "Create mockups for the new homepage",
  "allocatedBy": "507f1f77bcf86cd799439011",
  "allocatedTo": "507f1f77bcf86cd799439012",
  "dueDate": "2024-02-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "title": "Design Homepage",
    "description": "Create mockups for the new homepage",
    "status": "todo",
    "allocatedBy": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Manager",
      "email": "manager@example.com"
    },
    "allocatedTo": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "dueDate": "2024-02-01",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Get My Tasks (Tasks Assigned to Me)
```
GET /api/tasks/my-tasks/:userId
```

#### 3. Get Tasks Allocated by Me
```
GET /api/tasks/allocated-by/:userId
```

#### 4. Get All Tasks (Admin View)
```
GET /api/tasks/all
```

#### 5. Get Specific Task
```
GET /api/tasks/:taskId
```

#### 6. Update Task Status
```
PUT /api/tasks/:taskId
Content-Type: application/json

{
  "status": "progress"
}
```

**Status options:** `todo`, `progress`, `done`

#### 7. Delete Task
```
DELETE /api/tasks/:taskId
```

---

## Example Usage (Interview Friendly)

### Step 1: Create Two Users
```bash
# User 1 - Manager
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Manager",
    "email": "alice@company.com",
    "role": "manager"
  }'

# User 2 - Developer
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Developer",
    "email": "bob@company.com",
    "role": "user"
  }'
```

### Step 2: Alice Allocates a Task to Bob
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix Login Bug",
    "description": "Debug authentication flow",
    "allocatedBy": "alice_id",
    "allocatedTo": "bob_id",
    "dueDate": "2024-01-20"
  }'
```

### Step 3: Bob Checks His Tasks
```bash
curl -X GET http://localhost:5000/api/tasks/my-tasks/bob_id
```

### Step 4: Bob Changes Task Status to Progress
```bash
curl -X PUT http://localhost:5000/api/tasks/task_id \
  -H "Content-Type: application/json" \
  -d '{"status": "progress"}'
```

### Step 5: Alice Checks Tasks She Allocated
```bash
curl -X GET http://localhost:5000/api/tasks/allocated-by/alice_id
```

---

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  role: String (enum: ["user", "manager"]),
  createdAt: Date,
  updatedAt: Date
}
```

### Task Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  status: String (enum: ["todo", "progress", "done"]),
  allocatedBy: ObjectId (ref: User),
  allocatedTo: ObjectId (ref: User),
  dueDate: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Key Concepts (Interview Points)

1. **Separation of Concerns**: Models, Controllers, Routes, Utils are separate
2. **RESTful API**: Follows REST conventions
3. **Error Handling**: Centralized error handling with helper functions
4. **Validation**: Input validation before database operations
5. **Database Relationships**: Users referenced in Tasks (One-to-Many)
6. **Async/Await**: Modern async patterns used throughout
7. **Response Format**: Consistent JSON response structure

---

## Notes

- Make sure MongoDB is running on `localhost:27017`
- Change the database name in `config/db.js` if needed
- Use `nodemon` for development for auto-reload on file changes
