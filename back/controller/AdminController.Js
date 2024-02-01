// Import necessary modules
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const moment = require("moment");
const jwt = require('jsonwebtoken');
// const { checkLogin } = require('./middleware'); // Assuming you have middleware for checking login status

const DatabaseTable = require('../classes/DatabaseTable');

// Single Table
const userTable = new DatabaseTable('users', 'pId');

const formatDate = (dateString) => {
    // Assuming dateString is in a different format, adjust the parsing accordingly
    const dateObject = new Date(dateString);
    const formattedDate = dateObject.toISOString().split('T')[0];
    return formattedDate;
};

const formatDateForInput = (dateString) => {
    const dateObject = new Date(dateString);
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const day = String(dateObject.getDate()).padStart(2, '0');
    const hours = String(dateObject.getHours()).padStart(2, '0');
    const minutes = String(dateObject.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Add Admin Route
router.post("/register-admin", async (req, res) => {
    console.log('Received data:', req.body);
    let message = '';

    // Extract date of birth from the request body
    const dob = new Date(req.body.dob);

    // Calculate age based on the current date
    const currentDate = new Date();
    const ageInMilliseconds = currentDate - dob;

    // Calculate years
    const ageInYears = currentDate.getFullYear() - dob.getFullYear();

    if (ageInYears < 1) {
        // Reject the request if the age is less than 1 year
        message = 'Admin must be at least 1 year old to be added.';
        res.json({ message });
        return;
    }

    // Check if the password and confirmPassword match
    if (req.body.password !== req.body.confirmPassword) {
        message = 'Passwords do not match.';
        res.json({ message });
        return;
    }

    try {
        // Check if an Admin with the same email or number already exists
        const existingEmail = await userTable.find('email', req.body.email);
        const existingNumber = await userTable.find('number', req.body.number);

        if (existingEmail.length > 0) {
            message = 'Admin with the same email already exists.';
        } else if (existingNumber.length > 0) {
            message = 'Admin with the same number already exists.';
        } else {
            // Hash the password before storing it
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            // Insert the Admin if no duplicate is found and age is >= 1 year
            const values = {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                number: req.body.number,
                address: req.body.address,
                dob: req.body.dob,
                gender: req.body.gender,
                age: ageInYears,
                password: hashedPassword,
                adminType: req.body.adminType,
                datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
            };

            const inserted = await userTable.insert(values);
            if (inserted) {
                message = 'Admin added successfully!';
            } else {
                message = 'Failed to add Admin. Please try again.';
            }
        }
    } catch (error) {
        console.error('Error adding Admin:', error);
        message = 'Internal Server Error';
        res.status(500).send('Internal Server Error');
    }

    res.json({ message });
});


// Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user with the provided email
        const user = await userTable.find('email', email);

        if (user.length === 0) {
            message = 'Invalid credentials';
            res.status(401).send('Internal Server Error');
            return;
        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user[0].password);

        if (!passwordMatch) {
            message = 'Invalid credentials';
            res.status(401).send('Internal Server Error');            
            return;
        }

        const secret = process.env.JWT_SECRET || 'princezel1234567890';

        const token = jwt.sign({ userId: user[0].id }, secret, { expiresIn: '1h' });

        res.json({ token, adminType: user[0].adminType, message: 'Login successfully!' });
    } catch (error) {
        console.error('Error during logs:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;