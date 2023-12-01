require('dotenv').config()

const express = require('express');
const workoutRoutes = require('./routes/workouts')
// const mongoose = require('mongoose');

// express app
const app = express();

// Middleware
app.use(express.json());

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})
// app.use(cors());

// Connect to MongoDB
// mongoose.connect("mongodb+srv://admin:admin123@hms.ofgfn7a.mongodb.net/test");

// Define a route
app.use('/thomas/workouts', workoutRoutes)

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running`, process.env.PORT);
});

