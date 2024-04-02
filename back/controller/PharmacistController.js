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
const prescriptionsTable = new DatabaseTable('prescriptions', 'id');
const paymentTable = new DatabaseTable('payments', 'id');
const prescription_paymentTable = new DatabaseTable('prescription_payments', 'id');
const notificationTable = new DatabaseTable('notifications', 'id');


// View Table
const patient_prescriptionsTable = new DatabaseTable('patient_prescriptions', 'id');
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

router.post("/add-drug", async (req, res) => {
  console.log('Received data:', req.body);
  let message = '';

  const values = {
    drugname: req.body.drugname,
    price: req.body.price,
    formulation: req.body.formulation,
    userId: req.body.userId,
    datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
  };

  try {
    const inserted = await drugTable.insert(values);
    if (inserted) {
      message = 'Drug added successfully!';
    } else {
      message = 'Failed to add Drug. Please try again.';
    }
    // Create a notification for the new admin
    const notificationMessage = `${req.body.drugname}`;
    await notificationTable.insert({ 
      message: notificationMessage, 
      drugId: inserted.insertId,
      userId: req.body.userId,
      datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    });
  } catch (error) {
    console.error('Error adding Drug:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
  }

  res.json({ message });
});

// Manage Patients Route
router.get("/get-drugs", async (req, res) => {
  try {
    const drugs = await drugTable.findAll();
    res.json({ drugs });
  } catch (error) {
    console.error('Error fetching drugs:', error);
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
        formulation: req.body.formulation,
      });

      res.json({ message: 'Drug updated successfully!' });
    }
  } catch (error) {
    console.error('Error updating Drug:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete Patient Route
router.get("/deletedrug", async (req, res) => {
  const id = req.query.id;

  try {
    await drugTable.delete(id);
    res.json({ message: 'Drug deleted successfully!' });
  } catch (error) {
    console.error('Error deleting drug:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete prescriptionsTable Route
router.delete("/delete-prescriptions/:id", async (req, res) => {
  const id = req.params.id;
  try {
      // Delete the prescriptions from the database table
      await prescriptionsTable.delete(id);
  } catch (error) {
      console.error('Error deleting prescriptions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/get-prescriptions", async (req, res) => {
  try {
    const prescriptions = await patient_prescriptionsTable.findAll();
    res.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching presciptions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/get-paid-prescriptions", async (req, res) => {
  try {
    const prescriptions = await patient_prescriptionsTable.find();
    res.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching presciptions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/get-GroupedPrescriptions", async (req, res) => {
  try {
    const Paidprescription = await patient_prescription_paymentsTable.find('prescription_status', "Has Paid");
    const NotPaidprescription = await patient_prescription_paymentsTable.find('status', "Not Paid")
    const prescriptions = await patient_prescription_paymentsTable.findAll()
    res.json({ Paidprescription, NotPaidprescription, prescriptions });
  } catch (error) {
    console.error('Error fetching presciptions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/getAllPrescriptions/:pId", async (req, res) => {
  try {
    const { pId } = req.params;
    const prescriptions = await patient_prescriptionsTable.findPrescriptionsByPatientIdAndStatus(pId, 'Not Paid');
    res.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put("/updatePrescriptionStatus/:id", async (req, res) => {
  const prescriptionId = parseInt(req.params.id, 10);

  try {
    // Assuming you have a function like update in appointmentTable to update the data
    await prescriptionsTable.update(prescriptionId, {
      status: 'Has Paid',
    });

    res.json({ success: true, message: 'Prescription updated successfully!' });
  } catch (error) {
    console.error('Error updating Prescription:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


router.post("/add-payment", async (req, res) => {
  let message = '';
  let paymentId = null;

  const values = {
    total_amount: req.body.total_amount,
    amount_paid: req.body.amount_paid,
    method: req.body.method,
    receiptNo: req.body.receiptNo,
    balance: req.body.balance,
    bookingId: 0,
    userId: req.body.userId,
    status: req.body.status,
    datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
  };

  try {
    const inserted = await paymentTable.insertPayment(values);
    if (inserted) {
      message = 'Payment added successfully!';
      paymentId = inserted.insertId;
      console.log('paymentId:', paymentId);
      // Retrieve the generated paymentId
    } else {
      message = 'Failed to add payment. Please try again.';
    }
  } catch (error) {
    console.error('Error adding payment:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
    return; // Ensure to return after sending the response
  }

  res.json({ message, id: paymentId }); // Send the paymentId along with the response
});

router.post("/update-payment/:id", async (req, res) => {
  const prescriptionId = parseInt(req.params.id, 10);

  let message = '';

  const values = {
    total_amount: req.body.total_amount,
    amount_paid: req.body.amount_paid,
    method: req.body.method,
    receiptNo: req.body.receiptNo,
    balance: req.body.balance,
    status: req.body.status,
  };

  try {
    const updated = await paymentTable.updatePayment(values);
    if (updated) {
      message = 'Payment updated successfully!';
    } else {
      message = 'Failed to update payment. Please try again.';
    }
  } catch (error) {
    console.error('Error updating payment:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
    return; // Ensure to return after sending the response
  }

  res.json({ message });
});



router.post("/add-prescription-payment", async (req, res) => {
  let message = '';

  const values = {
    paymentId: req.body.paymentId,
    prescriptionId: req.body.prescriptionId,
    quantity: req.body.quantity,
    status: 'Has Paid',
    price: req.body.price
  };

  try {
    const inserted = await prescription_paymentTable.insertPrescriptionPayment(values);
    if (inserted) {
      message = 'Prescription payment added successfully!';
    } else {
      message = 'Failed to add prescription payment. Please try again.';
    }
  } catch (error) {
    console.error('Error adding prescription payment:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
  }

  res.json({ message });
});

router.get("/get-Payment-Details/:paymentId", async (req, res) => {
  const paymentId = parseInt(req.params.paymentId, 10);

  try {
    const PaymentDetails = await patient_prescription_paymentsTable.find('paymentId', paymentId);

    if (PaymentDetails.length === 0) {
      // Assuming no payment details found for the given paymentId
      res.json({ hasPaymentDetails: false, PaymentDetails: null });
    } else {
      // Assuming payment details found for the given paymentId
      res.json({ hasPaymentDetails: true, PaymentDetails: PaymentDetails[0] });
    }
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




module.exports = router;