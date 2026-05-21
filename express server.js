const express = require("express");
const app = express();

// Middleware express.json() is middleware used to parse incoming JSON request body into JavaScript object.
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.send("GET Request");
});

app.post("/user", (req, res) => {
    res.json(req.body);
});

// Server
app.listen(3000, () => {
    console.log("Server started");
});