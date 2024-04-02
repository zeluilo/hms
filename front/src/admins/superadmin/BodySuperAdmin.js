import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import 'moment-duration-format';
import { useAuth } from '../../components/containers/Context';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import 'react-datepicker/dist/react-datepicker.css';
import { DateRange } from 'react-date-range';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import ApexChart from 'react-apexcharts';

const usePatientSearchAndFilter = (initialPatients) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filteredPatients, setFilteredPatients] = useState(initialPatients);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    key: 'selection',
  });

  const [showDatePicker, setShowDatePicker] = useState(false); // New state for showing/hiding the date picker


  const filterPatients = (patients, term, status, startDate, endDate) => {
    let filtered = patients;

    // Filter by search term
    if (term.trim()) {
      const lowerCaseSearchTerm = term.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.firstname.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.lastname.toLowerCase().includes(lowerCaseSearchTerm) ||
        String(patient.pId).toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // Filter by status
    if (status.trim()) {
      filtered = filtered.filter(patient => patient.status === status || patient.payment_status === status);
    }

    // Filter by date range
    if (startDate && endDate) {
      console.log("Filtering by date range:", startDate, endDate);
      console.log("Filtering patients:", patients);
      filtered = filtered.filter(patient => {
        const bookingDate = new Date(patient.booking_datecreate);
        const prescriptionDate = new Date(patient.prescription_datecreate);
        const paymentDate = new Date(patient.payment_datecreate);

        console.log("Booking Date:", bookingDate);
        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);

        // Check if any of the dates fall within the date range
        return (
          (bookingDate >= startDate && bookingDate <= endDate) ||
          (prescriptionDate >= startDate && prescriptionDate <= endDate) ||
          (paymentDate >= startDate && paymentDate <= endDate)
        );
      });

      console.log("Filtered patients:", filtered); // Log the filtered variable
    }

    setFilteredPatients(filtered);
  };


  const handleSearchChange = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
  };

  const handleStatusChange = (event) => {
    const status = event.target.value;
    setSelectedStatus(status);
  };

  const handleDateChange = (ranges) => {
    setDateRange(ranges.selection);
  };

  const toggleDatePicker = () => {
    if (showDatePicker) {
      // If the date picker is currently shown, hide it and reset the date range
      setShowDatePicker(false);
      setDateRange({ startDate: null, endDate: null, key: 'selection' });
    } else {
      // If the date picker is not shown, show it
      setShowDatePicker(true);
      if (dateRange.startDate && dateRange.endDate) {
        // If a date range is selected, filter patients based on the date range
        filterPatients(filteredPatients, searchTerm, selectedStatus, dateRange.startDate, dateRange.endDate);
      } else {
        // If no date range is selected, set filteredPatients to recentSales
        setFilteredPatients(filteredPatients);
      }
    }
  };


  useEffect(() => {
    filterPatients(initialPatients, searchTerm, selectedStatus, dateRange.startDate, dateRange.endDate);
  }, [initialPatients, searchTerm, selectedStatus, dateRange]);

  return {
    searchTerm,
    handleSearchChange,
    selectedStatus,
    handleStatusChange,
    dateRange,
    handleDateChange,
    filteredPatients,
    showDatePicker,
    toggleDatePicker
  };
};

