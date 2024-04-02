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

const usePatientSearch = (initialPrescriptions) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPrescriptions, setFilteredPrescriptions] = useState(initialPrescriptions);

    const filterPrescriptions = (prescriptions, term) => {
        const lowerCaseSearchTerm = term.toLowerCase();

        if (!lowerCaseSearchTerm.trim()) {
            // If no search term, return all prescriptions
            setFilteredPrescriptions(prescriptions);
            return prescriptions;
        }

        const filtered = prescriptions.filter((group) => {
            // Check if any prescription in the group matches the search term
            return group.prescriptions.some((prescription) => {
                const prescriptionPId = typeof prescription.pId === 'number' ? String(prescription.pId) : prescription.paymentId;

                return (
                    prescription.firstname.toLowerCase().includes(lowerCaseSearchTerm) ||
                    prescription.lastname.toLowerCase().includes(lowerCaseSearchTerm) ||
                    prescriptionPId.toLowerCase().includes(lowerCaseSearchTerm)
                );
            });
        });

        setFilteredPrescriptions(filtered);
        console.log("filterPrescriptions: filtered", filtered);
        return filtered;
    };

    useEffect(() => {
        console.log("usePatientSearch hook: searchTerm", searchTerm);
        console.log("usePatientSearch hook: filteredPrescriptions", filteredPrescriptions);
        filterPrescriptions(initialPrescriptions, searchTerm);
    }, [searchTerm, initialPrescriptions]);

    const handleSearchChange = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
    };

    return { searchTerm, filterPrescriptions, handleSearchChange, filteredPrescriptions, setSearchTerm };
};

const PharmacistUnpaidDebts = () => {
    const { currentUser } = useAuth();

    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const { searchTerm, filterPrescriptions, handleSearchChange, filteredPrescriptions, setSearchTerm } = usePatientSearch(prescriptions);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/get-GroupedPrescriptions');
                console.log('Response:', response.data); // Log the response to check its structure
                const paidPrescriptionsData = response.data.Paidprescription || [];
                const notPaidPrescriptionsData = response.data.NotPaidprescription || [];


                // Process paid prescriptions
                const groupedPaidPrescriptions = {};
                paidPrescriptionsData.forEach((prescription) => {
                    const { paymentId } = prescription;
                    if (!groupedPaidPrescriptions[paymentId]) {
                        groupedPaidPrescriptions[paymentId] = [prescription];
                    } else {
                        groupedPaidPrescriptions[paymentId].push(prescription);
                    }
                });

                // Process paid prescriptions
                const ungroupedUnpaidPrescriptions = {};
                notPaidPrescriptionsData.forEach((prescription) => {
                    const { pId } = prescription;
                    if (!ungroupedUnpaidPrescriptions[pId]) {
                        ungroupedUnpaidPrescriptions[pId] = [prescription];
                    } else {
                        ungroupedUnpaidPrescriptions[pId].push(prescription);
                    }
                });

                // Convert grouped prescriptions into an array with paymentId and prescriptions details
                const prescriptionsPaidArray = Object.entries(groupedPaidPrescriptions).map(([paymentId, prescriptions]) => ({
                    paymentId,
                    prescriptions,
                }));

                // Convert grouped prescriptions into an array with paymentId and prescriptions details
                const prescriptionsNotPaidArray = Object.entries(ungroupedUnpaidPrescriptions).map(([pId, prescriptions]) => ({
                    pId,
                    prescriptions,
                }));

                // Combine both types of prescriptions into a single array
                const allPrescriptions = [prescriptionsPaidArray, prescriptionsNotPaidArray].flat();
                setPrescriptions(allPrescriptions);
                console.log("allPrescriptions: ", allPrescriptions);

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
                Header: 'Patient',
                accessor: 'patient',
                Cell: ({ cell: { row } }) => {
                    const prescription = row.original.prescriptions[0]; // Accessing the first prescription
                    // console.log("prescription:", prescription);
                    return (
                        <div>
                            <h5><strong>{prescription.firstname} {prescription.lastname}</strong></h5>
                            <strong>PID: </strong> {prescription.pId || "-"}<br />
                            <strong>Number: </strong> {prescription.number || "-"}<br />
                            <strong>Email: </strong> {prescription.email || "-"}<br />
                            <strong>Prescribed on: </strong> {prescription.prescription_datecreate ? format(new Date(prescription.prescription_datecreate), 'yyyy/MM/dd') : "-"}<br />
                        </div>
                    );
                },
            },
            {
                Header: 'Drugs',
                accessor: 'drugs',
                Cell: ({ row }) => {
                    return (
                        <div>
                            {row.original.prescriptions.map((prescription, index) => (
                                <div key={index}>{prescription.drugname}</div>
                            ))}
                        </div>
                    );
                },
            },
            {
                Header: 'Total Price',
                accessor: 'totalPrice',
                Cell: ({ row }) => {
                    const prescription = row.original.prescriptions[0]; // Accessing the first prescription
                    return (
                        <div>
                            {prescription.total_amount ? `₦${prescription.total_amount}` : 'Price unavailable'}
                        </div>
                    );
                },
            },
            {
                Header: 'Payment',
                accessor: 'paymentStatus',
                Cell: ({ cell: { row } }) => {
                    const prescription = row.original.prescriptions[0]; // Accessing the first prescription
                    return (
                        <div>
                            {prescription.status}
                        </div>
                    );
                },
            },
            {
                Header: 'View Invoice',
                accessor: 'viewInvoiceButton',
                Cell: ({ row }) => {
                    const prescription = row.original.prescriptions[0]; // Accessing the first prescription
                    if (prescription.status === 'Has Paid') {
                        return (
                            <Link to={`/pharmacist-invoice/${prescription.paymentId}`}>
                                <button 
                                className='btn btn-outline-dark btn-md rounded-pill'
                                type="button">
                                    View Invoice
                                </button>
                            </Link>
                        );
                    } else if (prescription.status === 'Not Paid') {
                        return (
                            <button onClick={() => handleReminder(row)} data-bs-toggle="modal" 
                            className='btn btn-outline-dark btn-md rounded-pill'
                            data-bs-target="#share" type="button">
                                Send Reminder
                            </button>
                        );
                    } else if (prescription.price === 0) {
                        return <span>Invoice unavailable</span>;
                    }
                },
            },
        ],
        []
    );

    const handleReminder = async (row) => {
        try {
            // Set the selected patient for sending reminder
            setSelectedPatient(row.original.prescriptions);
            console.log('Selected Patient Details:', row.original.prescriptions[0]);
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
                'Service': `Prescribed Drugs: ${patientDetails.map((prescription) => prescription.drugname).join(', ')}`,
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
            data: filteredPrescriptions,
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
                                    {filteredPrescriptions.length > 0 ? (
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
                                        Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, prescriptions.length)} of {prescriptions.length} entries
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
        </main>
    );
};

export default PharmacistUnpaidDebts;;