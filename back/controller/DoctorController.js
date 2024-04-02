// Import necessary modules
const express = require("express");
const router = express.Router();
const moment = require("moment");
// const { checkLogin } = require('./middleware'); // Assuming you have middleware for checking login status

const DatabaseTable = require('../classes/DatabaseTable');

// Single Table
const patientTable = new DatabaseTable('patients', 'pId');
const consultationsTable = new DatabaseTable('consultations', 'id');
const biodataTable = new DatabaseTable('biodata', 'id');
const prescriptionsTable = new DatabaseTable('prescriptions', 'id');
const labTestTable = new DatabaseTable('labtest', 'id');
const investigationsTable = new DatabaseTable('investigations', 'id');
const paymentTable = new DatabaseTable('payments', 'id');
const notificationTable = new DatabaseTable('notifications', 'id');

//View Table
const patient_bookingTable = new DatabaseTable('patient_bookings', 'id');
const consultation_prescriptionsTable = new DatabaseTable('consultation_prescriptions', 'id');
const investigation_paymentsTable = new DatabaseTable('investigation_payments', 'id');
const consultation_investigationTable = new DatabaseTable('consultation_investigation', 'id');
const patient_investigation_paymentsTable = new DatabaseTable('patient_investigation_payments', 'id');

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

router.post("/add-consultations", async (req, res) => {
    console.log('Received data:', req.body);

    let message = '';

    const values = {
        complaints: req.body.complaints,
        pmr: req.body.pmr,
        drughistory: req.body.drughistory,
        socialhistory: req.body.socialhistory,
        familyhistory: req.body.familyhistory,
        physical_examine: req.body.physical_examine,
        bp: req.body.bp,
        temperature: req.body.temperature,
        pulse: req.body.pulse,
        respiration: req.body.respiration,
        spo2: req.body.spo2,
        bmi: req.body.bmi,
        height: req.body.height,
        weight: req.body.weight,
        diagnosis: req.body.diagnosis,
        comments: req.body.comments,
        patientId: req.body.patientId,
        userId: req.body.userId,
        datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    try {
        const inserted = await consultationsTable.insert(values);
        if (inserted) {
            message = 'Consultations added successfully!';
        } else {
            message = 'Failed to add Consultations. Please try again.';
        }

    } catch (error) {
        console.error('Error adding Consultations:', error);
        message = 'Internal Server Error';
        res.status(500).send('Internal Server Error');
    }

    res.json({ message });
});

// Route to get patient details by ID
router.get("/patient-details/:pId", async (req, res) => {
    try {
        const patientId = req.params.pId;
        const patientDetails = await patientTable.find('pId', patientId);
        res.json({ patientDetails });
    } catch (error) {
        console.error('Error fetching patient details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/get-consultations/:patientId", async (req, res) => {
    try {
        const patientId = req.params.patientId;
        const consultations = await consultationsTable.find('patientId', patientId);
        res.json({ consultations });
    } catch (error) {
        console.error('Error fetching vital signs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/get-consultation-investigation/:patientId", async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const consultations = await consultation_investigationTable.find('consultation_patientId', patientId);

    // Group consultations by consultation_Id
    const groupedConsultations = groupByConsultationId(consultations);
    res.json({ consultations: Object.values(groupedConsultations) }); // Convert object to array before sending response
  } catch (error) {
    console.error('Error fetching vital signs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to group consultations by consultation_Id
const groupByConsultationId = (consultations) => {
  const groupedConsultations = {};
  consultations.forEach((consultation) => {
    const { consultation_id } = consultation;
    if (!groupedConsultations[consultation_id]) {
      groupedConsultations[consultation_id] = [consultation];
    } else {
      groupedConsultations[consultation_id].push(consultation);
    }
  });
  return groupedConsultations;
};

router.get("/get-selected-consultations/:consultationId", async (req, res) => {
    try {
        const consultationId = req.params.consultationId;
        const consultations = await consultation_prescriptionsTable.find('consultationId', consultationId);
        res.json({ consultations });
    } catch (error) {
        console.error('Error fetching vital signs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/get-biodata/:patientId", async (req, res) => {
    try {
        const patientId = req.params.patientId;
        const biodata = await biodataTable.find('patientId', patientId);
        res.json({ biodata });
    } catch (error) {
        console.error('Error fetching Bio Data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/add-prescriptions", async (req, res) => {
    console.log('Received data:', req.body);

    let message = '';

    const values = {
        drugname: req.body.drugname,
        price: req.body.price,
        total_price: req.body.total_price,
        dosage: req.body.dosage,
        quantity: req.body.quantity,
        dd: req.body.dd,
        df: req.body.df,
        duration: req.body.duration,
        frequency: req.body.frequency,
        remarks: req.body.remarks,
        patientId: req.body.patientId,
        consultationId: req.body.consultationId,
        userId: req.body.userId,
        datecreate: new Date().toISOString().slice(0, 19).replace("T", " "),
        status: 'Not Paid'
    };

    try {
        const inserted = await prescriptionsTable.insert(values);
        if (inserted) {
            message = 'Prescriptions added successfully!';
        } else {
            message = 'Failed to add Prescriptions. Please try again.';
        }

    } catch (error) {
        console.error('Error adding Prescriptions:', error);
        message = 'Internal Server Error';
        res.status(500).send('Internal Server Error');
    }

    res.json({ message });
});

router.put("/update-consultation/:id", async (req, res) => {
    const consultationId = parseInt(req.params.id, 10);
  
    try {
      // Assuming you have a function like update in appointmentTable to update the data
      await consultationsTable.update(consultationId, {
        prescriptionId: req.body.prescriptionId,
        testId: req.body.testId,
      });
  
      res.json({ success: true, message: 'Consultation updated successfully!' });
    } catch (error) {
      console.error('Error updating Consultation:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  router.put("/update-investigation-diagnois/:id", async (req, res) => {
    const investigationId = parseInt(req.params.id, 10);
  
    try {
      // Assuming you have a function like update in appointmentTable to update the data
      await investigationsTable.update(investigationId, {
        predicted_diagnosis: req.body.predicted_diagnosis,
        notes: req.body.notes,
      });
  
      res.json({ success: true, message: 'Consultation updated successfully!' });
    } catch (error) {
      console.error('Error updating Consultation:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  router.post("/add-labtest", async (req, res) => {
    console.log('Received data:', req.body);
    let message = '';
  
    const values = {
      testname: req.body.testname,
      price: req.body.price,
      department: req.body.department,
      userId: req.body.userId,
      datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    };
  
    try {
      const inserted = await labTestTable.insert(values);
      if (inserted) {
        message = 'Lab Test added successfully!';
      } else {
        message = 'Failed to add Lab Test. Please try again.';
      }
      const notificationMessage = `${req.body.testname}`;
      await notificationTable.insert({ 
        message: notificationMessage, 
        testId: inserted.insertId,
        userId: req.body.userId,
        datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
      });
    } catch (error) {
      console.error('Error adding Lab Test:', error);
      message = 'Internal Server Error';
      res.status(500).send('Internal Server Error');
    }
  
    res.json({ message });
  });

  router.put("/update-labtest/:id", async (req, res) => {
    const labTestId = parseInt(req.params.id, 10);
  
    try {
      const existingLabTest = await labTestTable.find('id', labTestId);
  
      if (existingLabTest.length === 0) {
        res.status(404).json({ error: 'Lab Test not found' });
      } else {
        await labTestTable.update(labTestId, {
          testname: req.body.testname,
          price: req.body.price,
          department: req.body.department
        });
  
        res.json({ message: 'Lab Test updated successfully!' });
      }
    } catch (error) {
      console.error('Error updating Lab Test:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.delete("/delete-labtest/:id", async (req, res) => {
    const id = req.params.id; // Use req.params.id instead of req.query.id for DELETE requests
    
    try {
      await labTestTable.delete(id);
      res.json({ message: 'Lab Test deleted successfully!' });
    } catch (error) {
      console.error('Error deleting Lab Test:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  router.get("/get-labtest", async (req, res) => {
    try {
      const labTests = await labTestTable.findAll();
      res.json({ labTests });
    } catch (error) {
      console.error('Error fetching Lab Tests:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.post("/add-investigations", async (req, res) => {
    console.log('Received data:', req.body);
    let message = '';
  
    const values = {
      testname: req.body.testname,
      price: req.body.price,
      comments: req.body.comments,
      department: req.body.department,
      patientId: req.body.patientId,
      consultationId: req.body.consultationId,
      userId: req.body.userId,
      datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    };
  
    try {
      const inserted = await investigationsTable.insert(values);
      if (inserted) {
        message = 'Investigation added successfully!';
        investigationId = inserted.insertId;
        console.log('InvestigationId:', investigationId);
        // Retrieve the generated paymentId
      } else {
        message = 'Failed to add Investigation. Please try again.';
      }
    } catch (error) {
      console.error('Error adding Investigation:', error);
      message = 'Internal Server Error';
      res.status(500).send('Internal Server Error');
    }
  
    res.json({ message, id: investigationId});
  });

  router.post("/add-investigation-payments", async (req, res) => {
    let message = '';
  
    const values = {
      investigationId: req.body.investigationId,
      paymentId: req.body.paymentId,
      price: req.body.price,
      status: 'Not Paid'
    };
  
    try {
      const inserted = await investigation_paymentsTable.insertInvestigations(values);
      if (inserted) {
        message = 'Investigation submited successfully!';
      } else {
        message = 'Failed to submit Investigation. Please try again.';
      }
    } catch (error) {
      console.error('Error submit Investigation:', error);
      message = 'Internal Server Error';
      res.status(500).send('Internal Server Error');
    }
  
    res.json({ message });
  });

  router.put("/update-investigation-payments/:paymentId", async (req, res) => {
    const paymentId = parseInt(req.params.paymentId, 10);
  
    try {
        // Update all rows with the specified paymentId to have the status 'Has Paid'
        await investigation_paymentsTable.updateByPaymentId(paymentId, {
            status: 'Has Paid'
        });
  
        res.json({ message: 'Investigation payments updated successfully!' });
    } catch (error) {
        console.error('Error updating investigation payments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


  router.put("/update-payment/:id", async (req, res) => {
    const paymentId = parseInt(req.params.id, 10);
  
    try {
        const existingPayment = await paymentTable.find('id', paymentId);
  
        if (existingPayment.length === 0) {
            res.status(404).json({ error: 'Payment not found' });
        } else {
            await paymentTable.update(paymentId, {
                total_amount: req.body.total_amount,
                amount_paid: req.body.amount_paid,
                method: req.body.method,
                receiptNo: req.body.receiptNo,
                balance: req.body.balance,
                status: req.body.status,
                datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
            });

            // Get the updated payment data
            const updatedPayment = await paymentTable.find('id', paymentId);
  
            res.json({ message: 'Payment updated successfully!', id: paymentId, payment: updatedPayment[0] });
        }
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

  router.delete("/delete-investigations/:id", async (req, res) => {
    const investigationId = req.params.id;
  
    try {
      await investigationsTable.delete(investigationId);
      res.json({ message: 'Investigation deleted successfully!' });
    } catch (error) {
      console.error('Error deleting Investigation:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get("/get-investigations", async (req, res) => {
    try {
      const investigations = await investigationsTable.findAll();
      res.json({ investigations });
    } catch (error) {
      console.error('Error fetching Investigations:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get("/get-GroupedInvestigations", async (req, res) => {
    try {
      const Paidinvestigation = await patient_investigation_paymentsTable.find('investigation_status', "Has Paid");
      const NotPaidinvestigation = await patient_investigation_paymentsTable.find('investigation_status', "Not Paid")
      res.json({ Paidinvestigation, NotPaidinvestigation });
    } catch (error) {
      console.error('Error fetching presciptions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get("/get-investigation-payment-details/:paymentId", async (req, res) => {
    const paymentId = parseInt(req.params.paymentId, 10);
  
    try {
      const PaymentDetails = await patient_investigation_paymentsTable.find('paymentId', paymentId);
  
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