const BodySuperAdmin = () => {
  const [patients, setPatients] = useState([]);
  const [prescription, setPrescriptions] = useState([]);
  const [sortPatients, setSortedPatients] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [recentSales, setRecentSales] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentCount, setAppointmentCounts] = useState([]);
  const [monthlyPayments, setMonthlyPayments] = useState([]);
  const {searchTerm, handleSearchChange, selectedStatus, handleStatusChange, dateRange, handleDateChange, filteredPatients, showDatePicker, toggleDatePicker } = usePatientSearchAndFilter(recentSales);
  const [monthlyTransactionCount, setMonthlyTransactionCount] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const entriesPerPage = 5;

  // Assume your data is an array of entries
  const entries = filteredPatients.slice(pageIndex * entriesPerPage, (pageIndex + 1) * entriesPerPage);

  const totalPages = Math.ceil(filteredPatients.length / entriesPerPage);

  // Function to handle pagination
  const handleNextPage = () => {
    if (pageIndex < totalPages - 1) {
      setPageIndex(prevIndex => prevIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      setPageIndex(prevIndex => prevIndex - 1);
    }
  };

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'Has Paid':
        return 'bg-success';
      case 'Not Paid':
        return 'bg-warning';
      case 'Rejected':
        return 'bg-danger';
      default:
        return '';
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/thomas/get-payment-data');
        const { appointments, prescriptions, investigations } = response.data;

        console.log('Response Data:', response.data);

        // Combine appointments and prescriptions
        const mergedData = [...appointments.map(appointment => ({ ...appointment, type: 'appointment' })),
        ...prescriptions.map(prescription => ({ ...prescription, type: 'prescription' })),
        ...investigations.map(investigation => ({ ...investigation, type: 'investigation' }))];

        setRecentSales(mergedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Monthly Report Chart
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/thomas/get-payment-price');
        const { appointments, prescriptions, investigations } = response.data;

        console.log('Appointments:', appointments);
        // Calculate total_amount for each month
        const monthlyTotalAmounts = {};
        const monthlyPrescriptionPrices = {};
        const monthlyInvestigationPrices = {};

        appointments.forEach(appointment => {
          const paymentDate = new Date(appointment.payment_datecreate);
          const monthKey = format(paymentDate, 'yyyy-MM');

          if (!monthlyTotalAmounts[monthKey]) {
            monthlyTotalAmounts[monthKey] = 0;
          }

          monthlyTotalAmounts[monthKey] += parseFloat(appointment.total_amount) || 0;
        });

        prescriptions.forEach(prescription => {
          const paymentDate = new Date(prescription.payment_datecreate);
          const monthKey = format(paymentDate, 'yyyy-MM');

          if (!monthlyPrescriptionPrices[monthKey]) {
            monthlyPrescriptionPrices[monthKey] = 0;
          }

          monthlyPrescriptionPrices[monthKey] += parseFloat(prescription.prescription_price) || 0;
        });

        investigations.forEach(investigation => {
          const paymentDate = new Date(investigation.payment_datecreate);
          const monthKey = format(paymentDate, 'yyyy-MM');

          if (!monthlyInvestigationPrices[monthKey]) {
            monthlyInvestigationPrices[monthKey] = 0;
          }

          monthlyInvestigationPrices[monthKey] += parseFloat(investigation.investigation_price) || 0;
        });

        // Combine total amounts and prescription prices into a single object
        const monthlyPayments = {};
        Object.keys(monthlyTotalAmounts).forEach(month => {
          monthlyPayments[month] = {
            totalAmount: monthlyTotalAmounts[month],
            prescriptionPrice: monthlyPrescriptionPrices[month] || 0,
            investigationPrice: monthlyInvestigationPrices[month] || 0,
            totalPayment: monthlyTotalAmounts[month] + (monthlyPrescriptionPrices[month] || 0) + (monthlyInvestigationPrices[month] || 0)
          };
        });

        setMonthlyPayments(monthlyPayments);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter out invalid or missing dates and format them properly
  const validMonthlyPayments = Object.entries(monthlyPayments)
    .filter(([month]) => month !== 'Invalid Date' && month !== undefined)
    .map(([month, payment]) => ({
      month: format(new Date(month), 'MMM yyyy'),
      ...payment
    }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all appointments
        const appointmentsResponse = await axios.get('http://localhost:3001/thomas/getallbookings');
        const allAppointments = appointmentsResponse.data.appointments;
        setAppointmentCounts(allAppointments)

        // Filter appointments where booking datecreate matches today's date
        const today = new Date();
        const todayDateString = today.toISOString().slice(0, 10);
        const todaysAppointments = allAppointments.filter(appointment => appointment.booking_datecreate.slice(0, 10) === todayDateString);

        // Limit to 5 appointments
        const limitedTodaysAppointments = todaysAppointments.slice(0, 5);

        // Update state with the limited appointments
        setAppointments(limitedTodaysAppointments);

        // Fetch patients
        const patientsResponse = await axios.get('http://localhost:3001/thomas/managepatients');
        const fetchedPatients = patientsResponse.data.patients;
        setPatients(fetchedPatients);

        // Sort the fetched patients by datecreate
        const sortedPatients = [...fetchedPatients].sort((a, b) => new Date(b.datecreate) - new Date(a.datecreate));
        setSortedPatients(sortedPatients);

        const prescriptionResponse = await axios.get('http://localhost:3001/thomas/get-prescriptions');
        const fetchedPrescriptions = prescriptionResponse.data.prescriptions;
        setPrescriptions(fetchedPrescriptions);

      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    fetchData();
  }, []);

  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    return `${formattedHours}:${String(minutes).padStart(2, '0')}${period}`;
  };

  const calculateTimeDifference = (bookingDate) => {
    const now = moment();
    const appointmentTime = moment(bookingDate);
    const diff = moment.duration(now.diff(appointmentTime));

    return diff.humanize();
  };

  // Recent Transaction Table
  function TableRow({ index, pId, patient, service, price, status, date, type, bookingId, paymentId }) {
    return (
      <tr>
        <th scope="row">{index}</th>
        <td>{patient}</td>
        <td>
          {type === 'appointment' && status === 'Not Paid' && (
            <Link to={`/receptionist-unpaid-debts`} className="text-primary">
              {service}
            </Link>
          )}
          {type === 'appointment' && price !== 'Free' && status !== 'Not Paid' && (
            <Link to={`/receptionist-invoice/${bookingId}`} className="text-primary">
              {service}
            </Link>
          )}
          {type === 'appointment' && price === 'Free' && status !== 'Not Paid' && (
            <Link data-bs-toggle="modal" data-bs-target="#info" className="text-primary">
              {service}
            </Link>
          )}
          {type === 'prescription' && status === 'Not Paid' && (
            <Link to={`/pharmacist-unpaid-debts`} className="text-primary">
              {service}
            </Link>
          )}
          {type === 'prescription' && status !== 'Not Paid' && (
            <Link to={`/pharmacist-invoice/${paymentId}`} className="text-primary">
              {service}
            </Link>
          )}
          {type === 'investigation' && status === 'Not Paid' && (
            <Link to={`/doctor-unpaid-debts`} className="text-primary">
              {service}
            </Link>
          )}
          {type === 'investigation' && status !== 'Not Paid' && (
            <Link to={`/doctor-invoice/${paymentId}`} className="text-primary">
              {service}
            </Link>
          )}
        </td>
        <td>{price}</td>
        <td><span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span></td>
        <td>{date}</td>
      </tr>
    );
  }

  const getDateBasedOnConditions = (sale) => {
    // console.log('Sale:', sale);
    if (sale.type === 'appointment') {
      if (sale.status === 'Has Paid') {
        // console.log('Payment Date Create:', sale.payment_datecreate);
        return sale.payment_datecreate
          ? format(new Date(sale.payment_datecreate), 'yyyy/MM/dd HH:mm:ss')
          : format(new Date(sale.booking_datecreate), 'yyyy/MM/dd HH:mm:ss');
      } else if (sale.status === 'Not Paid') {
        // console.log('Booking Date Create:', sale.booking_datecreate);
        return sale.booking_datecreate
          ? format(new Date(sale.booking_datecreate), 'yyyy/MM/dd HH:mm:ss')
          : 'Date Not Specified';
      } else {
        // console.log('Date Not Specified');
        return 'Date Not Specified';
      }
    } else if (sale.type === 'prescription') {
      if (sale.status === 'Has Paid') {
        // console.log('Payment Date Create (Prescription):', sale.payment_datecreate);
        return sale.payment_datecreate
          ? format(new Date(sale.payment_datecreate), 'yyyy/MM/dd HH:mm:ss')
          : 'Date Not Specified';
      } else if (sale.status === 'Not Paid') {
        // console.log('Prescription Date Create:', sale.prescription_datecreate);
        return sale.prescription_datecreate
          ? format(new Date(sale.prescription_datecreate), 'yyyy/MM/dd HH:mm:ss')
          : 'Date Not Specified';
      } else {
        // console.log('Date Not Specified');
        return 'Date Not Specified';
      }
    } else if (sale.type === 'investigation') {
      if (sale.payment_status === 'Has Paid') {
        // console.log('Payment Date Create (Prescription):', sale.payment_datecreate);
        return sale.payment_datecreate
          ? format(new Date(sale.payment_datecreate), 'yyyy/MM/dd HH:mm:ss')
          : 'Date Not Specified';
      } else if (sale.status === 'Not Paid') {
        // console.log('Prescription Date Create:', sale.prescription_datecreate);
        return sale.investigation_datecreate
          ? format(new Date(sale.investigation_datecreate), 'yyyy/MM/dd HH:mm:ss')
          : 'Date Not Specified';
      } else {
        // console.log('Date Not Specified');
        return 'Date Not Specified';
      }
    } else {
      // console.log('Date Not Specified');
      return 'Date Not Specified';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/thomas/get-payment-price');
        const { appointments, prescriptions, investigations } = response.data;

        const today = new Date();

        // Calculate monthly total payments
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);

        const monthlyAppointmentTotalAmount = appointments.reduce((total, appointment) => {
          const paymentDate = new Date(appointment.payment_datecreate);
          if (paymentDate >= startOfCurrentMonth && paymentDate <= endOfCurrentMonth) {
            return total + (appointment.total_amount || 0);
          }
          return total;
        }, 0);

        const monthlyPrescriptionTotalAmount = prescriptions.reduce((total, prescription) => {
          const paymentDate = new Date(prescription.payment_datecreate);
          if (paymentDate >= startOfCurrentMonth && paymentDate <= endOfCurrentMonth) {
            return total + (prescription.prescription_price || 0);
          }
          return total;
        }, 0);

        const monthlyInvestigationTotalAmount = investigations.reduce((total, investigation) => {
          const paymentDate = new Date(investigation.payment_datecreate);
          if (paymentDate >= startOfCurrentMonth && paymentDate <= endOfCurrentMonth) {
            return total + (investigation.investigation_price || 0);
          }
          return total;
        }, 0);

        const monthlyTotalAmount = monthlyAppointmentTotalAmount + monthlyPrescriptionTotalAmount + monthlyInvestigationTotalAmount;
        setMonthlyTotal(monthlyTotalAmount);       

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch grouped investigations data
        const investigations_response = await axios.get('http://localhost:3001/thomas/get-GroupedInvestigations');
        console.log('Response:', investigations_response.data); // Log the investigations_response to check its structure
        const paidInvestigationsData = investigations_response.data.Paidinvestigation || [];

        const prescriptions_response = await axios.get('http://localhost:3001/thomas/get-GroupedPrescriptions');
        console.log('Response:', prescriptions_response.data); // Log the prescriptions_response to check its structure
        const paidPrescriptionsData = prescriptions_response.data.Paidprescription || [];

        const appointment_response = await axios.get('http://localhost:3001/thomas/get-grouped-appointments');
        console.log('Response:', appointment_response.data); // Log the prescriptions_response to check its structure
        const paidAppointmentsData = appointment_response.data.PaidBookings || [];

        // Group prescriptions and investigations by payment ID and payment date
        const groupedPrescriptions = groupByPaymentId([...paidPrescriptionsData]);
        console.log('Grouped prescriptions:', groupedPrescriptions);
        const groupedInvestigations = groupByPaymentId([...paidInvestigationsData]);
        console.log('Grouped investigations:', groupedInvestigations);

        // Count appointments, prescriptions, and investigations
        const appointmentCount = paidAppointmentsData.length;
        console.log('Appointments:', appointmentCount);

        const prescriptionCounts = groupedPrescriptions.length
        console.log('Prescriptions:', prescriptionCounts);

        const investigationCounts = groupedInvestigations.length
        console.log('Investigations:', investigationCounts);

        // Count transactions according to today
        const today = new Date();
        // Count transactions for the current month
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);
        const monthlyAppointmentTransactions = countTransactionsByDate(paidAppointmentsData, startOfCurrentMonth, endOfCurrentMonth);
        const monthlyPrescriptionTransactions = countTransactionsByDate(groupedPrescriptions, startOfCurrentMonth, endOfCurrentMonth);
        const monthlyInvestigationTransactions = countTransactionsByDate(groupedInvestigations, startOfCurrentMonth, endOfCurrentMonth);
        const monthlyTotalTransactions = monthlyAppointmentTransactions + monthlyPrescriptionTransactions + monthlyInvestigationTransactions;
        console.log('Monthly Transactions:', monthlyTotalTransactions);

       // Update investigation count state with the array of objects
        setMonthlyTransactionCount(monthlyTotalTransactions);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Function to group data by payment ID and payment date
  const groupByPaymentId = (data) => {
    const groupedData = {};
    data.forEach((item) => {
      const { paymentId, payment_datecreate } = item;
      const paymentKey = `${paymentId}_${payment_datecreate}`; // Composite key
      if (!groupedData[paymentKey]) {
        groupedData[paymentKey] = [];
      }
      groupedData[paymentKey].push(item);
    });

    // Separate paymentId and paymentDate into separate fields in the grouped data
    const separatedData = Object.keys(groupedData).map(paymentKey => {
      const [paymentId, payment_datecreate] = paymentKey.split('_');
      return {
        paymentId,
        payment_datecreate,
        items: groupedData[paymentKey]
      };
    });

    return separatedData;
  };

  // Function to count transactions within a specific date range
  const countTransactionsByDate = (data, startDate, endDate) => {
    return data.filter(item => {
      const paymentDate = new Date(item.payment_datecreate);
      return paymentDate >= startDate && paymentDate <= endDate;
    }).length;
  };

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
        <div className="row">

          {/* Left side columns */}
          <div className="col-lg-12">
            <div className="row">

              {/* Patients Card */}
              <div className="col-xxl-3 col-md-3">
                <div className="card info-card sales-card">
                  <div className="card-body">
                    <h5 className="card-title">Patients</h5>
                    <div className="d-flex align-items-center">
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center">
                        <i className="bi bi-person-plus-fill"></i>
                      </div>
                      <div className="ps-3">
                        <h6>{patients.length}</h6>
                        <span className="text-success fw-bold">{patients.length}</span><span className="text-muted small pt-2 ps-1"> registered patients</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xxl-3 col-md-3">
                <div className="card info-card sales-card">
                  <div className="card-body">
                    <h5 className="card-title">Prescriptions</h5>
                    <div className="d-flex align-items-center">
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#F4C7C7' }}>
                        <i className="ri ri-first-aid-kit-line" style={{ color: 'rgb(184, 35, 35)' }}></i>
                      </div>
                      <div className="ps-3">
                        <h6>{prescription.length}</h6>
                        <span className="text-success fw-bold">{prescription.length}</span><span className="text-muted small pt-2 ps-1"> medications prescribed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings Card */}
              <div className="col-xxl-3 col-md-3">
                <div className="card info-card sales-card">
                  <div className="card-body">
                    <h5 className="card-title">Appointments</h5>
                    <div className="d-flex align-items-center">
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#ffdd9d' }}>
                        <i className="bi bi-people" style={{ color: '#ffa600' }}></i>
                      </div>
                      <div className="ps-3">
                        <h6>{appointmentCount.length}</h6>
                        <span className="text-success fw-bold">{appointmentCount.length}</span><span className="text-muted small pt-2 ps-1"> total appointments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Revenue Card */}
              <div className="col-xxl-3 col-md-3">
                <div className="card info-card sales-card">
                  <div className="card-body">
                    <h5 className="card-title">Total Revenue</h5>
                    <div className="d-flex align-items-center" >
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#d4f8d4' }}>
                        <i className="bi bi-cash" style={{ color: '#4ce44c' }}></i>
                      </div>
                      <div className="ps-3">
                        <h6>₦{monthlyTotal}</h6>
                        <span className="text-success small pt-1 fw-bold">{monthlyTransactionCount}</span><span className="text-muted small pt-2 ps-1"> transaction(s) this month</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Left Columns */}
          <div className="col-8">
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Monthly Reports</h5>
                    <ApexChart
                      options={{
                        chart: {
                          height: 350,
                          type: 'area',
                          toolbar: {
                            show: false
                          }
                        },
                        xaxis: {
                          categories: validMonthlyPayments.map(payment => payment.month),
                          labels: {
                            rotate: -45,
                            formatter: value => value
                          }
                        },
                        yaxis: {
                          title: {
                            text: 'Total Payments (Naira)'
                          }
                        },
                        dataLabels: {
                          enabled: false
                        },
                        markers: {
                          size: 4
                        },
                        colors: ['#4154f1', '#2eca6a', '#ff771d', '#B7FF00'],
                        fill: {
                          type: "gradient",
                          gradient: {
                            shadeIntensity: 1,
                            opacityFrom: 0.3,
                            opacityTo: 0.4,
                            stops: [0, 90, 100]
                          }
                        },
                        stroke: {
                          curve: 'smooth',
                          width: 2
                        }
                      }}
                      series={[
                        {
                          name: 'Total Price from Appointments',
                          data: validMonthlyPayments.map(payment => payment.totalAmount)
                        },
                        {
                          name: 'Total Price from Pharmacy',
                          data: validMonthlyPayments.map(payment => payment.prescriptionPrice)
                        },
                        {
                          name: 'Total Price from Doctors',
                          data: validMonthlyPayments.map(payment => payment.investigationPrice)
                        },
                        {
                          name: 'Total Amount Made',
                          data: validMonthlyPayments.map(payment => payment.totalPayment)
                        }
                      ]}
                      type="area"
                      height={350}
                    />
                  </div>
                </div>
                <div className="card recent-sales overflow-auto">
                  <div className="card-body">
                    <h5 className="card-title"> Recent Transactions <span></span></h5>
                    <div className="row">
                      <div className="col-4">
                        <input
                          className="form-control"
                          placeholder="Search by pid/name"
                          type="search"
                          title="Search within table"
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                        />
                      </div>
                      <div className="col-4">
                        {/* Display the selected date range */}
                        <p className="form-control" onClick={toggleDatePicker}>
                          {dateRange.startDate && dateRange.endDate
                            ? `${format(dateRange.startDate, 'MM/dd/yyyy')} - ${format(dateRange.endDate, 'MM/dd/yyyy')}`
                            : 'Select Date Range'}
                        </p>
                        {/* Render the Date Range Picker when showDatePicker is true */}
                        {showDatePicker && (
                          <DateRange
                            onChange={handleDateChange}
                            ranges={[dateRange]}
                            editableDateInputs={true}
                            moveRangeOnFirstSelection={false}
                            className="form-control"
                          />
                        )}
                        {/* Display a message if no patients are found */}
                        {filteredPatients.length === 0 && (
                          <p>No patients found within the specified date range.</p>
                        )}
                      </div>

                      <div className="col-4">
                        <select onChange={handleStatusChange} value={selectedStatus} className="form-select">
                          <option value=''>All Status</option>
                          <option>Has Paid</option>
                          <option>Not Paid</option>
                        </select>
                      </div>
                    </div>

                    <table className="table table-hover table-bordered">
                      <thead className='table table-primary'>
                        <tr>
                          <th scope="col">#</th>
                          <th scope="col">Patient</th>
                          <th scope="col">Service</th>
                          <th scope="col">Price</th>
                          <th scope="col">Status</th>
                          <th scope="col">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((sale, index) => (
                          <TableRow
                            key={index}
                            index={index + pageIndex * entriesPerPage + 1}
                            {...sale}
                            patient={`${recentSales.find(patient => patient.pId === sale.pId)?.firstname} ${recentSales.find(patient => patient.pId === sale.pId)?.lastname}`}
                            bookingId={sale.bookingId}
                            paymentId={sale.paymentId}
                            pId={sale.pId}
                            service={sale.type === 'appointment' ? sale.typeofvisit : sale.type === 'prescription' ? sale.drugname : sale.type === 'investigation' ? sale.testname : 'Service Not Specified'}
                            price={sale.type === 'appointment'
                              ? sale.price === 0
                                ? 'Free'
                                : `₦${sale.price}`
                              : sale.type === 'prescription'
                                ? sale.prescription_price === null
                                  ? `₦${sale.price}`
                                  : `₦${sale.prescription_price}`
                                : sale.type === 'investigation'
                                  ? sale.investigation_price === null
                                    ? `₦${sale.price}`
                                    : `₦${sale.investigation_price}`
                                  : 'Price Not Specified'}
                            date={getDateBasedOnConditions(sale)}
                            status={sale.type === 'investigation' ? sale.payment_status : sale.status}
                          />
                        ))}
                      </tbody>
                    </table>
                    <div>
                      <button onClick={handlePrevPage} disabled={pageIndex === 0}>Previous</button>&nbsp;
                      Showing {pageIndex * entriesPerPage + 1} to {Math.min((pageIndex + 1) * entriesPerPage, recentSales.length)} of {recentSales.length} entries
                      &nbsp;<button onClick={handleNextPage} disabled={pageIndex === totalPages - 1}>Next</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*End of Left Columns */}

          {/* Right Columns */}
          <div className="col-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Recently Registered Patients</h5>
                <div className="activity">
                  {sortPatients.slice(0, 5).map((patient) => (
                    <div className="activity-item" key={patient.pId}>
                      <div>
                        <table className="table">
                          <tbody>
                            <tr>
                              <td>
                                <img src="assets/img/profile-img.jpg" style={{ width: '40px' }} alt="Profile" className="rounded-circle me-2" />
                              </td>
                              <td>
                                <Link to={`/managepatient`} style={{ fontSize: '1rem' }} className="fw-bold text-dark d-block">
                                  {patient.firstname} {patient.lastname}
                                </Link>
                                <p className="m-0" style={{ fontSize: '0.8rem' }}>{patient.number}</p>
                              </td>
                              <td>
                                <p className="m-3" style={{ fontSize: '0.8rem' }}>
                                  {formatTime(patient.datecreate)}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Today's Appointments</h5>

                <div className="activity">
                  {appointments.length === 0 ? (
                    <p>No appointments scheduled for today.</p>
                  ) : (
                    appointments.slice(0, 5).map((appointment) => (
                      <div className="activity-item d-flex" key={appointment.pId}>
                        <div className="activite-label">
                          {calculateTimeDifference(appointment.booking_datecreate)} ago
                        </div>
                        <i
                          className={`bi bi-circle-fill activity-badge ${appointment.visited === 'Visited'
                            ? 'text-success'
                            : appointment.visited === "Hasn't Visited"
                              ? 'text-primary'
                              : 'text-danger'
                            } align-self-start`}
                        ></i>
                        <div className="activity-content">
                          {appointment.visited === 'Has Visited' ? (
                            <>
                              Appointment with{' '}
                              <Link
                                to={`/managepatient/${appointment.pId}`}
                                className="fw-bold text-dark"
                              >
                                {appointment.firstname} {appointment.lastname}
                              </Link>{' '}
                              completed
                            </>
                          ) : (
                            <>
                              Upcoming appointment with{' '}
                              <Link
                                to={`/patient/${appointment.pId}`}
                                className="fw-bold text-dark"
                              >
                                {appointment.firstname} {appointment.lastname}
                              </Link>
                              {' '}on {new Date(appointment.timetovisit).toLocaleString('en-Uk', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          {/*End of Right Columns */}

        </div>
      </section >
    </main >
  );
};

export default BodySuperAdmin;
