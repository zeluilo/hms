// Import necessary modules
const express = require("express");
const router = express.Router();
const moment = require("moment");
// const { checkLogin } = require('./middleware'); // Assuming you have middleware for checking login status

const DatabaseTable = require('../classes/DatabaseTable');

// Single Table
const patientTable = new DatabaseTable('patients', 'pId');
const appointmentTable = new DatabaseTable('appointment', 'id');
const medical_historyTable = new DatabaseTable('medical_history', 'id');
const vitalsignsTable = new DatabaseTable('vitalsigns', 'id');

//View Table
const patient_bookingTable = new DatabaseTable('patient_bookings', 'id');
const medical_recordTable = new DatabaseTable('medical_records', 'id');


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

// Manage Patients Route
router.get("/managepatients", async (req, res) => {
    try {
      const patients = await patientTable.findAll();
      res.json({ patients });
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  

// Manage Patients Route
router.get("/getallbookings", async (req, res) => {
    try {
      const appointments = await patient_bookingTable.findAll();
      res.json({ appointments });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  router.get("/get_bookings", async (req, res) => {
    try {
      const patients = await patient_bookingTable.find('status', 'Not Paid');
      res.json({ patients });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  router.get("/get_doctors_queue/:department", async (req, res) => {
    try {
      const userDepartment = req.params.department;
      const appointments = await patient_bookingTable.findBookingsByDoctorAndStatus(userDepartment, "Hasn't Visited");
  
      // Add a patientNumber to each appointment based on its position in the array
      const appointmentsWithNumbers = appointments.map((appointment, index) => ({
        ...appointment,
        patientNumber: index + 1,
      }));
  
      res.json({ appointments: appointmentsWithNumbers });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  router.get("/get_doctors_calendar/:department", async (req, res) => {
    try {
      console.log('Received request for /calendar'); // Add this line
      const userDepartment = req.params.department; // Retrieve department from URL parameter
      const allBookings = await patient_bookingTable.findBookingsByDoctorAndStatus(userDepartment, "Hasn't Visited");
      console.log('All Bookings:', allBookings);
      const calendarData = organizeByDay(allBookings);
      console.log('Calendar Data:', calendarData);
      res.json({ calendarData });
    } catch (error) {
      console.error('Error fetching bookings for calendar view:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  const organizeByDay = (bookings) => {
    const organizedData = [];
  
    bookings.forEach((booking) => {
      const dateTime = moment(booking.timetovisit).format("YYYY-MM-DD HH:mm:ss");
  
      const title = `${booking.firstname} ${booking.pId}`;
  
      organizedData.push({
        title: title,
        start: dateTime,
        end: dateTime,
        id: booking.id,
        price: booking.price,
        firstname: booking.firstname,
        lastname: booking.lastname,
        pId: booking.pId,
        reason: booking.reason,
        doctor: booking.doctor,
        status: booking.status,
        visited: booking.visited,
      });
    });
  
    return organizedData;
  };

  router.post("/add-medical-history", async (req, res) => {
    console.log('Received data:', req.body);
  
    let message = '';
  
    const values = {
      complaints: req.body.complaints,
      pmr: req.body.pmr,
      drughistory: req.body.drughistory,
      socialhistory: req.body.socialhistory,
      familyhistory: req.body.familyhistory,
      physical_examine: req.body.physical_examine,
      patientId: req.body.patientId,
      userId: req.body.userId,
      datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    };
  
    try {
      const inserted = await medical_historyTable.insert(values);
      if (inserted) {
        message = 'Medical History added successfully!';
      } else {
        message = 'Failed to add Medical History. Please try again.';
      }
  
    } catch (error) {
      console.error('Error adding Medical History:', error);
      message = 'Internal Server Error';
      res.status(500).send('Internal Server Error');
    }
  
    res.json({ message });
  });

  router.post("/add-vitalsigns", async (req, res) => {
    console.log('Received data:', req.body);
  
    let message = '';
  
    const values = {
      bp: req.body.bp,
      temperature: req.body.temperature,
      pulse: req.body.pulse,
      respiration: req.body.respiration,
      spo2: req.body.spo2,
      bmi: req.body.bmi,
      height: req.body.height,
      weight: req.body.weight,
      patientId: req.body.patientId,
      userId: req.body.userId,
      datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    };
  
    try {
      const inserted = await vitalsignsTable.insert(values);
      if (inserted) {
        message = 'Vital Signs added successfully!';
      } else {
        message = 'Failed to add Vital Signs. Please try again.';
      }
  
    } catch (error) {
      console.error('Error adding Vital Signs:', error);
      message = 'Internal Server Error';
      res.status(500).send('Internal Server Error');
    }
  
    res.json({ message });
  });
  
  
  

  module.exports = router;