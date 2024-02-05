// Import necessary modules
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const moment = require("moment");
const jwt = require('jsonwebtoken');
// const { checkLogin } = require('./middleware'); // Assuming you have middleware for checking login status

const DatabaseTable = require('../classes/DatabaseTable');

// Single Table
const drugTable = new DatabaseTable('drug', 'id');

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

router.post("/add-drug", async (req, res) => {
    console.log('Received data:', req.body);
    let message = '';
  
    const values = {
      drugname: req.body.drugname,
      price: req.body.price,
      quantity: req.body.quantity,
    };
  
    try {
        const inserted = await drugTable.insert(values);
        if (inserted) {
          message = 'Drug added successfully!';
        } else {
          message = 'Failed to add Drug. Please try again.';
        }
    } catch (error) {
      console.error('Error adding Drug:', error);
      message = 'Internal Server Error';
      res.status(500).send('Internal Server Error');
    }
  
    res.json({ message });
  });

  // Manage Patients Route
router.get("/getdrug", async (req, res) => {
    try {
      const patients = await drugTable.findAll();
      res.json({ patients });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.put("/updatedrug/:id", async (req, res) => {
    const departmentId = parseInt(req.params.id, 10);
  
    try {
      const existingDepartment = await drugTable.find('id', departmentId);
  
      if (existingDepartment.length === 0) {
        // Assuming no medical data found for the given departmentId
        res.status(404).json({ error: 'Drug not found' });
      } else {
        // Assuming you have a function like update in biodataTable to update the data
        await drugTable.update(departmentId, {
          drugname: req.body.drugname,
          price: req.body.price,
          quantity: req.body.quantity,
        });
  
        res.json({ message: 'Drug updated successfully!' });
      }
    } catch (error) {
      console.error('Error updating Drug:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

module.exports = router;