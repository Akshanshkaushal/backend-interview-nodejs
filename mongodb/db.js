//  (Singleton MongoDB Connection)

// Step 1: Import mongoose
const mongoose = require("mongoose");

// Step 2: Create connection function
const connectDB = async () => {

    try {

        // Step 3: Connect database
        await mongoose.connect("mongodb://127.0.0.1:27017/test");

        console.log("MongoDB Connected");

    } catch (error) {

        console.log(error);

        process.exit(1);
    }
};

// Step 4: Export connection
module.exports = connectDB;