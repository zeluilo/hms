require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connection = require('./database');
const DatabaseTable = require('./classes/DatabaseTable');

const patientController = require('./controller/ReceptionistController');
const adminController = require('./controller/AdminController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Connect to Port
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

// Import controllers
app.use('/thomas', patientController);
app.use('/thomas', adminController);

// Add other routes...
