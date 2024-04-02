import React, { useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Modal from 'react-modal';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../components/containers/Context';
import emailjs from '@emailjs/browser';

Modal.setAppElement('#root');

const usePatientSearch = (initialinvestigations) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredinvestigations, setFilteredinvestigations] = useState(initialinvestigations);

    const filterinvestigations = (investigations, term) => {
        const lowerCaseSearchTerm = term.toLowerCase();

        if (!lowerCaseSearchTerm.trim()) {
            // If no search term, return all investigations
            setFilteredinvestigations(investigations);
            return investigations;
        }

        const filtered = investigations.filter((group) => {
            // Check if any investigation in the group matches the search term
            return group.investigations.some((investigation) => {
                const investigationPId = typeof investigation.paymentId === 'number' ? String(investigation.paymentId) : investigation.paymentId;

                return (
                    investigation.firstname.toLowerCase().includes(lowerCaseSearchTerm) ||
                    investigation.lastname.toLowerCase().includes(lowerCaseSearchTerm) ||
                    investigationPId.toLowerCase().includes(lowerCaseSearchTerm)
                );
            });
        });

        setFilteredinvestigations(filtered);
        console.log("filterinvestigations: filtered", filtered);
        return filtered;
    };

    useEffect(() => {
        console.log("usePatientSearch hook: searchTerm", searchTerm);
        console.log("usePatientSearch hook: filteredinvestigations", filteredinvestigations);
        filterinvestigations(initialinvestigations, searchTerm);
    }, [searchTerm, initialinvestigations]);

    const handleSearchChange = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
    };

    return { searchTerm, filterinvestigations, handleSearchChange, filteredinvestigations, setSearchTerm };
};

