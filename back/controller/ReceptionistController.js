// Import necessary modules
const express = require("express");
const router = express.Router();
const moment = require("moment");
const { v4: uuidv4 } = require('uuid');
const authenticateToken = require('../auth/authenticateToken'); // Import the middleware

// const { checkLogin } = require('./middleware'); // Assuming you have middleware for checking login status

const DatabaseTable = require('../classes/DatabaseTable');

// Single Table
const patientTable = new DatabaseTable('patients', 'pId');
const familyTable = new DatabaseTable('family', 'id');
const biodataTable = new DatabaseTable('biodata', 'id');
const appointmentTable = new DatabaseTable('appointment', 'id');
const departmentTable = new DatabaseTable('department', 'id');
const paymentTable = new DatabaseTable('payments', 'id');
const deletepatientTable = new DatabaseTable('deletepatients', 'id');
const notificationTable = new DatabaseTable('notifications', 'id');

//View Table
const patient_bookingTable = new DatabaseTable('patient_bookings', 'id');
const patient_relativeTable = new DatabaseTable('patient_relatives', 'id');
const booking_paymentTable = new DatabaseTable('booking_payments', 'id');
const patient_requestTable = new DatabaseTable('patient_request', 'id');
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

  // Calculate the difference in years and months
  const yearsDiff = currentDate.getFullYear() - dob.getFullYear();
  const monthsDiff = currentDate.getMonth() - dob.getMonth();

  // Adjust years and months if the current date is before the birth date
  let ageInYears = yearsDiff;
  let ageInMonths = monthsDiff;
  if (monthsDiff < 0 || (monthsDiff === 0 && currentDate.getDate() < dob.getDate())) {
    ageInYears--;
    ageInMonths = 12 + monthsDiff;
  }

  // Form the age string
  const yearsString = ageInYears > 0 ? `${ageInYears} year${ageInYears > 1 ? 's' : ''}` : '';
  const monthsString = ageInMonths > 0 ? `${ageInMonths} month${ageInMonths > 1 ? 's' : ''}` : '';

  // Combine the age strings
  const age = yearsString && monthsString ? `${yearsString} ${monthsString}` : yearsString || monthsString;

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
    age: age, // Assign the calculated age
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
      const insertedPatient = await patientTable.insert(values);
      if (insertedPatient) {
          message = 'Patient added successfully!';
          console.log('Insert: ', insertedPatient)
          // Create a notification for the new admin
          const notificationMessage = `${req.body.firstname} ${req.body.lastname}`;
          await notificationTable.insert({ 
            message: notificationMessage, 
            patientId: insertedPatient.insertId,
            userId: req.body.userId,
            datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
          });
      } else {
          message = 'Failed to add Patient. Please try again.';
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

  // Calculate the difference in years and months
  const yearsDiff = currentDate.getFullYear() - dob.getFullYear();
  const monthsDiff = currentDate.getMonth() - dob.getMonth();

  // Adjust years and months if the current date is before the birth date
  let ageInYears = yearsDiff;
  let ageInMonths = monthsDiff;
  if (monthsDiff < 0 || (monthsDiff === 0 && currentDate.getDate() < dob.getDate())) {
    ageInYears--;
    ageInMonths = 12 + monthsDiff;
  }

  // Form the age string
  const yearsString = ageInYears > 0 ? `${ageInYears} year${ageInYears > 1 ? 's' : ''}` : '';
  const monthsString = ageInMonths > 0 ? `${ageInMonths} month${ageInMonths > 1 ? 's' : ''}` : '';

  // Combine the age strings
  const age = yearsString && monthsString ? `${yearsString} ${monthsString}` : yearsString || monthsString;

  if (ageInYears < 1) {
    // Reject the request if the age is less than 1 year
    message = 'Patient must be at least 1 year old to be added.';
    res.json({ message });
    return;
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
      age: age, // Assign the calculated age
      dob: formatDate(req.body.dob),
      gender: req.body.gender,
      nxt_firstname: req.body.nxt_firstname,
      nxt_lastname: req.body.nxt_lastname,
      nxt_email: req.body.nxt_email,
      nxt_number: req.body.nxt_number,
      nxt_address: req.body.nxt_address,
      reference: req.body.reference,
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

router.get("/getnewpatients", async (req, res) => {
  try {
    // Implement logic to fetch newly added patients from the patient table
    const newPatients = await patientTable.findAll(); // You may need to adjust this query based on your database schema and requirements

    // Send the newly added patients as a response
    res.json(newPatients);
  } catch (error) {
    console.error('Error fetching new patients:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Delete Patient Route
router.delete("/deletepatient", async (req, res) => {
  const pId = req.query.pId;

  try {
    await patientTable.delete(pId);
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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

router.get("/get-all-relatives", async (req, res) => {
  try {
    const relatives = await patient_relativeTable.findAll();
    res.json({ relatives }); // Convert object to array before sending response
  } catch (error) {
    console.error('Error fetching vital signs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
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

router.post("/create-delete-request", async (req, res) => {
  console.log('Received data:', req.body);
  let message = '';

  const values = {
    patientId: req.body.patientId,
    reason: req.body.reason,
    userId: req.body.userId,
    datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
  };

  try {
    const inserted = await deletepatientTable.insert(values);
    if (inserted) {
      message = 'Patient sent successfully!';
    } else {
      message = 'Failed to send Patient. Please try again.';
    }
    const notificationMessage = `Click to view all`;
    await notificationTable.insert({ 
      message: notificationMessage, 
      requestId: inserted.insertId,
      userId: req.body.userId,
      datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    });
  } catch (error) {
    console.error('Error sending Patient:', error);
    message = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
  }

  res.json({ message });
});

// Get Delete Request Route
router.get("/get-delete-request", async (req, res) => {
  try {
    // Retrieve the delete request based on patientId
    const request = await patient_requestTable.findAll();
    res.json({ request }); // Convert object to array before sending response
  } catch (error) {
    console.error('Error retrieving delete request:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete Delete Request Route
router.delete("/delete-request/:requestId", async (req, res) => {
  const deleteRequestId = req.params.requestId;

  try {
    // Delete the delete request based on deleteRequestId
    const deleted = await deletepatientTable.delete(deleteRequestId);

    if (deleted) {
      return res.json({ message: 'Request deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Request not found' });
    }
  } catch (error) {
    console.error('Error deleting delete request:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete Delete Request Route
router.delete("/delete-all-request/:patientId", async (req, res) => {
  const deleteRequestId = req.params.patientId;

  try {
    // Delete the delete request based on deleteRequestId
    const deleted = await deletepatientTable.deleteAll('patientId', deleteRequestId);

    if (deleted) {
      return res.json({ message: 'Request deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Request not found' });
    }
  } catch (error) {
    console.error('Error deleting delete request:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
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
    }
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
    status = 'Has Paid';
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

  const uId = uuidv4();

  const values = {
    uId: uId, // Associate the UID with the booking record
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
    status = 'Has Paid';
  }
  const uId = uuidv4();
  try {
    const existingBooking = await appointmentTable.find('id', bookingId);

    if (existingBooking.length === 0) {
      // Assuming no medical data found for the given bookingId
      res.status(404).json({ error: 'Booking not found' });
    } else {
      // Assuming you have a function like update in biodataTable to update the data
      await appointmentTable.update(bookingId, {
        uId: uId, // Associate the UID with the booking record4
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
    const appointments = await patient_bookingTable.find('status', 'Not Paid');
    res.json({ appointments });
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
    userId: req.body.userId,
    status: 'Has Paid',
    datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
  };

  try {
    const inserted = await paymentTable.insert(values);
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
    const patients = await paymentTable.findAll();
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
      status: 'Has Paid',
    });

    res.json({ success: true, message: 'Booking updated successfully!' });
  } catch (error) {
    console.error('Error updating Booking:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Route to update visit status for a booking by uId
router.put("/updateVisitation/:uId", authenticateToken, async (req, res) => {
  try {
      const user = req.user; // Retrieve the user object from the request
      const uId = req.params.uId;
      // Perform authorization check to ensure the booking belongs to the logged-in user
      const booking = await appointmentTable.findByUID(uId);
      console.log('booking:', booking);
      console.log('UID:', uId);

      if (!booking) {
          return res.status(404).json({ message: 'Booking not found' });
      }

      console.log('Request Headers:', req.headers);

      // Check if the logged-in user has permission to update this booking
      
      // if (booking.userId !== user.id) {
      //     return res.status(403).json({ message: 'Unauthorized' });
      // }

      // Update visitation status for the booking
      await appointmentTable.updateWithUID(uId, { visited: 'Has Visited' });

      res.json({ message: 'Visitation status updated successfully' });
  } catch (error) {
      console.error('Error updating visitation status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Get all bookings with status = 'Not Paid'
router.get("/getNotPaidBookings", async (req, res) => {
  try {
    const notPaidBookings = await appointmentTable.find('status', "Not Paid");
    res.json({ notPaidBookings });
  } catch (error) {
    console.error('Error fetching not paid bookings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/calendar", async (req, res) => {
  try {
    console.log('Received request for /calendar'); // Add this line
    const allBookings = await patient_bookingTable.findBookings('status', "Has Paid");
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

// Get all bookings with status = 'Not Paid'
router.get("/get-grouped-appointments", async (req, res) => {
  try {
    const notPaidBookings = await booking_paymentTable.find('status', "Not Paid");
    const PaidBookings = await booking_paymentTable.find('status', "Has Paid");
    res.json({ notPaidBookings, PaidBookings });
  } catch (error) {
    console.error('Error fetching not paid bookings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



module.exports = router;