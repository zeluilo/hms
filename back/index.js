require('dotenv').config()

const express = require('express');
const mongoose = require('mongoose');
const workoutRoutes = require('./routes/workouts')

// express app
const app = express();

// Middleware
app.use(express.json());

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})
// app.use(cors());


// Define a route
app.use('/thomas/workouts', workoutRoutes)

// Connect to MongoDB
mongoose.connect(process.env.MONG_URI)
    .then(() => {
        // Start the server
        app.listen(process.env.PORT, () => {
            console.log(`Connected to db & Server is running`, process.env.PORT);
        });  
    })
    .catch((error) => {
        console.log(error)
    })


