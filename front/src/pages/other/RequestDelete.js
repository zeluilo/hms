import React, { useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { useAuth } from '../../components/containers/Context';
import { format } from 'date-fns';

Modal.setAppElement('#root');

const usePatientSearch = (initialDepartments) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredDepartments, setfilteredDepartments] = useState(initialDepartments);

    const filterDepartments = (departments, term) => {
        const lowerCaseSearchTerm = term.toLowerCase();

        if (!lowerCaseSearchTerm.trim()) {
            // If no search term, return all departments
            setfilteredDepartments(departments);
            return departments;
        }

        const filtered = departments.filter((department) => {
            // Check if department.id is a number before calling toLowerCase
            const pid = typeof department.pId === 'number' ? String(department.pId) : department.pId;

            return (
                department.firstname.toLowerCase().includes(lowerCaseSearchTerm) ||
                department.lastname.toLowerCase().includes(lowerCaseSearchTerm) ||
                pid.toLowerCase().includes(lowerCaseSearchTerm)
            );
        });

        setfilteredDepartments(filtered);
        return filtered;
    };

    useEffect(() => {
        filterDepartments(initialDepartments, searchTerm);
    }, [searchTerm, initialDepartments]);

    const handleSearchChange = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
    };

    return { searchTerm, filterDepartments, handleSearchChange, filteredDepartments, setSearchTerm };
};



const RequestDelete = () => {
    const { currentUser } = useAuth();

    const [patients, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const { searchTerm, filterDepartments, handleSearchChange, filteredDepartments, setSearchTerm } = usePatientSearch(patients);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/get-delete-request');
                setDepartments(response.data.request);
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
                        <h5><strong>{row.original.firstname} {row.original.lastname}</strong></h5>
                        <strong>Reg Date: </strong>{row.original.datecreate ? format(new Date(row.original.datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}<br />
                        <strong>PID: </strong> {row.original.pId || "-"}<br />
                        <strong>Age: </strong> {row.original.age || "-"}<br />
                        <strong>Number: </strong> {row.original.number || "-"}<br />
                        <strong>Email: </strong> {row.original.email || "-"}<br />
                        <strong>Address: </strong> {row.original.address || "-"}<br />
                        <strong>Gender: </strong> {row.original.gender || "-"}<br />
                    </div>

                ),
            },
            {
                Header: 'Reason for Delete',
                accessor: 'priceButton',
                Cell: ({ row }) => (
                    <div>
                        {row.original.reason || "-"}
                    </div>

                ),
            },
            {
                Header: 'Attended By',
                accessor: 'attende',
                Cell: ({ row }) => (
                    <div>
                        <strong>Dr. {row.original.user_firstname} {row.original.user_lastname}</strong><br />
                        {row.original.user_number || "-"}<br />
                        {row.original.user_email || "-"}
                    </div>
                ),
            },
            {
                Header: 'Request from',
                accessor: 'editButton',
                Cell: ({ row }) => (
                    <>
                        <button className='btn btn-outline-danger' style={{ margin: '10px' }} type="button" data-bs-toggle="modal" data-bs-target="#delete-message" onClick={() => handleEdit(row)}>Delete Message</button>
                        <button className='btn btn-outline-danger' style={{ margin: '10px' }} type="button" data-bs-toggle="modal" data-bs-target="#delete-patient" onClick={() => handleEdit(row)}>Delete Patient</button>
                    </>
                ),
            },
        ],
        []
    );

    const handleEdit = (row) => {
        // Set the selected patient for editing
        setSelectedDepartment(row.original);
        console.log('Selected: ', row.original)
    };

    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const DeleteMessage = async () => {
        try {
            const response = await axios.delete(`http://localhost:3001/thomas/delete-request/${selectedDepartment.requestId}`);
            if (response.data.message.includes('successfull')) {
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            } else {
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
            try {
                const response = await axios.get('http://localhost:3001/thomas/get-delete-request');
                setDepartments(response.data.request);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }

        } catch (error) {
            console.error('Error deleting drug:', error);
        }
    };


    const DeletePatient = async () => {
        try {
            // Delete the patient
            const patientResponse = await axios.delete(`http://localhost:3001/thomas/deletepatient?pId=${selectedDepartment.pId}`);
            
            // Delete the associated request
            await axios.delete(`http://localhost:3001/thomas/delete-all-request/${selectedDepartment.patientId}`);
            
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
                const getRequestResponse = await axios.get('http://localhost:3001/thomas/get-delete-request');
                setDepartments(getRequestResponse.data.request);
            } catch (error) {
                console.error('Error fetching requests:', error);
            }
        } catch (error) {
            console.error('Error deleting patient:', error);
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
            data: filteredDepartments, // Use filteredDepartments, not filterDepartments
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
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Request Lists</h5>
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
                                                placeholder="Search by PID/ Patient Name..."
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
                                    {filteredDepartments.length > 0 ? (
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
            </section >

            <div className="modal fade" id="delete-message" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form>
                            <div className="modal-header">
                                <h5 className="modal-title">Ready to Delete Message?</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            {selectedDepartment && (
                                <div className="modal-body">
                                    Select "Delete" below if you are ready to delete message:<br /><br /><strong>{selectedDepartment.reason}</strong>
                                </div>
                            )}
                            <div className="modal-footer">
                                <button type="button" data-bs-dismiss="modal" onClick={DeleteMessage} className="btn btn-danger">Delete Message from Grid</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="delete-patient" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form>
                            <div className="modal-header">
                                <h5 className="modal-title">Ready to Delete Patient?</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            {selectedDepartment && (
                                <div className="modal-body">
                                    Select "Delete" below if you are ready to delete Patinet:<br /><br /><strong>{selectedDepartment.firstname} {selectedDepartment.lastname} ({selectedDepartment.pId})</strong>
                                </div>
                            )}
                            <div className="modal-footer">
                                <button type="button" data-bs-dismiss="modal" onClick={DeletePatient} className="btn btn-danger">Delete Patient from Grid</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </main >
    );
};

export default RequestDelete;