const DoctorUnpaidDebts = () => {
    const { currentUser } = useAuth();

    const [investigations, setInvestigations] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const { searchTerm, filterinvestigations, handleSearchChange, filteredinvestigations, setSearchTerm } = usePatientSearch(investigations);
    const [receiptNumber, setReceiptNumber] = useState('000');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/get-GroupedInvestigations');
                console.log('Response:', response.data); // Log the response to check its structure
                const paidInvestigationsData = response.data.Paidinvestigation || [];
                const notPaidInvestigationsData = response.data.NotPaidinvestigation || [];


                // Process paid investigations
                const groupedPaidinvestigations = {};
                paidInvestigationsData.forEach((investigation) => {
                    const { paymentId } = investigation;
                    if (!groupedPaidinvestigations[paymentId]) {
                        groupedPaidinvestigations[paymentId] = [investigation];
                    } else {
                        groupedPaidinvestigations[paymentId].push(investigation);
                    }
                });

                // Process paid investigations
                const ungroupedUnpaidinvestigations = {};
                notPaidInvestigationsData.forEach((investigation) => {
                    const { pId } = investigation;
                    if (!ungroupedUnpaidinvestigations[pId]) {
                        ungroupedUnpaidinvestigations[pId] = [investigation];
                    } else {
                        ungroupedUnpaidinvestigations[pId].push(investigation);
                    }
                });

                // Convert grouped investigations into an array with paymentId and investigations details
                const investigationsPaidArray = Object.entries(groupedPaidinvestigations).map(([paymentId, investigations]) => ({
                    paymentId,
                    investigations,
                }));

                // Convert grouped investigations into an array with paymentId and investigations details
                const investigationsNotPaidArray = Object.entries(ungroupedUnpaidinvestigations).map(([pId, investigations]) => ({
                    pId,
                    investigations,
                }));

                // Combine both types of investigations into a single array
                const allinvestigations = [investigationsPaidArray, investigationsNotPaidArray].flat();
                setInvestigations(allinvestigations);
                console.log("allinvestigations: ", allinvestigations);

            } catch (error) {
                console.error('Error fetching patients:', error);
                // Handle the error, e.g., display an error message to the user
            }
        };
        fetchData();
    }, []);

    const columns = React.useMemo(
        () => [
            {
                Header: 'Patient Details',
                accessor: 'patient',
                Cell: ({ cell: { row } }) => {
                    const investigation = row.original.investigations[0]; // Accessing the first investigation
                    return (
                        <div>
                            <h5><strong>{investigation.firstname} {investigation.lastname}</strong></h5>
                            <strong>PID: </strong> {investigation.pId || "-"}<br />
                            <strong>Number: </strong> {investigation.number || "-"}<br />
                            <strong>Email: </strong> {investigation.email || "-"}<br />
                            <strong>Investigated on: </strong> {investigation.investigation_datecreate ? format(new Date(investigation.investigation_datecreate), 'yyyy/MM/dd') : "-"}<br />
                        </div>
                    );
                },
            },
            {
                Header: 'Laboratory Tests',
                accessor: 'drugs',
                Cell: ({ row }) => {
                    return (
                        <div>
                            {row.original.investigations.map((investigation, index) => (
                                <div key={index}>{investigation.testname}</div>
                            ))}
                        </div>
                    );
                },
            },
            {
                Header: 'Total Price',
                accessor: 'totalPrice',
                Cell: ({ row }) => {
                    const investigation = row.original.investigations[0]; // Accessing the first investigation
                    return (
                        <div>
                            {investigation.total_amount ? `₦${investigation.total_amount}` : 'Price unavailable'}
                        </div>
                    );
                },
            },
            {
                Header: 'Payment',
                accessor: 'paymentStatus',
                Cell: ({ cell: { row } }) => {
                    const investigation = row.original.investigations[0]; // Accessing the first investigation
                    return (
                        <div>
                            {investigation.payment_status}
                        </div>
                    );
                },
            },
            {
                Header: 'Pay Now',
                accessor: 'editButton',
                Cell: ({ row }) => (
                    <button type="button" data-bs-toggle="modal" data-bs-target="#modalDialogScrollable"
                        onClick={() => handleEdit(row)} 
                        className='btn btn-outline-dark btn-md rounded-pill'
                        disabled={row.original.investigations[0].payment_status === 'Has Paid'}>Pay Now</button>
                ),
            },
            {
                Header: 'View Invoice',
                accessor: 'viewInvoiceButton',
                Cell: ({ row }) => {
                    const investigation = row.original.investigations[0]; // Accessing the first investigation
                    if (investigation.payment_status === 'Has Paid') {
                        return (
                            <Link to={`/doctor-invoice/${investigation.paymentId}`}>
                                <button className='btn btn-outline-dark btn-md rounded-pill' type="button">
                                    View Invoice
                                </button>
                            </Link>
                        );
                    } else if (investigation.payment_status === 'Not Paid') {
                        return (
                            <button onClick={() => handleReminder(row)} data-bs-toggle="modal" 
                            className='btn btn-outline-dark btn-md rounded-pill'
                            data-bs-target="#share" type="button">
                                Send Reminder
                            </button>
                        );
                    } else if (investigation.price === 0) {
                        return <span>Invoice unavailable</span>;
                    }
                },
            },
        ],
        []
    );

    const initialFormData = {
        receiptNo: '',
        total_amount: '',
        amount_paid: '',
        balance: '',
        bookingId: '',
        method: '',
        userId: currentUser?.id,
    };

    const [formData, setFormData] = useState(initialFormData);


    const handleEdit = async (row) => {
        try {
            // Set the selected patient for editing
            console.log('Row selected:', row.original.investigations);
            setSelectedPatient(row.original.investigations);

            // Fetch the latest receipt number from the database
            const latestReceiptNumber = await getLatestReceiptNumber();

            // Generate and set the receipt number based on the fetched latest receipt number
            const nextReceiptNumber = generateNextReceiptNumber(latestReceiptNumber);
            setReceiptNumber(nextReceiptNumber);

            // Update the formData state with the values of the selected patient
            setFormData((prev) => ({
                ...prev,
                receiptNo: nextReceiptNumber, // Assign the generated receipt number to the form data
                total_amount: row.original.investigations[0].total_amount,
                bookingId: row.original.investigations[0].bookingId,
            }));
        } catch (error) {
            console.error('Error handling edit:', error);
            // Handle the error, e.g., display an error message to the user
        }
    };

    const handleChange = (e, fieldName) => {
        const { name, value } = e.target;

        // Check if the changed field is the amount_paid input
        if (name === 'amount_paid') {
            // Calculate the balance by subtracting the amount paid from the total amount
            const amountPaid = parseFloat(value) || '';
            const totalAmount = parseFloat(selectedPatient[0].total_amount) || 0;
            const balance = totalAmount - amountPaid;

            // Update the formData state with the new values
            setFormData((prev) => ({
                ...prev,
                amount_paid: amountPaid,
                balance: isNaN(balance) ? '' : balance.toFixed(2),
                receiptNo: receiptNumber, // Assign the receipt number to the form data

            }));
        } else if (name === 'total_amount') {
            setFormData((prev) => ({
                ...prev,
                total_amount: value,
            }));
        } else if (name === 'method') { // Handle select option change
            setFormData((prev) => ({
                ...prev,
                method: value, // Update the method field in formData
            }));
        } else {
            // Handle other input changes as before
            setFormData((prev) => ({
                ...prev,
                [fieldName]: value,
            }));

            setSelectedPatient((prev) => ({
                ...prev,
                [fieldName]: value,
            }));
        }
    };

    const generateNextReceiptNumber = (latestReceiptNumber) => {
        // Logic to generate the next receipt number
        // Example: Increment the current receipt number
        const nextNumber = parseInt(latestReceiptNumber, 10) + 1;
        const nextReceiptNumber = nextNumber.toString().padStart(3, '0'); // Ensure 3-digit format

        // Update the receiptNumber state with the new value
        setReceiptNumber(nextReceiptNumber);

        return nextReceiptNumber;
    };

    const getLatestReceiptNumber = async () => {
        // Fetch the latest receipt number from the billingTable in the database
        try {
            const response = await axios.get('http://localhost:3001/thomas/getbilling');
            const billingTableData = response.data.patients;
            console.log('Billing table data:', billingTableData);

            if (billingTableData.length > 0) {
                // Sort the data based on the receipt number in descending order
                billingTableData.sort((a, b) => b.receiptNo.localeCompare(a.receiptNo));

                // Return the latest receipt number
                return billingTableData[1].receiptNo;
            } else {
                // If no data in the billingTable, start with the initial receipt number
                return '000';
            }
        } catch (error) {
            console.error('Error fetching latest receipt number:', error);
            // Handle the error, e.g., display an error message to the user
            return '000'; // Return a default value in case of an error
        }
    };

    const handleReminder = async (row) => {
        try {
            // Set the selected patient for sending reminder
            setSelectedPatient(row.original.investigations);
            console.log('Selected Patient Details:', row.original.investigations);
        } catch (error) {
            console.error('Error handling reminder:', error);
            // Handle the error, e.g., display an error message to the user
        }
    };

    const sendEmail = async (patientDetails) => {
        const serviceId = 'service_94v9r5m';
        const templateId = 'template_s5jxw35';
        const publicKey = 'ocZfDv5ECRiYPbqSN';

        try {
            const patientName = `${patientDetails[0].firstname} ${patientDetails[0].lastname}`;

            const templateParams = {
                // Replace placeholders with actual values
                'Client Name': patientName,
                'Client Email': patientDetails[0].email,
                'Date': new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                'Total Amount': `Price Unavailable`,
                'Service': `Lab test : ${patientDetails.map((investigation) => investigation.testname).join(', ')}`,
                'Your Name': `${currentUser.firstname} ${currentUser.lastname}`,
                'Your Position': currentUser.adminType,
                'Your Email': currentUser.email,
                'Your Number': currentUser.number,
            };

            // Send email using emailjs
            console.log('Sending email...');
            const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
            console.log('Email sent response:', response);

            if (response.status === 200) {
                setErrorMessage('Email sent successfully');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            } else {
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            setErrorMessage('Error sending email. Please try again.');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Check if the balance is less than or equal to 0
            if (formData.balance > 0) {
                setErrorMessage('Payment unsuccessful: Amount should be paid in full');
                setShowErrorAlert(true);
                window.scroll(0, 0);
                return;
            }

            // Additional validation for required fields
            if (!formData.amount_paid || !formData.method) {
                setErrorMessage('Payment unsuccessful: Please enter the required fields.');
                setShowErrorAlert(true);
                window.scroll(0, 0);
                return;
            }

            const paymentData = {
                total_amount: formData.total_amount,
                amount_paid: formData.amount_paid,
                method: formData.method,
                receiptNo: formData.receiptNo,
                balance: formData.balance,
                status: 'Has Paid', // Assuming this is the status for a completed payment
            };

            console.log('Updating Payment:', paymentData);

            // Make a PUT request to update payment details, including the payment ID in the URL
            const response = await axios.put(`http://localhost:3001/thomas/update-payment/${selectedPatient[0].paymentId}`, paymentData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response from update-payment API:', response.data);

            if (response.data.message.includes('updated successfully')) {
                console.log('Payment successfully updated:', response.data);

                // Update consultation table with prescription ID
                const testId = response.data.id;
                console.log('Payment ID:', testId);
                const consultationId = selectedPatient[0].investigation_consultationId;
                console.log('Consultation ID:', consultationId);
                await axios.put(`http://localhost:3001/thomas/update-consultation/${consultationId}`, { testId });

                const response_investigations = await axios.put(`http://localhost:3001/thomas/update-investigation-payments/${testId}`, { status: 'Has Paid' });

                if (response_investigations.data.message.includes('updated successfully!')) {
                    console.log('Update successful:', response_investigations.data);
                    setFormData(initialFormData);
                    try {
                        const response = await axios.get('http://localhost:3001/thomas/get-GroupedInvestigations');
                        console.log('Response:', response.data); // Log the response to check its structure
                        const paidInvestigationsData = response.data.Paidinvestigation || [];
                        const notPaidInvestigationsData = response.data.NotPaidinvestigation || [];


                        // Process paid investigations
                        const groupedPaidinvestigations = {};
                        paidInvestigationsData.forEach((investigation) => {
                            const { paymentId } = investigation;
                            if (!groupedPaidinvestigations[paymentId]) {
                                groupedPaidinvestigations[paymentId] = [investigation];
                            } else {
                                groupedPaidinvestigations[paymentId].push(investigation);
                            }
                        });

                        // Process paid investigations
                        const ungroupedUnpaidinvestigations = {};
                        notPaidInvestigationsData.forEach((investigation) => {
                            const { pId } = investigation;
                            if (!ungroupedUnpaidinvestigations[pId]) {
                                ungroupedUnpaidinvestigations[pId] = [investigation];
                            } else {
                                ungroupedUnpaidinvestigations[pId].push(investigation);
                            }
                        });

                        // Convert grouped investigations into an array with paymentId and investigations details
                        const investigationsPaidArray = Object.entries(groupedPaidinvestigations).map(([paymentId, investigations]) => ({
                            paymentId,
                            investigations,
                        }));

                        // Convert grouped investigations into an array with paymentId and investigations details
                        const investigationsNotPaidArray = Object.entries(ungroupedUnpaidinvestigations).map(([pId, investigations]) => ({
                            pId,
                            investigations,
                        }));

                        // Combine both types of investigations into a single array
                        const allinvestigations = [investigationsPaidArray, investigationsNotPaidArray].flat();
                        setInvestigations(allinvestigations);
                        console.log("allinvestigations: ", allinvestigations);

                    } catch (error) {
                        console.error('Error fetching patients:', error);
                        // Handle the error, e.g., display an error message to the user
                    }
                    setShowErrorAlert(true);
                    setErrorMessage('Lab Test updated successfully!');
                    window.scrollTo(0, 0);
                } else {
                    console.error('Unexpected response:', response.data);
                    setErrorMessage('Unexpected response. Please try again.');
                    setShowErrorAlert(true);
                    window.scrollTo(0, 0);
                }
                setFormData(initialFormData);
                setErrorMessage('Payment updated successfully!');
                setShowErrorAlert(true);
                window.scroll(0, 0);
            } else {
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scroll(0, 0);
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            setErrorMessage('Error updating payment. Please try again.');
            setShowErrorAlert(true);
            window.scroll(0, 0);
        }
    };

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        previousPage,
        page,
        state: { pageIndex, pageSize },
        nextPage,
        canPreviousPage,
        canNextPage,
        pageOptions,
        gotoPage,
        setPageSize,
    } = useTable(
        {
            columns,
            data: filteredinvestigations,
            initialState: {
                pageIndex: 0,
                pageSize: 10,
                sortBy: [
                    {
                        id: 'priceButton',
                        desc: false,
                    },
                ],
            },
        },
        useSortBy,
        usePagination
    );


    return (
        <main id="main" className="main">
            <div className="pagetitle">
                <h1>Manage Bookings</h1>
                <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
                        <li className="breadcrumb-item">Tables</li>
                        <li className="breadcrumb-item active">Data</li>
                    </ol>
                </nav>
            </div>

            <section className="section">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Patient Table</h5>

                                {/* Custom HTML structure for datatable-top */}
                                <div className="datatable-top">
                                    <div className="datatable-dropdown">
                                        <label>
                                            <select className="datatable-selector" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                                                {[5, 10, 15, -1].map((pageSizeOption) => (
                                                    <option key={pageSizeOption} value={pageSizeOption}>
                                                        {pageSizeOption === -1 ? 'All' : pageSizeOption} entries per page
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>

                                    <div className="col-4">
                                        <div className="datatable-search">
                                            <input
                                                className="form-control"
                                                placeholder="Search by PID or Patient Name..."
                                                type="search"
                                                title="Search within table"
                                                value={searchTerm}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Datatable container */}
                                <div className="datatable-container">
                                    {filteredinvestigations.length > 0 ? (
                                                        <table {...getTableProps()} className="table table-bordered table-hover">
                                                        <thead className='table table-primary'>
                                                          {headerGroups.map((headerGroup) => (
                                                            <tr {...headerGroup.getHeaderGroupProps()}>
                                                              {headerGroup.headers.map((column) => (
                                                                <th {...column.getHeaderProps(column.getSortByToggleProps())} data-sortable={true}>
                                                                  {column.render('Header')}
                                                                  <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                                                                </th>
                                                              ))}
                                                            </tr>
                                                          ))}
                                                        </thead>
                                                        <tbody {...getTableBodyProps()}>
                                                          {page.map((row) => {
                                                            prepareRow(row);
                                                            return (
                                                              <tr {...row.getRowProps()}>
                                                                {row.cells.map((cell) => (
                                                                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                                                ))}
                                                              </tr>
                                                            );
                                                          })}
                                                        </tbody>
                                                      </table>
                                  
                                    ) : (
                                        <div className="table datatable datatable-table" style={{ padding: "10px" }}><strong>No Patient Searched</strong></div>
                                    )}
                                </div>

                                {/* Pagination */}
                                <div className="pagination">
                                    <div className="datatable-info">
                                        Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, investigations.length)} of {investigations.length} entries
                                    </div>
                                    <nav className="datatable-pagination">
                                        <ul className="datatable-pagination-list">
                                            <li className={`datatable-pagination-list-item ${!canPreviousPage ? 'datatable-hidden datatable-disabled' : ''}`}>
                                                <button onClick={() => previousPage()} disabled={!canPreviousPage} className="datatable-pagination-list-item-link" aria-label="Page 1">
                                                    ‹
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                    <span>
                                        Page{' '}
                                        <strong>
                                            {pageIndex + 1} of {pageOptions.length}
                                        </strong>{' '}
                                    </span>
                                    <span>
                                        | Go to page:{' '}
                                        <input
                                            type="number"
                                            defaultValue={pageIndex + 1}
                                            onChange={e => {
                                                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                                                gotoPage(page);
                                            }}
                                        />
                                    </span>
                                    <nav className="datatable-pagination">
                                        <ul className="datatable-pagination-list">
                                            <button onClick={() => nextPage()} disabled={!canNextPage}>
                                                {'›'}
                                            </button>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <div className="card">
                <div className="modal fade" id="share" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Send Reminder with Patient via</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                {/* Pass the row object to sendEmail function */}
                                <div><button data-bs-dismiss="modal" onClick={() => sendEmail(selectedPatient)} style={{ width: '100%', textAlign: 'left' }} className="btn btn-outline-success"><i style={{ padding: '15px' }} className="bi bi-envelope"></i>Send to Email</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT PATIENT MODAL */}
            <div className="modal fade" id="modalDialogScrollable" tabIndex="-1" >
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Booking Details</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {selectedPatient && Array.isArray(selectedPatient) && selectedPatient.length > 0 && (
                            <div className="modal-body">
                                <h5><strong>{selectedPatient[0].firstname} {selectedPatient[0].lastname}</strong> ||<strong> PID: </strong>{selectedPatient[0].patientId}</h5><br />
                                <p><strong>Testname:</strong><br />
                                    <span>
                                        {selectedPatient.map((investigation, index) => (
                                            <div key={index}>{investigation.testname}</div>
                                        ))}
                                    </span>
                                </p>
                                <p><strong>Total Price:</strong><br /> <span>₦{selectedPatient[0].total_amount}</span></p>
                                <p><strong>Status:</strong><br /> <span>{selectedPatient[0].investigation_status}</span></p>
                                <p><strong>Added on:</strong><br /> <span>{selectedPatient[0].payment_datecreate ? format(new Date(selectedPatient[0].payment_datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}</span></p>
                                <p><strong>Booked by:</strong><br /> <span>{selectedPatient[0].user_firstname} {selectedPatient[0].user_lastname}</span></p><br />
                                <br />
                                <h5 className="modal-title"><strong>Payment Details</strong></h5><br />
                                <form onSubmit={handleSubmit}>
                                    <input type="hidden" name="paymentId" value={selectedPatient[0].investigation_paymentId} />
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">Reciept Number</label>
                                        <div className="col-md-8">
                                            <input name="receiptNo" type="text" className="form-control" placeholder="Enter Total Amount" value={formData.receiptNo} onChange={handleChange} readOnly />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">Total Amount</label>
                                        <div className="col-md-8">
                                            <input name="total_amount" type="number" className="form-control" value={formData.total_amount} onChange={(e) => handleChange(e, 'total_amount')} readOnly />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">Amount Paid</label>
                                        <div className="col-md-8">
                                            <input name="amount_paid" type="number" className="form-control" placeholder="Enter Amount Paid" value={formData.amount_paid} onChange={(e) => handleChange(e, 'amount_paid')} />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">Balance</label>
                                        <div className="col-md-8">
                                            <input name="balance" type="text" className="form-control" placeholder="Balance" value={formData.balance} readOnly />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">Method of Payment</label>
                                        <div className="col-md-7">
                                            <select className="form-control" name='method' value={formData.method} onChange={(e) => handleChange(e, 'method')}>
                                                <option value="">Select a Payment Method</option>
                                                <option value='Cash'>Cash</option>
                                                <option value='Debit Card'>Debit Card</option>
                                                <option value='Bank Transfer'>Bank Transfer</option>
                                                <option value='Mobile Payments'>Mobile Payments</option>
                                                <option value='Cheques'>Cheques</option>
                                                <option value='Wire Transfer'>Wire Transfer</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <button type="submit" data-bs-dismiss="modal" className="btn btn-primary">Save Payment</button>
                                    </div>
                                </form>
                            </div>
                        )}

                    </div>
                </div>
            </div>
            {/* END OF MODAL */}
        </main>
    );
};

export default DoctorUnpaidDebts;;