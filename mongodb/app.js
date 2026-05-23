// Step 1: Import express
const express = require("express");

// Step 2: Import DB connection
const connectDB = require("./db");

// Step 3: Create app
const app = express();

// Middleware
app.use(express.json());

// Step 4: Connect Database
connectDB();

// Route
app.get("/", (req, res) => {
    res.send("Server Running");
});

// Step 5: Start server
app.listen(3000, () => {
    console.log("Server Started");
});
