import React, { useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Modal from 'react-modal';
import { useAuth } from '../../components/containers/Context';

Modal.setAppElement('#root');

const usePatientSearch = (initialPatients) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPatients, setFilteredPatients] = useState(initialPatients);

    const filterPatients = (patients, term) => {
        const lowerCaseSearchTerm = term.toLowerCase();

        const filtered = patients.filter((patient) => {
            // Check if patient.pId is a number before calling toLowerCase
            const patientPId = typeof patient.pId === 'number' ? String(patient.pId) : patient.pId;

            return (
                patient.firstname.toLowerCase().includes(lowerCaseSearchTerm) ||
                patient.lastname.toLowerCase().includes(lowerCaseSearchTerm) ||
                patientPId.toLowerCase().includes(lowerCaseSearchTerm)
            );
        });

        setFilteredPatients(filtered);
        return filtered;
    };

    const handleSearchChange = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        filterPatients(initialPatients, newSearchTerm);
    };

    return { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm };
};

const WaitingList = () => {
    const { currentUser } = useAuth();

    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [addToGrid, setAddToGrid] = useState(false);
    const [addToGrid2, setAddToGrid2] = useState(false);
    const { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm } = usePatientSearch(patients);
    const [gridPrescriptions, setGridPrescriptions] = useState([]);
    const [paymentPrescriptions, setPaymentPrescriptions] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [receiptNumber, setReceiptNumber] = useState('000');


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/get-prescriptions');
                // Group prescriptions by pId
                const groupedPrescriptions = {};
                response.data.prescriptions.forEach((prescription) => {
                    const { pId } = prescription;
                    if (!groupedPrescriptions[pId]) {
                        groupedPrescriptions[pId] = [prescription];
                    } else {
                        groupedPrescriptions[pId].push(prescription);
                    }
                });
                // Convert object to array of prescriptions
                const prescriptionsArray = Object.values(groupedPrescriptions).map((prescriptions) => prescriptions[0]);
                setPatients(prescriptionsArray);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };

        fetchData();
    }, []);

    const columns = React.useMemo(
        () => [
            {
                Header: 'Patient Details',
                accessor: 'patientDetailsButton',
                Cell: ({ row }) => (
                    <div>
                        <h5>
                            <strong>
                                {row.original.firstname} {row.original.lastname}
                            </strong>
                            <strong> (PID: </strong> {row.original.pId || "-"})
                        </h5>
                        <br />
                    </div>
                ),
            },
            {
                Header: 'Preview',
                accessor: 'editButton',
                Cell: ({ row }) => (
                    <button className='btn btn-outline-dark btn-md rounded-pill' type="button" onClick={() => handleEdit(row)}>Preview</button>
                ),
            },
        ],
        []
    );

    const handleEdit = async (row) => {
        // Set the selected patient for editing
        window.scrollTo(0, 0);
        setSelectedPatient(row.original);

        try {
            // Fetch prescriptions for the selected patient
            const response = await axios.get(`http://localhost:3001/thomas/getAllPrescriptions/${row.original.pId}`); // Corrected URL
            // setSelectedPatientPrescriptions(response.data.prescriptions);
            setGridPrescriptions(response.data.prescriptions);

            setAddToGrid(true);
            setAddToGrid2(false);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        }
    };

    // Function to handle quantity change for a specific prescription
    const handleQuantityChange = (index, value) => {
        const updatedQuantities = [...prescriptionQuantities];
        updatedQuantities[index] = value;
        setPrescriptionQuantities(updatedQuantities);

    };

    const handleChange = (e, fieldName) => {
        const { name, value } = e.target;

        // Check if the changed field is the amount_paid input
        if (name === 'amount_paid') {
            // Calculate the balance by subtracting the amount paid from the total amount
            const amountPaid = parseFloat(value) || '';
            const totalAmount = paymentPrescriptions.reduce((total, prescription) => total + prescription.new_total_price, 0);
            const balance = totalAmount - amountPaid;

            console.log('Amount Paid:', amountPaid);
            console.log('Total Amount:', totalAmount);
            console.log('Balance:', balance);

            // Update the formData state with the new values
            setFormData((prev) => ({
                ...prev,
                amount_paid: amountPaid,
                balance: isNaN(balance) ? '' : balance.toFixed(2),
                receiptNo: receiptNumber,
                total_amount: totalAmount, // Assign the new_total_price to the total_amount
            }));
        } else if (name === 'qty_given') {
            // Update qty_given state when it changes
            setFormData((prev) => ({
                ...prev,
                qty_given: value,
            }));
        } else if (name === 'total_amount') {
            console.log('Overall Amount:', overallTotalPrice);
            setFormData((prev) => ({
                ...prev,
                totalAmount: overallTotalPrice,
            }));
        } else if (name === 'total_amount') {
            console.log('Overall Amount:', overallTotalPrice);
            setFormData((prev) => ({
                ...prev,
                totalAmount: overallTotalPrice,
            }));
        } else {
            // Handle other input changes as before
            setFormData((prev) => ({
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

            if (billingTableData.length > 0) {
                // Sort the data based on the receipt number in descending order
                billingTableData.sort((a, b) => b.receiptNo.localeCompare(a.receiptNo));

                // Return the latest receipt number
                return billingTableData[0].receiptNo;
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

    const handlePayNow = async (overallTotalPrice) => {
        // Fetch the latest receipt number from the database
        const latestReceiptNumber = await getLatestReceiptNumber();
        const nextReceiptNumber = generateNextReceiptNumber(latestReceiptNumber);

        setReceiptNumber(nextReceiptNumber);
        console.log('Overall Price', overallTotalPrice);

        setFormData((prev) => ({
            ...prev,
            receiptNo: nextReceiptNumber,
            total_amount: overallTotalPrice // Assign the generated receipt number to the form data
        }));
    }

    const initialFormData = {
        firstname: '',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [overallTotalPrice, setOverallTotalPrice] = useState(0);
    const [prescriptionQuantities, setPrescriptionQuantities] = useState([]);

    useEffect(() => {
        let total = 0;
        paymentPrescriptions.forEach(prescription => {
            total += parseFloat(prescription.new_total_price) || 0;
        });
        setOverallTotalPrice(total);

        if (paymentPrescriptions.length === 0) {
            setAddToGrid2(false);
        }
    }, [paymentPrescriptions]);

    const handleAddToGrid = (prescription, index) => {
        const qtyGiven = prescriptionQuantities[index];
        if (qtyGiven > 0) {
            window.scrollTo(0, document.body.scrollHeight);
            // Calculate the new total price based on the entered quantity
            const totalPrice = prescription.price * qtyGiven;
            console.log('Quantity:', qtyGiven);
            console.log('Total price:', totalPrice);

            // Remove prescription from the gridPrescriptions
            const updatedGridPrescriptions = gridPrescriptions.filter((p) => p !== prescription);
            setGridPrescriptions(updatedGridPrescriptions);

            // Add prescription with new quantity and total price to the paymentPrescriptions
            const updatedPaymentPrescriptions = [...paymentPrescriptions, { ...prescription, new_quantity: qtyGiven, new_total_price: totalPrice }];
            setPaymentPrescriptions(updatedPaymentPrescriptions);

            // Update overall total price
            const updatedOverallTotalPrice = overallTotalPrice + totalPrice;
            setOverallTotalPrice(updatedOverallTotalPrice);

            // Clear the quantity input field
            const updatedQuantities = [...prescriptionQuantities];
            updatedQuantities[index] = '';
            setPrescriptionQuantities(updatedQuantities);

            setAddToGrid2(true);
            setErrorMessage('Prescriptions added to the payment table successfully!');
            setShowErrorAlert(true);
        } else {
            setErrorMessage('Please enter a valid quantity!');
            setShowErrorAlert(true);
            window.scrollTo(0, document.body.scrollHeight);
        }
    };

    const handleDeleteClick = (prescription) => {
        setPrescriptions(prescription)
    };

    const handleRemoveFromGrid = (prescription) => {
        // Add prescription back to gridPrescriptions with previous details
        const updatedGridPrescriptions = [...gridPrescriptions, { ...prescription, quantity: prescription.quantity, total_price: prescription.total_price }];
        setGridPrescriptions(updatedGridPrescriptions);

        // Remove prescription from the paymentPrescriptions
        const updatedPaymentPrescriptions = paymentPrescriptions.filter((p) => p !== prescription);
        setPaymentPrescriptions(updatedPaymentPrescriptions);

        // Update overall total price
        const updatedOverallTotalPrice = overallTotalPrice - (prescription.total_price || 0);
        setOverallTotalPrice(updatedOverallTotalPrice);

        setErrorMessage('Prescriptions removed from grid successfully!');
        setShowErrorAlert(true);
    };

    const DeletePrescriptions = async () => {
        try {            
            // Delete the associated request
            const patientResponse = await axios.delete(`http://localhost:3001/thomas/delete-prescriptions/${prescriptions.prescriptionId}`);
            
            if (patientResponse.data.message.includes('successfull')) {
                setErrorMessage(patientResponse.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            } else {
                setErrorMessage(patientResponse.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
    
            // Fetch updated requests
            try {
                const response = await axios.get('http://localhost:3001/thomas/get-GroupedPrescriptions');
                // Group prescriptions by prescription_paymentId
                const groupedPrescriptions = {};
                response.data.prescriptions.forEach((prescription) => {
                    const { paymentId } = prescription;
                    if (paymentId) { // Check if paymentId exists
                        if (!groupedPrescriptions[paymentId]) {
                            groupedPrescriptions[paymentId] = [prescription];
                        } else {
                            groupedPrescriptions[paymentId].push(prescription);
                        }
                    }
                });

                // Convert grouped prescriptions into an array with paymentId and prescriptions details
                const prescriptionsArray = Object.entries(groupedPrescriptions).map(([paymentId, prescriptions]) => ({
                    paymentId,
                    prescriptions,
                }));
                console.log('Prescriptions Array: ', prescriptionsArray);

                setPrescriptions(prescriptionsArray);
                window.location.reload();
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        } catch (error) {
            console.error('Error deleting patient:', error);
        }
    };

    const handleSubmitPayment = async (e) => {
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

            // Make the API call to add payment details to the 'payment' table
            const paymentData = {
                total_amount: formData.total_amount,
                amount_paid: formData.amount_paid,
                method: formData.method,
                receiptNo: formData.receiptNo,
                balance: formData.balance,
                userId: currentUser.id,
                status: 'Has Paid',
                datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
            };

            console.log('Adding Payment:', paymentData);

            // Make the API call to add payment details to the 'payment' table
            const paymentResponse = await axios.post('http://localhost:3001/thomas/add-payment', paymentData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Payment Response:', paymentResponse.data); // Log the entire response

            // Check if the payment addition was successful
            if (paymentResponse.data.message.includes('Payment added successfully')) {
                const paymentId = paymentResponse.data.id; // Retrieve the generated paymentId
                console.log('Payment added successfully. Payment ID:', paymentId);

                // Set the status of prescriptions to "Has Paid"
                const prescriptionIds = paymentPrescriptions.map(prescription => prescription.prescriptionId);
                const updatePrescriptionStatusPromises = prescriptionIds.map(async prescriptionId => {
                    await axios.put(`http://localhost:3001/thomas/updatePrescriptionStatus/${prescriptionId}`, {
                        status: 'Has Paid',
                    });
                });

                // Execute all update prescription status promises
                await Promise.all(updatePrescriptionStatusPromises);

                // If successful, add prescription payment details to the 'prescription_payment' table
                const prescriptionPaymentPromises = paymentPrescriptions.map(prescription => {
                    return axios.post('http://localhost:3001/thomas/add-prescription-payment', {
                        paymentId: paymentId, // Use the retrieved paymentId
                        prescriptionId: prescription.prescriptionId, // Assuming each prescription has an 'id' field
                        quantity: prescription.new_quantity,
                        price: prescription.new_total_price,
                    });
                });

                // Make the API calls to add prescription payment details
                const prescriptionPaymentResponses = await Promise.all(prescriptionPaymentPromises);

                // Check if all prescription payment additions were successful
                const allPrescriptionPaymentSuccess = prescriptionPaymentResponses.every(response => response.data.message);
                if (allPrescriptionPaymentSuccess) {
                    // Handle success case
                    console.log('Prescription Payments added successfully');
                    setErrorMessage('Prescription Payments added successfully');
                    setShowErrorAlert(true);
                    setPaymentPrescriptions([]);
                    setAddToGrid2(false);
                } else {
                    // Handle failure case
                    console.error('Error adding prescription payments:', prescriptionPaymentResponses.map(response => response.data.message).join(', '));
                    setErrorMessage('Error adding prescription payments. Please try again.');
                    setShowErrorAlert(true);
                }
            } else {
                // Handle failure case
                console.error('Error adding payment:', paymentResponse.data.message);
                setErrorMessage('Error adding payment. Please try again.');
                setShowErrorAlert(true);
            }
        } catch (error) {
            console.error('Error making payment:', error);
            // Handle the error, e.g., display an error to the user
            setErrorMessage('Error making payment. Please try again.');
            setShowErrorAlert(true);
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
            data: filteredPatients, // Use filteredPatients, not filterPatients
            initialState: {
                pageIndex: 0,
                pageSize: 10,
                sortBy: [
                    {
                        id: 'datecreate',
                        desc: true,
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
                <h1>Patient Lists</h1>
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
                    <div className="col-lg-4">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Patient Table</h5>

                                <div className="datatable-top">
                                    <div className="col-12">
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

                                <div className="datatable-container">
                                    {filteredPatients.length > 0 ? (
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

                                <div className="pagination">
                                    <div className="datatable-info">
                                        Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, patients.length)} of {patients.length} entries
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

                    <div className="col-lg-8">
                        {addToGrid && selectedPatient && (
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Patient Prescribed Drugs</h5>

                                    <div className="patient-details">
                                        <h2>Patient Details</h2>
                                        <h3><strong>{selectedPatient.firstname} {selectedPatient.lastname}</strong></h3>
                                        <strong>PID: </strong>{selectedPatient.pId || "-"}<br />
                                        <strong>Age: </strong>{selectedPatient.age || "-"}<br />
                                        <strong>Number: </strong>{selectedPatient.number || "-"}<br />
                                        <strong>Email: </strong>{selectedPatient.email || "-"}<br />
                                        <strong>Address: </strong>{selectedPatient.address || "-"}<br />
                                        <strong>Gender: </strong>{selectedPatient.gender || "-"}<br />
                                    </div><br />
                                    <form>
                                        <table className="table table-bordered table-hover">
                                            <thead className="table table-primary">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Drug Details</th>
                                                    <th>Price</th>
                                                    <th>Quantity</th>
                                                    <th>Total Price</th>
                                                    <th>Qty. Given</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gridPrescriptions.length > 0 ? (
                                                    gridPrescriptions.map((prescription, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <strong>{index + 1}</strong>
                                                            </td>
                                                            <td style={{ paddingRight: '20px' }}>
                                                                <strong>Drug: </strong><br />{prescription.drugname || "-"}<br />
                                                                <strong>Dosage: </strong><br />{prescription.dosage || "-"}<br />
                                                                <strong>Remarks: </strong><br /> {prescription.remarks || "-"}<br /><br />
                                                                <strong>Doctor: </strong><br />Dr. {prescription.user_firstname || "-"} {prescription.user_lastname || "-"}<br />
                                                                <strong>Date Prescriped: </strong><br />{new Date(prescription.prescription_datecreate).toLocaleString('en-Uk', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}<br />
                                                            </td>
                                                            <td>
                                                                ₦{prescription.price || "-"}<br />
                                                            </td>
                                                            <td>
                                                                {prescription.quantity || "-"}<br />
                                                            </td>
                                                            <td>
                                                                ₦{prescription.total_price || "-"}<br />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    value={prescriptionQuantities[index]}
                                                                    className="form-control"
                                                                    name='qty_given'
                                                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <button style={{width:'115px'}} type="button" 
                                                                onClick={() => handleAddToGrid(prescription, index)}
                                                                className='btn btn-outline-dark btn-md rounded-pill'
                                                                >Add To Grid</button>
                                                                <br /><br/>
                                                                <button type="button"
                                                                onClick={() => handleDeleteClick(prescription)}
                                                                data-bs-toggle="modal" data-bs-target="#delete-message"
                                                                className='btn btn-outline-dark btn-md rounded-pill'
                                                                >Delete</button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7">
                                                            <div className="table datatable datatable-table" style={{ padding: "10px" }}><strong>No current prescriptions</strong></div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {showErrorAlert && (
                    <div className={`form-control alert ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`} role="alert">
                        {errorMessage}
                    </div>
                )}
                <div className="col-lg-12">
                    {addToGrid2 && (
                        <div className="card">
                            <div className="card-body">
                                <h3 className="card-title">Medication(s) Payment</h3>
                                <form>
                                    <table className="table table-bordered table-hover">
                                        <thead className="table table-primary">
                                            <tr>
                                                <th>#</th>
                                                <th>Drug Details</th>
                                                <th>Price</th>
                                                <th>Quantity</th>
                                                <th>Total Price</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentPrescriptions.map((prescription, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <strong>{index + 1}</strong>
                                                    </td>
                                                    <td >
                                                        <strong>Drug: </strong><br />{prescription.drugname || "-"}<br />
                                                        <strong>Dosage: </strong><br />{prescription.dosage || "-"}<br />
                                                        <strong>Remarks: </strong><br /> {prescription.remarks || "-"}<br />
                                                    </td>
                                                    <td>
                                                        ₦{prescription.price || "-"}<br />
                                                    </td>
                                                    <td>
                                                        {prescription.new_quantity || "-"}<br />
                                                    </td>
                                                    <td>
                                                        ₦{prescription.new_total_price || "-"}<br />
                                                    </td>

                                                    <td>
                                                        <button type="button" 
                                                        className='btn btn-outline-dark btn-md rounded-pill'
                                                     onClick={() => handleRemoveFromGrid(prescription)}>Remove from Grid</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="text-center">
                                        <h4><strong>Overall Total Price:</strong> ₦{overallTotalPrice}</h4>
                                        <button type="button" data-bs-toggle="modal" 
                                        className='btn btn-outline-primary btn-md rounded-pill'
                                        data-bs-target="#modalDialogScrollable" onClick={() => handlePayNow(overallTotalPrice)}>Pay Now</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* EDIT PATIENT MODAL */}
            <div className="modal fade" id="modalDialogScrollable" tabIndex="-1" >
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Booking Details</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {selectedPatient && paymentPrescriptions && gridPrescriptions && (
                            <div className="modal-body">
                                <h4><strong>{selectedPatient.firstname} {selectedPatient.lastname}</strong> ||<strong> PID: </strong>{selectedPatient.patientId}</h4><br />
                                {paymentPrescriptions.map((initial_prescription) => (
                                    <div>
                                        <p><strong>Drug Name:</strong><br /> <span>{initial_prescription.drugname}</span></p>
                                        <p><strong>Dosage:</strong><br /> <span>{initial_prescription.dosage}</span></p>
                                        <p><strong>Price:</strong><br /> <span>₦{initial_prescription.price}</span></p>
                                        <p><strong>Quantity:</strong><br /> <span>{initial_prescription.new_quantity}</span></p>
                                        <p><strong>Prescriped by:</strong><br /> <span>Dr. {initial_prescription.user_firstname} {initial_prescription.user_lastname}</span></p>
                                        <p><strong>Prescriped on:</strong><br /> <span>{new Date(initial_prescription.prescription_datecreate).toLocaleString('en-Uk', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</span></p><br />
                                    </div>
                                ))}

                                <br />
                                <h4 className="modal-title"><strong>Payment Details</strong></h4><br />
                                <form onSubmit={handleSubmitPayment}>
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">Reciept Number</label>
                                        <div className="col-md-8">
                                            <input name="receiptNo" type="text" className="form-control" value={formData.receiptNo} onChange={handleChange} readOnly />
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
                                        <label className="col-md-4 col-lg-3 col-form-label">Method of Payment</label>
                                        <div className="col-md-8">
                                            <select className="form-control" name='method' value={formData.method} onChange={(e) => handleChange(e, 'method')} id="exampleFormControlSelect1">
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


            <div className="modal fade" id="delete-message" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form>
                            <div className="modal-header">
                                <h5 className="modal-title">Ready to Delete Patient?</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            {prescriptions && (
                                <div className="modal-body">
                                    Select "Delete" below if you are ready to delete prescription:<br />
                                    <br /><strong>{prescriptions.firstname} {prescriptions.lastname} ({prescriptions.pId})</strong><br/><br/>
                                    <strong>Prescription: </strong>
                                    <p>{prescriptions.drugname} <br/> {prescriptions.dosage}<br/> 
                                    Price: ₦{prescriptions.price}<br/> Quantity: {prescriptions.quantity}<br/>
                                    Total Price: ₦{prescriptions.total_price}</p>
                                </div>
                            )}
                            <div className="modal-footer">
                                <button type="button" data-bs-dismiss="modal" onClick={DeletePrescriptions} className="btn btn-danger">Delete Prescriptions from Grid</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default WaitingList;

