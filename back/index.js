require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserModel = require('./models/Users')

// express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://admin:admin123@hms.ofgfn7a.mongodb.net/test");

// Define a route
app.get('/', (req, res) => {
    res.json({mssg: 'Welcome bro'})
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running`);
});

