import React, { useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Modal from 'react-modal';
import { useAuth } from '../../components/containers/Context';

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
                const prescriptionPId = typeof prescription.paymentId === 'number' ? String(prescription.paymentId) : prescription.paymentId;

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


const PharmacistDebt = () => {
    const { currentUser } = useAuth();

    const [prescriptions, setPrescriptions] = useState([]);
    const { searchTerm, filterPrescriptions, handleSearchChange, filteredPrescriptions, setSearchTerm } = usePatientSearch(prescriptions);

    useEffect(() => {
        const fetchData = async () => {
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
            } catch (error) {
                console.error('Error fetching patients:', error);
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
                    return (
                        <div>
                            <h5><strong>{prescription.firstname} {prescription.lastname}</strong></h5>
                            <strong>PID: </strong> {prescription.pId || "-"}<br />
                            <strong>Number: </strong> {prescription.number || "-"}<br />
                            <strong>Email: </strong> {prescription.email || "-"}<br />
                            <strong>Precriped on: </strong> {prescription.booking_datecreate ? format(new Date(prescription.booking_datecreate), 'yyyy/MM/dd') : "-"}<br />
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
                accessor: 'reasonButton',
                Cell: ({ row }) => {
                    const prescription = row.original.prescriptions[0]; // Accessing the first prescription
                    return (
                        <div>
                            ₦{prescription.prescription_price}
                        </div>
                    );
                },
            },
            {
                Header: 'Payment',
                accessor: 'priceButton',
                Cell: ({ cell: { row } }) => {
                    const prescription = row.original.prescriptions[0]; // Accessing the first prescription
                    return (
                        <div>
                            {prescription.payment_status}
                        </div>
                    );
                },
            },
            {
                Header: 'Print Receipt',
                accessor: 'printButton',
                Cell: ({ row }) => (
                    <button className='btn btn-outline-dark btn-md rounded-pill' type="button" onClick={() => handlePrint(row)}>Print Receipt</button>
                ),
            },
        ],
        []
    );


    const handlePrint = async (row) => {
        try {
            const printWindow = window.open('', '_blank');

            const convertToPositive = (number) => {
                return number < 0 ? Math.abs(number) : number;
            };

            if (printWindow) {
                printWindow.document.write(`<html><head>
                    <meta charset="utf-8" />
                    <title>Receipt</title>
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
                </head><body>`);

                const response = await axios.get(`http://localhost:3001/thomas/get-Payment-Details/${row.original.paymentId}`);
                const paymentDetails = response.data.PaymentDetails;
                console.log('Payment Details: ', paymentDetails);

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
                                <td>Drug</td>
    
                                <td>Price</td>
                            </tr>
                `);

                // Iterate over each prescription in row.original.prescriptions
                row.original.prescriptions.forEach((prescription) => {
                    printWindow.document.write(`
                        <tr class="item">
                            <td>${prescription.drugname}</td>
                            <td>₦${prescription.prescription_price}</td>
                        </tr>
                    `);
                });

                printWindow.document.write(`
                            <tr class="total">
                                <td></td>
    
                                <td>Total: ₦${paymentDetails.total_amount}<br/><br/>
                                Change: ₦${convertToPositive(paymentDetails.balance)}</td>
                            </tr>
                        </table>
                    </div>
                `);

                // Close the body and html tags
                printWindow.document.write(`</body></html>`);

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
        </main>
    );
};

export default PharmacistDebt;;