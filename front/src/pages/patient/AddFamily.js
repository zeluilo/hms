import React, { useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const usePatientSearch = (initialPatients) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPatients, setFilteredPatients] = useState(initialPatients);

    const filterPatients = (patients, term) => {
        const lowerCaseSearchTerm = term.toLowerCase();

        const filtered = patients.filter((patient) => {
            const patientData = patient.relatives[0];
            console.log('View: ', patient) // Extract patient data from array
            // Check if patient.pId is a number before calling toLowerCase
            const patientPId = typeof patientData.pId === 'number' ? String(patientData.pId) : patientData.pId;

            // Filter based on patient and relative details
            return (
                patientData.firstname.toLowerCase().includes(lowerCaseSearchTerm) ||
                patientData.lastname.toLowerCase().includes(lowerCaseSearchTerm) ||
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


const AddFamily = () => {

    const [patients, setPatients] = useState([]);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm } = usePatientSearch(patients);

    useEffect(() => {
        const fetchData = async () => {
            try {

                const Response = await axios.get('http://localhost:3001/thomas/get-all-relatives');
                const relativeResponse = Response.data.relatives || [];

                // Process paid prescriptions
                const groupedPaidPrescriptions = {};
                relativeResponse.forEach((relatives) => {
                    const { pId } = relatives;
                    if (!groupedPaidPrescriptions[pId]) {
                        groupedPaidPrescriptions[pId] = [relatives];
                    } else {
                        groupedPaidPrescriptions[pId].push(relatives);
                    }
                });

                const relativeArray = Object.entries(groupedPaidPrescriptions).map(([pId, relatives]) => ({
                    pId,
                    relatives,
                }));
                setPatients(relativeArray);
                console.log('Response: ', relativeArray)


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
                Cell: ({ cell: { row } }) => {
                    const relative = row.original.relatives[0]; // Accessing the first relative
                    console.log("relative:", relative);
                    return (
                        <div>
                            <h5><strong>{relative.firstname} {relative.lastname}</strong></h5>
                            <strong>PID: </strong> {relative.pId || "-"}<br />
                            <strong>Age: </strong> {relative.age || "-"}<br />
                            <strong>Number: </strong> {relative.number || "-"}<br />
                            <strong>Email: </strong> {relative.email || "-"}<br />
                            <strong>Address: </strong> {relative.address || "-"}<br />
                            <strong>Gender: </strong> {relative.gender || "-"}
                        </div>
                    );
                },
            },
            {
                Header: 'Add Family Member/Friend',
                accessor: 'familyButton',
                Cell: ({ row }) => (
                    <button type="button" className='btn btn-outline-dark btn-md rounded-pill' data-bs-toggle="modal" data-bs-target="#modalDialogScrollable" onClick={() => handleAdd(row)}>Add Family Member/Friend</button>

                ),
            },
            {
                Header: 'View All Relatives',
                accessor: 'allfamilyButton',
                Cell: ({ row }) => (
                    <button type="button" className='btn btn-outline-dark btn-md rounded-pill' data-bs-toggle="modal" data-bs-target="#family" onClick={() => handleView(row)}>View All</button>

                ),
            },
        ],
        []
    );

    const handleAdd = (row) => {
        // Set the selected patient for editing
        setSelectedPatient(row.original);
        // Set the formData state for patientId
        setFormData((prev) => ({
            ...prev,
            patientId: row.original.pId,
        }));
    };

    const handleView = (row) => {

        setSelectedPatient(row.original);
        // Set the formData state for patientId
        setFormData((prev) => ({
            ...prev,
            patientId: row.original.pId,
        }));
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const initialFormData = {
        firstname: '',
        lastname: '',
        email: '',
        number: '',
        address: '',
        patientId: '',
        relation: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Check if a patient with the same email or number already exists
            const response = await axios.post('http://localhost:3001/thomas/addfamily', formData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.message.includes('already exists')) {
                // Display an alert if a duplicate is found
                console.log('Registration unsuccessful:', response.data);
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scroll(0, 0);
            } else if (response.data.message.includes('added successfully!')) {
                // If the message includes 'added successfully', it's a successful registration
                console.log('Registration successful:', response.data);
                // Clear form data
                setFormData(initialFormData);
                
                // Reset error message and hide error alert
                setErrorMessage('Member added successfully!');
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
            console.error('Error registering Member:', error);
            // Handle the error, e.g., display an error message to the user
            setErrorMessage('Error registering Member. Please try again.');
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
                <h1>Add a Family Friend</h1>
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
                                    <div className="col-lg-6">
                                        <div className="datatable-search">
                                            <input
                                                className="form-control"
                                                placeholder="Enter a PID, Name of Patient or Phone No here to search..."
                                                type="search"
                                                title="Search within table"
                                                value={searchTerm}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                </div>
                                {showErrorAlert && (
                                    <div className={`form-control alert ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`} role="alert">
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
            <div className="modal fade" id="modalDialogScrollable" tabIndex="-1">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add Family Member/Friend</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {selectedPatient && (
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <input type="hidden" name="patientId" value={formData.patientId || ''} />
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">First Name</label>
                                        <div className="col-md-8">
                                            <input name="firstname" type="text" className="form-control" placeholder="Enter first name" value={formData.firstname} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">Last Name</label>
                                        <div className="col-md-8">
                                            <input name="lastname" type="text" className="form-control" placeholder="Enter last name" value={formData.lastname} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">Email Address</label>
                                        <div className="col-md-8">
                                            <input name="email" type="email" className="form-control" placeholder="Enter email" value={formData.email} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">Phone Number</label>
                                        <div className="col-md-8">
                                            <input name="number" type="text" className="form-control" placeholder="Enter Phone Number" value={formData.number} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">Home Address</label>
                                        <div className="col-md-8">
                                            <textarea name="address" type="text" className="form-control" placeholder="Enter Home Address" value={formData.address} onChange={handleChange}></textarea>
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-4 col-lg-3 col-form-label">Relation to Patient</label>
                                        <div className="col-md-8">
                                            <input name="relation" type="text" className="form-control" placeholder="Enter Relation" value={formData.relation} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <button type="submit" data-bs-dismiss="modal" className="btn btn-primary">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* END OF MODAL */}

            {/* EDIT PATIENT MODAL */}
            <div className="modal fade" id="family" tabIndex="-1">
                <div className="modal-dialog modal-xl">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">All Registered Relatives</h3>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {selectedPatient && selectedPatient.relatives && selectedPatient.relatives.length > 0 ? (
                            <div className="modal-body">
                                <h4>{selectedPatient.firstname} {selectedPatient.lastname}</h4>
                                <div>
                                    <table className='table table-hover'>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Number</th>
                                                <th>Address</th>
                                                <th>Relation</th>
                                                <th>Created At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPatient.relatives.map((relative, index) => (
                                                <tr key={index}>
                                                    <td>{relative.relative_firstname} {relative.relative_lastname}</td>
                                                    <td>{relative.relative_email}</td>
                                                    <td>{relative.relative_number}</td>
                                                    <td>{relative.relative_address}</td>
                                                    <td>{relative.relation}</td>
                                                    <td>{relative.datecreate ? format(new Date(relative.datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="modal-body">
                                <p style={{color:'red'}}>No registered relatives for this patient.</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
            {/* END OF MODAL */}

        </main>
    );
};

export default AddFamily;