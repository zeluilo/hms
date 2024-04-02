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

        if (!lowerCaseSearchTerm.trim()) {
            // If no search term, return all patients
            setFilteredPatients(patients);
            return patients;
        }

        const filtered = patients.filter((patient) => {
            // Check if patient.pId is a number before calling toLowerCase

            return (
                patient.firstname.toLowerCase().includes(lowerCaseSearchTerm) ||
                patient.lastname.toLowerCase().includes(lowerCaseSearchTerm));
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



const ManageAccountant = () => {

    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm } = usePatientSearch(patients);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/get-all-users');
                setPatients(response.data.accountant);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };

        fetchData();
    }, []);

    const columns = React.useMemo(
        () => [
            {
                Header: 'Accountant',
                accessor: 'patientDetailsButton',
                Cell: ({ row }) => (
                    <div>
                        <h3><strong>{row.original.firstname} {row.original.lastname}</strong></h3>
                        <strong>Age: </strong> {row.original.age || "-"}<br />
                        <strong>Gender: </strong> {row.original.gender || "-"}<br />
                    </div>
                ),
            },
            {
                Header: 'Created At',
                accessor: 'date',
                Cell: ({ row }) => (
                    <div>{row.original.datecreate ? format(new Date(row.original.datecreate), 'yyyy/MM/dd') : "-"}</div>
                ),
            },
            {
                Header: 'Number',
                accessor: 'number',
                Cell: ({ row }) => (
                    <div>{row.original.number || "-"}</div>
                ),
            },
            {
                Header: 'Email',
                accessor: 'email',
                Cell: ({ row }) => (
                    <div>{row.original.email || "-"}</div>
                ),
            },
            {
                Header: 'Address',
                accessor: 'address',
                Cell: ({ row }) => (
                    <div>{row.original.address || "-"}</div>
                ),
            },
            {
                Header: 'Action',
                accessor: 'editButton',
                Cell: ({ row }) => (
                    <div style={{ display: 'flex' }}>
                        <div style={{ marginRight: '10px' }}>
                            <i
                                type="button"
                                className='bi bi-eye-fill'
                                data-bs-toggle="modal"
                                data-bs-target="#modalDialogScrollable"
                                onClick={() => handleEdit(row)}
                            ></i>
                        </div>
                        <div>
                            <i
                                type="button"
                                className='bi bi-trash-fill'
                                data-bs-toggle="modal"
                                data-bs-target="#delete-patient"
                                onClick={() => handleEdit(row)}
                            ></i>
                        </div>
                    </div>

                ),
            },
        ],
        []
    );

    const handleEdit = (row) => {
        // Set the selected patient for editing
        setSelectedPatient(row.original);
        // Set the formData state for pId
        setFormData((prev) => ({
            ...prev,
            pId: row.original.pId,
        }));
    };

    const handleInputChange = (e, fieldName) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: e.target.value,
        }));

        setSelectedPatient((prev) => ({
            ...prev,
            [fieldName]: e.target.value,
        }));
    };


    const initialFormData = {
        firstname: '',
        lastname: '',
        email: '',
        number: '',
        address: '',
        dob: '',
        gender: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {

            if (!selectedPatient) {
                console.error('Selected patient is null. Cannot make the update request.');
                return;
            }
            const response = await axios.put(
                `http://localhost:3001/thomas/update-profile/${selectedPatient.id}`,
                {
                    firstname: selectedPatient.firstname,
                    lastname: selectedPatient.lastname,
                    email: selectedPatient.email,
                    number: selectedPatient.number,
                    address: selectedPatient.address,
                    dob: selectedPatient.dob,
                    age: selectedPatient.age,
                    gender: selectedPatient.gender,
                    dateupdate: selectedPatient.dateupdate,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            // Handle response accordingly
            if (response.data.message.includes('already exists')) {
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            } else if (response.data.message.includes('at least 1 year old to be added')) {
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            } else if (response.data.message.includes('updated successfully!')) {
                console.log('Update successful:', response.data);
                setFormData(initialFormData);

                // Update the local state to reflect the changes
                setPatients((prevPatients) => {
                    const updatedPatients = prevPatients.map((patient) => {
                        if (patient.pId === selectedPatient.pId) {
                            // Update the patient data
                            return {
                                ...patient,
                                firstname: selectedPatient.firstname,
                                lastname: selectedPatient.lastname,
                                email: selectedPatient.email,
                                number: selectedPatient.number,
                                address: selectedPatient.address,
                                dob: selectedPatient.dob,
                                age: selectedPatient.age,
                                gender: selectedPatient.gender,
                                dateupdate: new Date().toISOString().slice(0, 19).replace("T", " "),
                            };
                        }
                        return patient;
                    });

                    return updatedPatients;
                });
                setShowErrorAlert(true);
                setErrorMessage('Patient updated successfully!');
                window.scrollTo(0, 0);
            } else {
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error updating patient:', error);
            setErrorMessage('Error updating patient. Please try again.');
            setShowErrorAlert(true)
            window.scrollTo(0, 0);
        }
    };

    const DeleteAdmin = async () => {
        try {
            // Delete the patient
            const patientResponse = await axios.delete(`http://localhost:3001/thomas/delete-admin?id=${selectedPatient.id}`);
            
            // Delete the associated request            
            if (patientResponse.data.message.includes('successfull')) {
                setErrorMessage(patientResponse.data.message);
                setShowErrorAlert(true);
                try {
                    const response = await axios.get('http://localhost:3001/thomas/get-all-users');
                    setPatients(response.data.accountant);
                } catch (error) {
                    console.error('Error fetching patients:', error);
                }
                window.scrollTo(0, 0);
            } else {
                setErrorMessage(patientResponse.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error deleting patient:', error);
        }
    };

    const formatDate = (dateString) => {
        // Assuming dateString is in a different format, adjust the parsing accordingly
        const dateObject = new Date(dateString);
        const formattedDate = dateObject.toISOString().split('T')[0];
        return formattedDate;
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
                <h1>Accountant Lists</h1>
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
                                <h5 className="card-title">Accountant Table</h5>

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
                                                placeholder="Search by Admin Name..."
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
                                        <div className="table datatable datatable-table" style={{ padding: "10px" }}><strong>No Accountant Searched</strong></div>
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
                            <h5 className="modal-title">Edit Accountant Details</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {selectedPatient && (
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <input type="hidden" name="pId" value={formData.pId || ''} />
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">First Name</label>
                                        <div className="col-md-7">
                                            <input name="firstname" type="text" className="form-control" value={selectedPatient.firstname} onChange={(e) => handleInputChange(e, 'firstname')}
                                                required />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">Last Name</label>
                                        <div className="col-md-7">
                                            <input name="lastname" type="text" className="form-control" value={selectedPatient.lastname} onChange={(e) => handleInputChange(e, 'lastname')} required />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">Email Address</label>
                                        <div className="col-md-7">
                                            <input name="email" type="email" className="form-control" value={selectedPatient.email} onChange={(e) => handleInputChange(e, 'email')} />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">Phone Number</label>
                                        <div className="col-md-7">
                                            <input name="number" type="text" className="form-control" value={selectedPatient.number} onChange={(e) => handleInputChange(e, 'number')} required />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">Home Address</label>
                                        <div className="col-md-7">
                                            <textarea name="address" type="text" className="form-control" value={selectedPatient.address} onChange={(e) => handleInputChange(e, 'address')} required />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">Gender</label>
                                        <div className="col-md-7">
                                            <select className="form-control" name="gender" value={selectedPatient.gender} onChange={(e) => handleInputChange(e, 'gender')} required>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">DoB</label>
                                        <div className="col-md-7">
                                            <input name="dob" type="date" className="form-control" max={new Date().toISOString().split('T')[0]} value={formatDate(selectedPatient.dob)} onChange={(e) => handleInputChange(e, 'dob')} required />
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

            <div className="modal fade" id="delete-patient" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form>
                            <div className="modal-header">
                                <h5 className="modal-title">Ready to Delete Admin?</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            {selectedPatient && (
                                <div className="modal-body">
                                    Select "Delete" below if you are ready to delete Patinet:<br /><br /><strong>{selectedPatient.firstname} {selectedPatient.lastname}</strong>
                                </div>
                            )}
                            <div className="modal-footer">
                                <button type="button" data-bs-dismiss="modal" onClick={DeleteAdmin} className="btn btn-danger">Delete User from Grid</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>


        </main>
    );
};

export default ManageAccountant;