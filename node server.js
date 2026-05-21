// Step 1: Import http module
const http = require("http");

// Step 2: Create server
const server = http.createServer((req, res) => {

    // Step 3: Send response
    res.write("Hello World");

    // Step 4: End response
    res.end();
});

// Step 5: Start server
server.listen(3000, () => {
    console.log("Server running on port 3000");
});