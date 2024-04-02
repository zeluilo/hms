import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import 'moment-duration-format';

import Calendar from '../../pages/calendar/Calendar';  // Import moment library
import { useAuth } from '../../components/containers/Context'; // Adjust the path as needed
import { format } from 'date-fns';

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


  const filterPatients = (patients, term) => {
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
        // If no date range is selected, set filteredPatients to prescriptions
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

const BodyPharmacist = ({ location }) => {
  const { isLoggedIn } = useAuth();
  const [drugs, setDrugs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const { searchTerm, handleSearchChange, filteredPatients } = usePatientSearchAndFilter(prescriptions);
  const [totalPayments, setTotalPayments] = useState(0);
  const [payments, setPayments] = useState([]);
  const [paymentDetails, setpaymentDetails] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);

  const entriesPerPage = 6;

  // Assume your data is an array of entries
  const sortedEntries = filteredPatients.sort((a, b) => {
    // Convert date strings to Date objects
    const dateA = new Date(a.prescription_datecreate);
    const dateB = new Date(b.prescription_datecreate);
    // Sort in descending order based on date
    return dateB - dateA;
  });
  
  // Then slice the sorted array
  const entries = sortedEntries.slice(pageIndex * entriesPerPage, (pageIndex + 1) * entriesPerPage);
  
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

  useEffect(() => {
    const fetchData = async () => {
      try {

        // Fetch patients
        const drugsResponse = await axios.get('http://localhost:3001/thomas/get-drugs');
        setDrugs(drugsResponse.data.drugs);

        // Fetch count of unpaid bookings
        const prescriptionResponse = await axios.get('http://localhost:3001/thomas/get-prescriptions');
        setPrescriptions(prescriptionResponse.data.prescriptions);

        // Fetch payments
        const paymentsResponse = await axios.get('http://localhost:3001/thomas/get-GroupedPrescriptions');
        const billingData = paymentsResponse.data.Paidprescription;
        console.log('Billing Data:', billingData);
        setPayments(billingData)

        // Calculate Revenue
        const totalAmount = billingData.reduce((total, billing) => {
          return total + (billing.total_amount || 0);
        }, 0);
        setTotalPayments(totalAmount);

        setpaymentDetails(paymentsResponse.data.prescriptions)


      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    fetchData();
  }, []);

  function TableRow({ index, patient, drug, price, doctor, date}) {
    return (
      <tr>
        <th scope="row">{index}</th>
        <td>{patient}</td>
        <td>{drug}</td>
        <td>₦{price}</td>
        <td>{doctor}</td>
        <td>{date}</td>
      </tr>
    );
  }

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
                    <h5 className="card-title">Registered Drugs</h5>
                    <div className="d-flex align-items-center" >
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#E3DB0D' }}>
                        <i className="ri ri-capsule-fill" style={{ color: '#FFFEE5' }}></i>
                      </div>
                      <div className="ps-3">
                        <h6>{drugs.length}</h6>
                        <span className="text-muted small pt-2 ps-1">A total of </span><span className="text-success fw-bold">{drugs.length}</span><span className="text-muted small pt-2 ps-1"> drugs registered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Revenue Card */}
              <div className="col-xxl-4 col-md-6">
                <div className="card info-card sales-card">
                  <div className="card-body">
                    <h5 className="card-title">Prescriptions Made</h5>
                    <div className="d-flex align-items-center" >
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#ffdd9d' }}>
                        <i className="bi bi-people" style={{ color: '#ffa600' }}></i>                      
                      </div>
                      <div className="ps-3">
                        <h6>{prescriptions.length}</h6>
                        <span className="text-success fw-bold">{prescriptions.length}</span><span className="text-muted small pt-2 ps-1"> medications prescribed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings Card */}
              <div className="col-xxl-4 col-md-6">
                <div className="card info-card sales-card">
                  <div className="card-body">
                    <h5 className="card-title">Total Revenue</h5>
                    <div className="d-flex align-items-center">
                    <div className="card-icon rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#d4f8d4' }}>
                        <i className="bi bi-cash"  style={{ color: '#4ce44c' }}></i>
                      </div>
                      <div className="ps-3">
                        <h6>₦{totalPayments}</h6>
                        <span className="text-success fw-bold">{payments.length}</span><span className="text-muted small pt-2 ps-1"> payments made</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <div className="card info-card sales-card">
                <div className="card-body">
                    <h5 className="card-title">Prescriptions <span></span></h5>
                    <div className="row">
                      <div className="col-8">
                        <input
                          className="form-control"
                          placeholder="Search by pId/ Patient Name"
                          type="search"
                          title="Search within table"
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                        />
                      </div>
                    </div><br/>

                    <table className="table table-bordered table-hover datatable">
                      <thead className='table table-primary'>
                        <tr>
                          <th scope="col">#</th>
                          <th scope="col">Patient</th>
                          <th scope="col">Drug</th>
                          <th scope="col">Price</th>
                          <th scope="col">Doctor</th>
                          <th scope="col">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((sale, index) => (
                          <TableRow
                            key={index}
                            index={index + pageIndex * entriesPerPage + 1}
                            {...sale}
                            patient = {`${sale.firstname} ${sale.lastname}`}
                            drug={sale.drugname}
                            price={sale.price}
                            doctor={`${sale.user_firstname} ${sale.user_lastname}`}
                            date={sale.prescription_datecreate ? format(new Date(sale.prescription_datecreate), 'yyyy/MM/dd') : "-"}
                          />
                        ))}
                      </tbody>
                    </table>
                    <div>
                      <button onClick={handlePrevPage} disabled={pageIndex === 0}>Previous</button>&nbsp;
                      Showing {pageIndex * entriesPerPage + 1} to {Math.min((pageIndex + 1) * entriesPerPage, prescriptions.length)} of {prescriptions.length} entries
                      &nbsp;<button onClick={handleNextPage} disabled={pageIndex === totalPages - 1}>Next</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side columns */}
              <div className="col-lg-4">
                <div className="row">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Recent Payment</h5>

                      {paymentDetails ? (
                        <div className="activity">
                          {paymentDetails.filter(payment => payment.status === 'Has Paid' && payment.price > 0).slice(0, 15).map((payment) => (
                            <div className="activity-item d-flex" key={payment.pId}>
                              <i className="bi bi-circle-fill activity-badge text-success align-self-start"></i>
                              <div className="activity-content">
                                Payment received from{' '}
                                <Link
                                  to={`/manage-patients/${payment.pId}`}
                                  className="fw-bold text-dark"
                                >
                                  {payment.firstname} {payment.lastname}
                                </Link>{' '}
                                for an amount of ₦{payment.price} for {payment.drugname}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Loading recent payments...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>


      </section>
    </main >
  );
};

export default BodyPharmacist;
