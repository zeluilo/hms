import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import 'moment-duration-format';

import Calendar from '../../pages/calendar/Calendar';  // Import moment library
import { useAuth } from '../../components/containers/Context'; // Adjust the path as needed

const BodyDoctor = ({ location }) => {
  const { currentUser, isLoggedIn } = useAuth();
  const [patients, setPatients] = useState([]);
  const [unpaidBookingsCount, setUnpaidBookingsCount] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [calendarData, setCalendarData] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);

  const userDepartment = currentUser?.department;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch calendar data
        const calendarResponse = await axios.get(`http://localhost:3001/thomas/get_doctors_calendar/${userDepartment}`);
        const fetchedCalendarData = calendarResponse.data.calendarData;
        setCalendarData(fetchedCalendarData); // Update calendarData state
        console.log('Fetched Calendar Data:', fetchedCalendarData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all appointments
        const appointmentsResponse = await axios.get(`http://localhost:3001/thomas/get_doctors_queue/${userDepartment}`);
        setUnpaidBookingsCount(appointmentsResponse.data.appointments);

        // Fetch patients
        const patientsResponse = await axios.get('http://localhost:3001/thomas/managepatients');
        setPatients(patientsResponse.data.patients);


      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    fetchData();
  }, []);

  const calculateTimeDifference = (bookingDate) => {
    const now = moment();
    const appointmentTime = moment(bookingDate);
    const diff = moment.duration(now.diff(appointmentTime));

    return diff.humanize();
  };

  useEffect(() => {
    const successMessage = location?.state?.successMessage;

    if (successMessage) {
      window.onload = function () {
        alert(successMessage);
      };
    }
  }, [location]);

  return (

    <main id="main" className="main">
      <div className="pagetitle">
        <h1>Dashboard</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="index.html">Home</Link></li>
            <li className="breadcrumb-item active">Dashboard</li>
          </ol>
        </nav>
      </div>

      <section className="section dashboard">
        <div className="col-lg-12">
          <div className="row">

            {/* Patients Card */}
            <div className="col-xxl-4 col-md-6">
              <div className="card info-card sales-card">
                <div className="card-body">
                  <h5 className="card-title">Patients</h5>
                  <div className="d-flex align-items-center">
                    <div className="card-icon rounded-circle d-flex align-items-center justify-content-center">
                      <i className="bi bi-person-plus-fill"></i>
                    </div>
                    <div className="ps-3">
                      <h6>{patients.length}</h6>
                      <span className="text-success small pt-1 fw-bold">{patients.length}</span><span className="text-muted small pt-2 ps-1"> Registered patients</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bookings Card */}
            <div className="col-xxl-4 col-md-6">
              <div className="card info-card sales-card">
                <div className="card-body">
                  <h5 className="card-title">Appointments</h5>
                  <div className="d-flex align-items-center">
                    <div className="card-icon rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#ffdd9d' }}>
                      <i className="bi bi-people" style={{ color: '#ffa600' }}></i>
                    </div>
                    <div className="ps-3">
                      <h6>{unpaidBookingsCount.length}</h6>
                      <span className="text-success small pt-1 fw-bold">{unpaidBookingsCount.length}</span><span className="text-muted small pt-2 ps-1"> Patients been booked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Patients Card */}
            <div className="col-xxl-4 col-md-6">
              <div className="card info-card sales-card">
                <div className="card-body">
                  <h5 className="card-title">Total Patients</h5>
                  <div className="d-flex align-items-center">
                    <div className="card-icon rounded-circle d-flex align-items-center justify-content-center">
                      <i className="ri-emotion-fill" style={{ color: '#FF00BF' }}></i>
                    </div>
                    <div className="ps-3">
                      <h6>{patients.length}</h6>
                      <span className="text-success small pt-1 fw-bold">{patients.length}</span><span className="text-muted small pt-2 ps-1"> Patients treated this year</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side columns */}

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Appointments <span>/Today</span></h5>
                <Calendar calendarData={calendarData} />
              </div>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
};

export default BodyDoctor;
