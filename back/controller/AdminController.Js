// Import necessary modules
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const moment = require("moment");
const jwt = require('jsonwebtoken');
// const { checkLogin } = require('./middleware'); // Assuming you have middleware for checking login status

const DatabaseTable = require('../classes/DatabaseTable');

// Single Table
const userTable = new DatabaseTable('users', 'id');

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
                department: req.body.department,
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

        res.json({ token, user: user[0], message: 'Login successfully!' });
    } catch (error) {
        console.error('Error during logs:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Add this route after the login route
router.put("/update-profile/:id", async (req, res) => {
    console.log('Received data:', req.body);
    const id = parseInt(req.params.id, 10);
    console.log('id:', id);
    let message = '';

    // Extract date of birth from the request body
    const dob = new Date(req.body.dob);

    // Calculate age based on the current date
    const currentDate = new Date();

    // Calculate years
    const ageInYears = currentDate.getFullYear() - dob.getFullYear();

    if (ageInYears < 1) {
        return res.json({ message: 'Patient must be at least 1 year old to be updated.' });
    }

    try {
        console.log('Received data for update:', req.body);

        // Fetch the existing patient details
        const existingPatient = await userTable.find('id', id);

        if (existingPatient.length === 0) {
            // Handle case where the patient is not found
            res.status(404).send('Patient not found');
            return;
        }

        // Update patient details with the new values
        const updatedValues = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            number: req.body.number,
            age: ageInYears,
            dob: formatDate(req.body.dob),
            address: req.body.address,
            dateupdate: new Date().toISOString().slice(0, 19).replace("T", " ")
        };

        // Check for duplicate email and number (exclude the current patient)
        if (req.body.email !== existingPatient[0].email) {
            const existingEmail = await userTable.find('email', req.body.email);

            if (existingEmail.length > 0) {
                return res.json({ message: 'Patient with the same email already exists.' });
            }
        }

        if (req.body.number !== existingPatient[0].number) {
            const existingNumber = await userTable.find('number', req.body.number);

            if (existingNumber.length > 0) {
                return res.json({ message: 'Patient with the same number already exists.' });
            }
        }

        const updated = await userTable.update(id, updatedValues);

        if (updated) {
            // Generate a new JWT token (if needed)
            const secret = process.env.JWT_SECRET || 'princezel1234567890';
            const token = jwt.sign({ userId: updated.id }, secret, { expiresIn: '1h' });

            // Send the updated user information and token in the response
            res.json({ token, user: updated, message: 'Profiles updated successfully!' });
        } else {
            return res.status(500).json({ message: 'Failed to update patient. Please try again.' });
        }

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;