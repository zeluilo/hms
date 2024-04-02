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

    const filterPatients = (appointments, term) => {
        const lowerCaseSearchTerm = term.toLowerCase();

        if (!lowerCaseSearchTerm.trim()) {
            // If no search term, return all patients
            setFilteredPatients(appointments);
            return appointments;
        }

        const filtered = appointments.filter((patient) => {
            // Check if patient.pId is a number before calling toLowerCase
            const patientPId = typeof patient.pId === 'number' ? String(patient.pId) : patient.pId;

            return (
                patient.firstname.toLowerCase().includes(lowerCaseSearchTerm) ||
                patient.lastname.toLowerCase().includes(lowerCaseSearchTerm) ||
                patient.status.toLowerCase().includes(lowerCaseSearchTerm) ||
                patientPId.toLowerCase().includes(lowerCaseSearchTerm)
            );
        });

        setFilteredPatients(filtered);
        return filtered;
    };

    useEffect(() => {
        filterPatients(initialPatients, searchTerm);
    }, [searchTerm, initialPatients]);

    const handleSearchChange = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
    };

    return { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm };
};


const ReceptionistDebt = () => {
    const { currentUser } = useAuth();

    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [departments, setDepartments] = useState([]);
    const { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm } = usePatientSearch(patients);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/getallbookings');
                setPatients(response.data.appointments);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };

        fetchData();
    }, []);


    const customSort = (rowA, rowB) => {
        // Move 'Paid' status to the bottom
        if (rowA.original.status === 'Has Paid' && rowB.original.status !== 'Has Paid') {
            return 1;
        }
        if (rowA.original.status !== 'Has Paid' && rowB.original.status === 'Has Paid') {
            return -1;
        }
        return rowA.original.price - rowB.original.price; // Fallback to default sorting by price
    };

    const columns = React.useMemo(
        () => [
            {
                Header: 'Patient Details',
                accessor: 'patientDetailsButton',
                Cell: ({ row }) => (
                    <div>
                        <h5><strong>{row.original.firstname} {row.original.lastname}</strong></h5>
                        <strong>PID: </strong> {row.original.pId || "-"}<br />
                        <strong>Booking Id: </strong> {row.original.bookingId || "-"}<br />
                        <strong>Number: </strong> {row.original.number || "-"}<br />
                        <strong>Email: </strong> {row.original.email || "-"}<br />
                        <strong>Booked on: </strong> {row.original.booking_datecreate ? format(new Date(row.original.booking_datecreate), 'yyyy/MM/dd') : "-"}<br />
                    </div>
                ),
            },
            {
                Header: 'Attending Doctor',
                accessor: 'doctorButton',
                Cell: ({ row }) => (
                    <div>
                        {row.original.doctor || "-"}
                    </div>
                ),
            },
            {
                Header: 'Type of Visit',
                accessor: 'reasonButton',
                Cell: ({ row }) => (
                    <div>
                        {row.original.typeofvisit || "-"}
                    </div>
                ),
            },
            {
                Header: 'Payment',
                accessor: 'priceButton',
                Cell: ({ row }) => (
                    <div>
                        {row.original.status || ''}<br />
                    </div>
                ),
                sortType: (rowA, rowB) => customSort(rowA, rowB), // Apply custom sort logic
            },
            {
                Header: 'Pay Now',
                accessor: 'editButton',
                Cell: ({ row }) => (
                    <button type="button" data-bs-toggle="modal" data-bs-target="#modalDialogScrollable"
                    className='btn btn-outline-dark btn-md rounded-pill'
                        onClick={() => handleEdit(row)} disabled={row.original.status === 'Has Paid'}>Pay Now</button>
                ),
            },
            {
                Header: 'Print Receipt',
                accessor: 'printButton',
                Cell: ({ row }) => (
                    <button type="button" onClick={() => handlePrint(row)} 
                    className='btn btn-outline-dark btn-md rounded-pill'
                    disabled={row.original.status === 'Not Paid' || row.original.price === 0}>Print Receipt</button>
                ),
            },
        ],
        []
    );

    const handleEdit = async (row) => {
        try {
            // Set the selected patient for editing
            setSelectedPatient(row.original);

            // Fetch the latest receipt number from the database
            const latestReceiptNumber = await getLatestReceiptNumber();

            // Generate and set the receipt number based on the fetched latest receipt number
            const nextReceiptNumber = generateNextReceiptNumber(latestReceiptNumber);
            setReceiptNumber(nextReceiptNumber);

            // Update the formData state with the values of the selected patient
            setFormData((prev) => ({
                ...prev,
                receiptNo: nextReceiptNumber, // Assign the generated receipt number to the form data
                total_amount: row.original.price,
                bookingId: row.original.bookingId,
            }));
        } catch (error) {
            console.error('Error handling edit:', error);
            // Handle the error, e.g., display an error message to the user
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

    const handlePrint = async (row) => {

        try {
            const printWindow = window.open('', '_blank');
            const response = await axios.get(`http://localhost:3001/thomas/getpaymentdetails/${row.original.bookingId}`);
            const paymentDetails = response.data.PaymentDetails;
            console.log("Payment: ", paymentDetails);

            const convertToPositive = (number) => {
                return number < 0 ? Math.abs(number) : number;
            };

            if (printWindow) {
                printWindow.document.write(`<html><head>
            <meta charset="utf-8" />
            <title>${paymentDetails.firstname}'s Receipt</title>
            <style>
                        .invoice-box {
                            max-width: 800px;
                            margin: auto;
                            padding: 30px;
                            border: 1px solid #eee;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
                            font-size: 16px;
                            line-height: 24px;
                            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                            color: #555;
                        }
            
                        .invoice-box table {
                            width: 100%;
                            line-height: inherit;
                            text-align: left;
                        }
            
                        .invoice-box table td {
                            padding: 5px;
                            vertical-align: top;
                        }
            
                        .invoice-box table tr td:nth-child(2) {
                            text-align: right;
                        }
            
                        .invoice-box table tr.top table td {
                            padding-bottom: 20px;
                        }
            
                        .invoice-box table tr.top table td.title {
                            font-size: 45px;
                            line-height: 45px;
                            color: #333;
                        }
            
                        .invoice-box table tr.information table td {
                            padding-bottom: 40px;
                        }
            
                        .invoice-box table tr.heading td {
                            background: #eee;
                            border-bottom: 1px solid #ddd;
                            font-weight: bold;
                        }
            
                        .invoice-box table tr.details td {
                            padding-bottom: 20px;
                        }
            
                        .invoice-box table tr.item td {
                            border-bottom: 1px solid #eee;
                        }
            
                        .invoice-box table tr.item.last td {
                            border-bottom: none;
                        }
            
                        .invoice-box table tr.total td:nth-child(2) {
                            border-top: 2px solid #eee;
                            font-weight: bold;
                        }
            
                        @media only screen and (max-width: 600px) {
                            .invoice-box table tr.top table td {
                                width: 100%;
                                display: block;
                                text-align: center;
                            }
            
                            .invoice-box table tr.information table td {
                                width: 100%;
                                display: block;
                                text-align: center;
                            }
                        }
            
                        /** RTL **/
                        .invoice-box.rtl {
                            direction: rtl;
                            font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                        }
            
                        .invoice-box.rtl table {
                            text-align: right;
                        }
            
                        .invoice-box.rtl table tr td:nth-child(2) {
                            text-align: left;
                        }
                    </style>
        </head>
    <body>`);
                printWindow.document.write(`
                <div class="invoice-box">
			<table cellpadding="0" cellspacing="0">
				<tr class="top">
					<td colspan="2">
						<table>
							<tr>
								<td class="title">
									<img
										src=${process.env.PUBLIC_URL}/img/thomas1.png
										style="width: 100%; max-width: 100px"
									/>
								</td>

								<td>
									Invoice #: ${paymentDetails.receiptNo}<br />
                                    Paid on: ${new Date(paymentDetails.payment_datecreate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </td>
							</tr>
						</table>
					</td>
				</tr>

				<tr class="information">
					<td colspan="2">
						<table>
							<tr>
								<td>
                                    2 Upper Niger Bridge Road,<br />
                                    Niger Bridge Layout,<br />
                                    Onitsha,<br />
                                    Anambra State,<br />
									Nigeria, <br/>
                                    434243
								</td>

								<td>
									${paymentDetails.firstname} ${paymentDetails.lastname} | PID: ${paymentDetails.pId}<br />
                                    ${paymentDetails.email}<br />
                                    ${paymentDetails.number}<br />
                                    ${paymentDetails.address}<br />
                                </td>
							</tr>
						</table>
					</td>
				</tr>

				<tr class="heading">
					<td>Payment Method</td>

					<td>Amount Paid</td>
				</tr>

				<tr class="details">
					<td>${paymentDetails.method}</td>

					<td>₦${paymentDetails.amount_paid}</td>
				</tr>

				<tr class="heading">
					<td>Type of Registration</td>

					<td>Price</td>
				</tr>

				<tr class="item">
					<td>${paymentDetails.typeofvisit}</td>

					<td>₦${paymentDetails.total_amount}</td>
				</tr>

				<tr class="total">
					<td></td>

					<td>Total: ₦${paymentDetails.total_amount}<br/><br/>
                    Change: ₦${convertToPositive(paymentDetails.balance)}</td>

				</tr>
			</table>
		</div>
	</body>
    
    </html>`);

                // Close the document
                printWindow.document.close();

                // Print the window
                printWindow.print();
            } else {
                console.error('Error opening print window');
            }
        } catch (error) {
            console.error('Error fetching payment details:', error);
        }
    };

    const handleChange = (e, fieldName) => {
        const { name, value } = e.target;

        // Check if the changed field is the amount_paid input
        if (name === 'amount_paid') {
            // Calculate the balance by subtracting the amount paid from the total amount
            const amountPaid = parseFloat(value) || '';
            const totalAmount = parseFloat(selectedPatient.price) || 0;
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

    const initialFormData = {
        receiptNo: '',
        total_amount: '',
        amount_paid: '',
        balance: '',
        bookingId: '',
        method: '',
        userId: currentUser?.id,
    };

    const [receiptNumber, setReceiptNumber] = useState('000');
    const [formData, setFormData] = useState(initialFormData);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [bookingStatusUpdateSuccess, setBookingStatusUpdateSuccess] = useState(false);

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
                bookingId: formData.bookingId,
                userId: currentUser.id, // Assuming you can get userId from your context
                status: 'Has Paid',
                datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
            };

            console.log('Adding Payment:', paymentData);

            // Check if a patient with the same email or number already exists
            const response = await axios.post('http://localhost:3001/thomas/addpayment', paymentData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.message.includes('already exists')) {
                // Display an alert if a duplicate is found
                console.log('Payment unsuccessful:', response.data);
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scroll(0, 0);
            } else if (response.data.message.includes('added successfully!')) {
                console.log('Payment successful:', response.data);

                // Set the bookingTable status to "Paid"
                const updateStatusResponse = await axios.put(`http://localhost:3001/thomas/updateBookingStatus/${formData.bookingId}`, {
                    status: 'Has Paid',
                });

                if (updateStatusResponse.data.message.includes('updated successfully!')) {
                    setBookingStatusUpdateSuccess(true);
                } else {
                    console.error('Error updating booking status:', updateStatusResponse.data);
                    setBookingStatusUpdateSuccess(false);
                }
                const updatedResponse = await axios.get('http://localhost:3001/thomas/getallbookings');
                setPatients(updatedResponse.data.appointments);
                setFormData(initialFormData);
                setErrorMessage('Paid successfully!');
                setShowErrorAlert(true);
                window.scroll(0, 0);
            } else {
                // Handle other cases where the response is not as expected
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scroll(0, 0);
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
            data: filteredPatients,
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
                                {showErrorAlert && (
                                    <div className={`form-control alert ${errorMessage.includes('successfully!') ? 'alert-success' : 'alert-danger'}`} role="alert">
                                        {errorMessage}
                                    </div>
                                )}


                                {/* Datatable container */}
                                <div className="datatable-container">
                                    {filteredPatients.length > 0 ? (
                                        <table {...getTableProps()} className="table table-bordered table-hover">
                                            <thead className='tbale table-primary'>
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

            {/* EDIT PATIENT MODAL */}
            <div className="modal fade" id="modalDialogScrollable" tabIndex="-1" >
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Booking Details</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {selectedPatient && (
                            <div className="modal-body">
                                <h5><strong>{selectedPatient.firstname} {selectedPatient.lastname}</strong> ||<strong> PID: </strong>{selectedPatient.patientId}</h5><br />
                                <p><strong>Summary of Visit:</strong><br /> <span>{selectedPatient.reason}</span></p>
                                <p><strong>Price:</strong><br /> <span>₦{selectedPatient.price}</span></p>
                                <p><strong>Attending Doctor:</strong><br /> <span>{selectedPatient.doctor}</span></p>
                                <p><strong>Time to Visit:</strong><br /> <span>{selectedPatient.timetovisit ? format(new Date(selectedPatient.timetovisit), 'yyyy/MM/dd HH:mm:ss') : "-"}</span></p>
                                <p><strong>Status:</strong><br /> <span>{selectedPatient.status}</span></p>
                                <p><strong>Booked on:</strong><br /> <span>{selectedPatient.booking_datecreate ? format(new Date(selectedPatient.booking_datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}</span></p>
                                <p><strong>Booked by:</strong><br /> <span>{selectedPatient.booking_datecreate ? format(new Date(selectedPatient.booking_datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}</span></p><br />
                                <br />
                                <h5 className="modal-title"><strong>Payment Details</strong></h5><br />
                                <form onSubmit={handleSubmit}>
                                    <input type="hidden" name="bookingId" value={formData.bookingId} />
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

        </main>
    );
};

export default ReceptionistDebt;