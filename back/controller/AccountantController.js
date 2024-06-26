const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const twilio = require('twilio');

// Assuming you have middleware for checking login status
// const { checkLogin } = require('./middleware');

const DatabaseTable = require('../classes/DatabaseTable');

// Single Table
const appointmentTable = new DatabaseTable('appointment', 'id');
const booking_paymentTable = new DatabaseTable('booking_payments', 'id');
const patient_bookingTable = new DatabaseTable('patient_bookings', 'id');

// View Table
const patient_prescriptionsTable = new DatabaseTable('patient_prescriptions', 'id');
const patient_investigation_paymentsTable = new DatabaseTable('patient_investigation_payments', 'id');
const patient_prescription_paymentsTable = new DatabaseTable('patient_prescription_payments', 'id');

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

//  Route
router.get("/get-payment-data", async (req, res) => {
  try {
    const appointments = await booking_paymentTable.findAll();
    const prescriptions = await patient_prescription_paymentsTable.findAll();
    const investigations = await patient_investigation_paymentsTable.findAll();
    
    res.json({ appointments, prescriptions, investigations });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route
router.get("/get-payment-price", async (req, res) => {
  try {
    const appointments = await booking_paymentTable.find('billing_status', "Has Paid");
    const prescriptions = await patient_prescription_paymentsTable.find('prescription_status', "Has Paid");
    const investigations = await patient_investigation_paymentsTable.find('payment_status', "Has Paid");

    res.json({ appointments, prescriptions, investigations });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



module.exports = router;
