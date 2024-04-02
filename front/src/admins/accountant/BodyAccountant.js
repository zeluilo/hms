import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import 'moment-duration-format';
import { useAuth } from '../../components/containers/Context';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import 'react-datepicker/dist/react-datepicker.css';
import { DateRange } from 'react-date-range';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'; // Import date-fns functions

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
const BodyAccountant = () => {
  const { isLoggedIn } = useAuth();
  const [recentSales, setRecentSales] = useState([]);
  const { searchTerm, handleSearchChange, selectedStatus, handleStatusChange, dateRange, handleDateChange, filteredPatients, showDatePicker, toggleDatePicker } = usePatientSearchAndFilter(recentSales);
  const [pageIndex, setPageIndex] = useState(0);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [dailyTransactionCount, setDailyTransactionCount] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [monthlyTransactionCount, setMonthlyTransactionCount] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [yearlyTransactionCount, setYearlyTransactionCount] = useState(0);

  const entriesPerPage = 10;

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/thomas/get-payment-price');
        const { appointments, prescriptions, investigations } = response.data;

        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);

        // Calculate daily total payments
        const dailyAppointmentTotalAmount = appointments.reduce((total, appointment) => {
          const paymentDate = new Date(appointment.payment_datecreate);
          if (paymentDate >= startOfToday && paymentDate <= endOfToday) {
            return total + (appointment.total_amount || 0);
          }
          return total;
        }, 0);

        const dailyPrescriptionTotalAmount = prescriptions.reduce((total, prescription) => {
          const paymentDate = new Date(prescription.payment_datecreate);
          if (paymentDate >= startOfToday && paymentDate <= endOfToday) {
            return total + (prescription.prescription_price || 0);
          }
          return total;
        }, 0);

        const dailyInvestigationTotalAmount = investigations.reduce((total, investigation) => {
          const paymentDate = new Date(investigation.payment_datecreate);
          if (paymentDate >= startOfToday && paymentDate <= endOfToday) {
            return total + (investigation.investigation_price || 0);
          }
          return total;
        }, 0);

        const dailyTotalAmount = dailyAppointmentTotalAmount + dailyPrescriptionTotalAmount + dailyInvestigationTotalAmount;
        setDailyTotal(dailyTotalAmount);

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

        // Calculate yearly total payments
        const startOfCurrentYear = startOfYear(today);
        const endOfCurrentYear = endOfYear(today);

        const yearlyAppointmentTotalAmount = appointments.reduce((total, appointment) => {
          const paymentDate = new Date(appointment.payment_datecreate);
          if (paymentDate >= startOfCurrentYear && paymentDate <= endOfCurrentYear) {
            return total + (appointment.total_amount || 0);
          }
          return total;
        }, 0);

        const yearlyPrescriptionTotalAmount = prescriptions.reduce((total, prescription) => {
          const paymentDate = new Date(prescription.payment_datecreate);
          if (paymentDate >= startOfCurrentYear && paymentDate <= endOfCurrentYear) {
            return total + (prescription.prescription_price || 0);
          }
          return total;
        }, 0);

        const yearlyInvestigationTotalAmount = investigations.reduce((total, investigation) => {
          const paymentDate = new Date(investigation.payment_datecreate);
          if (paymentDate >= startOfCurrentYear && paymentDate <= endOfCurrentYear) {
            return total + (investigation.investigation_price || 0);
          }
          return total;
        }, 0);

        const yearlyTotalAmount = yearlyAppointmentTotalAmount + yearlyPrescriptionTotalAmount + yearlyInvestigationTotalAmount;
        setYearlyTotal(yearlyTotalAmount);

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
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        const dailyAppointmentTransactions = countTransactionsByDate(paidAppointmentsData, startOfToday, endOfToday);
        const dailyPrescriptionTransactions = countTransactionsByDate(groupedPrescriptions, startOfToday, endOfToday);
        const dailyInvestigationTransactions = countTransactionsByDate(groupedInvestigations, startOfToday, endOfToday);
        const dailyTotalTransactions = dailyAppointmentTransactions + dailyPrescriptionTransactions + dailyInvestigationTransactions;
        console.log('Daily Transactions:', dailyTotalTransactions);

        // Count transactions for the current month
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);
        const monthlyAppointmentTransactions = countTransactionsByDate(paidAppointmentsData, startOfCurrentMonth, endOfCurrentMonth);
        const monthlyPrescriptionTransactions = countTransactionsByDate(groupedPrescriptions, startOfCurrentMonth, endOfCurrentMonth);
        const monthlyInvestigationTransactions = countTransactionsByDate(groupedInvestigations, startOfCurrentMonth, endOfCurrentMonth);
        const monthlyTotalTransactions = monthlyAppointmentTransactions + monthlyPrescriptionTransactions + monthlyInvestigationTransactions;
        console.log('Monthly Transactions:', monthlyTotalTransactions);

        // Count transactions for the current year
        const startOfCurrentYear = startOfYear(today);
        const endOfCurrentYear = endOfYear(today);
        const yearlyAppointmentTransactions = countTransactionsByDate(paidAppointmentsData, startOfCurrentYear, endOfCurrentYear);
        const yearlyPrescriptionTransactions = countTransactionsByDate(groupedPrescriptions, startOfCurrentYear, endOfCurrentYear);
        const yearlyInvestigationTransactions = countTransactionsByDate(groupedInvestigations, startOfCurrentYear, endOfCurrentYear);
        const yearlyTotalTransactions = yearlyAppointmentTransactions + yearlyPrescriptionTransactions + yearlyInvestigationTransactions;
        console.log('Yearly Transactions:', yearlyTotalTransactions);

       // Update investigation count state with the array of objects
        setDailyTransactionCount(dailyTotalTransactions);
        setMonthlyTransactionCount(monthlyTotalTransactions);
        setYearlyTransactionCount(yearlyTotalTransactions);

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

              {/* Total Revenue Card */}
              <div className="col-xxl-4 col-md-6">
                <div className="card info-card sales-card">
                  <div className="card-body">
                    <h5 className="card-title">Today Payments</h5>
                    <div className="d-flex align-items-center" >
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#d4f8d4' }}>
                        <i className="bi bi-calendar2-day" style={{ color: '#4ce44c' }}></i>
                      </div>
                      <div className="ps-3">
                        <h6>₦{dailyTotal}</h6>
                        <span className="text-success small pt-1 fw-bold">{dailyTransactionCount}</span><span className="text-muted small pt-2 ps-1"> made transaction(s) today</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings Card */}
              <div className="col-xxl-4 col-md-6">
                <div className="card info-card sales-card">
                  <div className="card-body">
                    <h5 className="card-title">Monthly Payments</h5>
                    <div className="d-flex align-items-center" >
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#d4f8d4' }}>
                        <i className="bi bi-calendar2-month" style={{ color: '#4134A8' }}></i>
                      </div>
                      <div className="ps-3">
                        <h6>₦{monthlyTotal}</h6>
                        <span className="text-success small pt-1 fw-bold">{monthlyTransactionCount}</span><span className="text-muted small pt-2 ps-1"> made transaction(s) this month</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings Card */}
              <div className="col-xxl-4 col-md-6">
                <div className="card info-card sales-card">
                  <div className="card-body">
                    <h5 className="card-title">Yearly Payments</h5>
                    <div className="d-flex align-items-center" >
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#d4f8d4' }}>
                        <i className="bi bi-calendar3" style={{ color: '#FF8000' }}></i>
                      </div>
                      <div className="ps-3">
                        <h6>₦{yearlyTotal}</h6>
                        <span className="text-success small pt-1 fw-bold">{yearlyTransactionCount}</span><span className="text-muted small pt-2 ps-1">transaction(s) made this year</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="card recent-sales overflow-auto">

                  <div className="card-body">
                    <h5 className="card-title">Transactions <span></span></h5>
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
        </div>
      </section>

      <div className="card">
        <div className="modal fade" id="info" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Invoice Unavailable</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <strong>This invoice could not be found in our system.</strong><br />This service was Free.
                <div className="text-center">
                  <button type="submit" data-bs-dismiss="modal" className="btn btn-danger">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BodyAccountant;
