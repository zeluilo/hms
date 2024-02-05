// Import necessary modules
const express = require("express");
const router = express.Router();
const moment = require("moment");
// const { checkLogin } = require('./middleware'); // Assuming you have middleware for checking login status

const DatabaseTable = require('../classes/DatabaseTable');

// Single Table
const patientTable = new DatabaseTable('patients', 'pId');
const familyTable = new DatabaseTable('family', 'id');
const biodataTable = new DatabaseTable('biodata', 'id');
const appointmentTable = new DatabaseTable('appointment', 'id');
const departmentTable = new DatabaseTable('department', 'id');
const billingTable = new DatabaseTable('billing', 'id');


//View Table
const patient_bookingTable = new DatabaseTable('patient_bookings', 'id');
const booking_paymentTable = new DatabaseTable('booking_payments', 'id');
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


// Home Route
router.get("/home", async (req, res) => {
  try {
    const patients = await patientTable.findAll();
    // Add other necessary data fetching logic
    res.render("home", { patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add Patient Route
router.post("/addpatient", async (req, res) => {
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
    message = 'Patient must be at least 1 year old to be added.';
    res.json({ message });
    return;
  }

  const values = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    number: req.body.number,
    address: req.body.address,
    dob: req.body.dob,
    gender: req.body.gender,
    age: ageInYears,
    nxt_firstname: req.body.nxt_firstname,
    nxt_lastname: req.body.nxt_lastname,
    nxt_email: req.body.nxt_email,
    nxt_number: req.body.nxt_number,
    nxt_address: req.body.nxt_address,
    reference: req.body.reference,
    datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
  };

  try {
    // Check if a patient with the same email or number already exists
    const existingEmail = await patientTable.find('email', req.body.email);
    const existingNumber = await patientTable.find('number', req.body.number);

    if (existingEmail.length > 0) {
      message = 'Patient with the same email already exists.';
    } else if (existingNumber.length > 0) {
      message = 'Patient with the same number already exists.';
    } else {
      // Insert the patient if no duplicate is found and age is >= 1 year
      const inserted = await patientTable.insert(values);
      if (inserted) {
        message = 'Patient added successfully!';
      } else {
        message = 'Failed to add patient. Please try again.';
      }
    }
  } catch (error) {
    console.error('Error adding patient:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
  }

  res.json({ message });
});


// Update Patient Route (PUT)
router.put("/updatepatient/:pId", async (req, res) => {
  console.log('Received data:', req.body);
  const pId = parseInt(req.params.pId, 10);
  console.log('pId:', pId);
  let message = '';

  // Extract date of birth from the request body
  const dob = new Date(req.body.dob);

  // Calculate age based on the current date
  const currentDate = new Date();

  // Calculate years
  const ageInYears = currentDate.getFullYear() - dob.getFullYear();

  if (ageInYears < 1) {
    return res.status(400).json({ message: 'Patient must be at least 1 year old to be updated.' });
  }

  try {
    console.log('Received data for update:', req.body);

    // Fetch the existing patient details
    const existingPatient = await patientTable.find('pId', pId);

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
      address: req.body.address,
      age: ageInYears,
      dob: formatDate(req.body.dob),
      gender: req.body.gender,
      dateupdate: new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    // Check for duplicate email and number (exclude the current patient)
    if (req.body.email !== existingPatient[0].email) {
      const existingEmail = await patientTable.find('email', req.body.email);

      if (existingEmail.length > 0) {
        return res.status(400).json({ message: 'Patient with the same email already exists.' });
      }
    }

    if (req.body.number !== existingPatient[0].number) {
      const existingNumber = await patientTable.find('number', req.body.number);

      if (existingNumber.length > 0) {
        return res.status(400).json({ message: 'Patient with the same number already exists.' });
      }
    }

    const updated = await patientTable.update(pId, updatedValues);

    if (updated) {
      return res.json({ message: 'Patient updated successfully!' });
    } else {
      return res.status(500).json({ message: 'Failed to update patient. Please try again.' });
    }
  } catch (error) {
    console.error('Error updating patient:', error);

    if (error instanceof Error && error.message) {
      console.error('Validation error details:', error.message);
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
});

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



// Delete Patient Route
router.get("/deletepatient", async (req, res) => {
  const pId = req.query.pId;

  try {
    await patientTable.delete(pId);
    res.redirect("/managepatients");
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post("/addfamily", async (req, res) => {
  console.log('Received data:', req.body);
  let message = '';

  const values = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    number: req.body.number,
    address: req.body.address,
    relation: req.body.relation,
    patientId: req.body.patientId,
    datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
  };

  try {
    // Check if a family member with the same email already exists for the patient with the given pid
    const existingEmail = await familyTable.find('email', req.body.email);
    const existingNumber = await familyTable.find('number', req.body.number);

    if (existingEmail.some(member => member.patientId === req.body.patientId)) {
      message = 'Member with the same email already exists for this patient.';
    } else if (existingNumber.some(member => member.patientId === req.body.patientId)) {
      message = 'Member with the same number already exists for this patient.';
    } else {
      // Insert the Member if no duplicate is found and age is >= 1 year
      const inserted = await familyTable.insert(values);
      if (inserted) {
        message = 'Member added successfully!';
      } else {
        message = 'Failed to add Member. Please try again.';
      }
    }
  } catch (error) {
    console.error('Error adding Member:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
  }

  res.json({ message });
});

router.post("/addbiodata", async (req, res) => {
  console.log('Received data:', req.body);
  let message = '';

  const values = {
    height: req.body.height,
    weight: req.body.weight,
    bloodgroup: req.body.bloodgroup,
    rhesus: req.body.rhesus,
    genotype: req.body.genotype,
    hypertensive: req.body.hypertensive,
    diabetic: req.body.diabetic,
    reaction: req.body.reaction,
    other_info: req.body.other_info,
    patientId: req.body.patientId,
    datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
  };

  try {
    const inserted = await biodataTable.insert(values);
    if (inserted) {
      message = 'BioData added successfully!';
    } else {
      message = 'Failed to add BioData. Please try again.';
    }

  } catch (error) {
    console.error('Error adding BioData:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
  }

  res.json({ message });
});

router.get("/getbiodata/:pId", async (req, res) => {
  const pId = parseInt(req.params.pId, 10);

  try {
    const medicalData = await biodataTable.find('patientId', pId);

    if (medicalData.length === 0) {
      // Assuming no medical data found for the given patientId
      res.json({ hasMedicalData: false, medicalData: null });
    } else {
      // Assuming medical data found for the given patientId
      res.json({ hasMedicalData: true, medicalData: medicalData[0] });
    }
  } catch (error) {
    console.error('Error fetching medical data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put("/updatebiodata/:id", async (req, res) => {
  const bioDataId = parseInt(req.params.id, 10);

  try {
    const existingBioData = await biodataTable.find('id', bioDataId);

    if (existingBioData.length === 0) {
      // Assuming no medical data found for the given bioDataId
      res.status(404).json({ error: 'Medical data not found' });
    } else {
      // Assuming you have a function like update in biodataTable to update the data
      await biodataTable.update(bioDataId, {
        height: req.body.height,
        weight: req.body.weight,
        bloodgroup: req.body.bloodgroup,
        rhesus: req.body.rhesus,
        genotype: req.body.genotype,
        hypertensive: req.body.hypertensive,
        diabetic: req.body.diabetic,
        reaction: req.body.reaction,
        other_info: req.body.other_info,
        // Add other fields as needed
      });

      res.json({ message: 'Medical data updated successfully!' });
    }g
  } catch (error) {
    console.error('Error updating medical data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.post("/addappointment", async (req, res) => {
  console.log('Received data:', req.body);
  let message = '';

  // Set the default status to 'Not Paid'
  let status = 'Not Paid';

  // Check if the price is equal to 0, if true, set the status to 'Paid'
  if (req.body.price == '0') {
    status = 'Paid';
  }

  let typeofvisit = '';

  // Check the emergency and price to determine the typeofvisit
  if (req.body.emergency === 'Yes') {
    typeofvisit = 'Emergency Registration';
  } else if (req.body.emergency === 'No' && req.body.price === '20000') {
    typeofvisit = 'Specialist Registration';
  } else if (req.body.emergency === 'No' && req.body.price === '10000') {
    typeofvisit = 'Basic Registration';
  } else {
    typeofvisit = req.body.typeofvisit;
  }

  const values = {
    reason: req.body.reason,
    price: req.body.price,
    doctor: req.body.doctor,
    timetovisit: req.body.timetovisit,
    emergency: req.body.emergency,
    typeofvisit: typeofvisit,
    patientId: req.body.patientId,
    visited: "Hasn't Visited",
    status: String(status),  // Set the status based on the condition
    datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
  };

  try {
    // Check if a patient with the same doctor and time already exists
    const existingDoctor = await appointmentTable.find('doctor', req.body.doctor);
    const existingTime = await appointmentTable.find('timetovisit', req.body.timetovisit);

    if (existingDoctor.length > 0 && existingTime.length > 0) {
      message = 'Booking already exists.';
    } else {
      // Insert the patient if no duplicate is found and age is >= 1 year
      const inserted = await appointmentTable.insert(values);
      if (inserted) {
        message = 'Booking added successfully!';
      } else {
        message = 'Failed to add booking. Please try again.';
      }
    }
  } catch (error) {
    console.error('Error adding Booking:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
  }

  res.json({ message });
});

router.put("/updatebooking/:id", async (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
// Set the default status to 'Not Paid'
let status = 'Not Paid';

// Check if the price is equal to 0, if true, set the status to 'Paid'
if (req.body.price == 0) {
  status = 'Paid';
}
  try {
    const existingBooking = await appointmentTable.find('id', bookingId);

    if (existingBooking.length === 0) {
      // Assuming no medical data found for the given bookingId
      res.status(404).json({ error: 'Booking not found' });
    } else {
      // Assuming you have a function like update in biodataTable to update the data
      await appointmentTable.update(bookingId, {
        reason: req.body.reason,
        price: req.body.price,
        doctor: req.body.doctor,
        timetovisit: formatDateForInput(req.body.timetovisit),
        patientId: req.body.patientId,
        status: String(status),      
      });

      res.json({ message: 'Booking updated successfully!' });
    }
  } catch (error) {
    console.error('Error updating Booking:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post("/add_department", async (req, res) => {
  console.log('Received data:', req.body);
  let message = '';

  const values = {
    department: req.body.department,
    price: req.body.price,
    datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
  };

  try {
    // Check if a patient with the same email or number already exists
    const existingDoctor = await departmentTable.find('department', req.body.department);

    if (existingDoctor.length > 0) {
      message = 'Department already exists.';
    } else {
      // Insert the patient if no duplicate is found and age is >= 1 year
      const inserted = await departmentTable.insert(values);
      if (inserted) {
        message = 'Department added successfully!';
      } else {
        message = 'Failed to add department. Please try again.';
      }

    }
  } catch (error) {
    console.error('Error adding Department:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
  }

  res.json({ message });
});

// Manage Patients Route
router.get("/getdepartment", async (req, res) => {
  try {
    const patients = await departmentTable.findAll();
    res.json({ patients });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put("/updatedepartment/:id", async (req, res) => {
  const departmentId = parseInt(req.params.id, 10);

  try {
    const existingDepartment = await departmentTable.find('id', departmentId);

    if (existingDepartment.length === 0) {
      // Assuming no medical data found for the given departmentId
      res.status(404).json({ error: 'Department not found' });
    } else {
      // Assuming you have a function like update in biodataTable to update the data
      await departmentTable.update(departmentId, {
        department: req.body.department,
        price: req.body.price,
      });

      res.json({ message: 'Department updated successfully!' });
    }
  } catch (error) {
    console.error('Error updating department:', error);
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

router.get("/get_appointments", async (req, res) => {
  try {
    const patients = await patient_bookingTable.find('visited', "Hasn't Visited");
    res.json({ patients });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Manage Patients Route
router.get("/medical_records", async (req, res) => {
  try {
    const patients = await medical_recordTable.findAll();
    res.json({ patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/getpaymentdetails/:bookingId", async (req, res) => {
    const bookingId = parseInt(req.params.bookingId, 10);

  try {
    const PaymentDetails = await booking_paymentTable.find('bookingId', bookingId);

    if (PaymentDetails.length === 0) {
      // Assuming no medical data found for the given patientId
      res.json({ hasPaymentDetails: false, PaymentDetails: null });
    } else {
      // Assuming medical data found for the given patientId
      res.json({ hasPaymentDetails: true, PaymentDetails: PaymentDetails[0] });
    }
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post("/addpayment", async (req, res) => {
  console.log('Received data:', req.body);

  let message = '';

  const values = {
    total_amount: req.body.total_amount,
    amount_paid: req.body.amount_paid,
    method: req.body.method,
    receiptNo: req.body.receiptNo,
    balance: req.body.balance,
    bookingId: req.body.bookingId,
    status: 'Paid',
    datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
  };

  try {
    const inserted = await billingTable.insert(values);
    if (inserted) {
      message = 'BioData added successfully!';
    } else {
      message = 'Failed to add BioData. Please try again.';
    }

  } catch (error) {
    console.error('Error adding BioData:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
  }

  res.json({ message });
});

router.get("/getbilling", async (req, res) => {
  try {
    const patients = await billingTable.findAll();
    res.json({ patients });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put("/updateBookingStatus/:id", async (req, res) => {
  const bookingId = parseInt(req.params.id, 10);

  try {
    // Assuming you have a function like update in appointmentTable to update the data
    await appointmentTable.update(bookingId, {
      status: 'Paid',
    });

    res.json({ success: true, message: 'Booking updated successfully!' });
  } catch (error) {
    console.error('Error updating Booking:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Get all bookings with status = 'Not Paid'
router.get("/getNotPaidBookings", async (req, res) => {
  try {
    const notPaidBookings = await appointmentTable.find('visited', "Hasn't Visited");
    res.json({ notPaidBookings });
  } catch (error) {
    console.error('Error fetching not paid bookings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/calendar", async (req, res) => {
  try {
    console.log('Received request for /calendar'); // Add this line
    const allBookings = await patient_bookingTable.findBookings('status', "Paid");
    console.log('All Bookings:', allBookings);
    const calendarData = organizeByDay(allBookings);
    console.log('Calendar Data:', calendarData);
    res.json({ calendarData });
  } catch (error) {
    console.error('Error fetching bookings for calendar view:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/full_calendar", async (req, res) => {
  try {
    console.log('Received request for /calendar'); // Add this line
    const allBookings = await patient_bookingTable.findAll();
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



module.exports = router;