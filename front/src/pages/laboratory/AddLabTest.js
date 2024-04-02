import React, { useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Modal from 'react-modal';
import { useAuth } from '../../components/containers/Context';

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

            return (
                department.testname.toLowerCase().includes(lowerCaseSearchTerm) ||
                department.department.toLowerCase().includes(lowerCaseSearchTerm)
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



const AddLabTest = () => {
    const { currentUser } = useAuth();

    const [patients, setPatients] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const { searchTerm, filterDepartments, handleSearchChange, filteredDepartments, setSearchTerm } = usePatientSearch(patients);
    const [showDepartment, setShowDepartment] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/get-labtest');
                setPatients(response.data.labTests);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/getdepartment');
                const departmentsData = response.data.patients;

                if (departmentsData && departmentsData.length > 0) {
                    const sortedDepartments = departmentsData.sort((a, b) =>
                        a.department.localeCompare(b.department)
                    );
                    setDepartments(sortedDepartments);
                } else {
                    console.error('No departments found in the response:', response.data);
                }
            } catch (error) {
                console.error('Error fetching departments:', error);
            }
        };

        fetchDepartments();
    }, []);

    const columns = React.useMemo(
        () => [
            {
                Header: 'Lab Test Details',
                accessor: 'patientDetailsButton',
                Cell: ({ row }) => (
                    <div>
                        {row.original.testname || "-"}
                    </div>

                ),
            },
            {
                Header: 'Price',
                accessor: 'priceButton',
                Cell: ({ row }) => (
                    <div>
                        ₦{row.original.price || "Free"}
                    </div>

                ),
            },
            {
                Header: 'Departments',
                accessor: 'departmentButton',
                Cell: ({ row }) => (
                    <div>
                        {row.original.department || "-"}
                    </div>

                ),
            },
            {
                Header: 'Action',
                accessor: 'actionButtons',
                Cell: ({ row }) => (
                    <div>
                        <button type="button" data-bs-toggle="modal" data-bs-target="#modalDialogScrollable" onClick={() => handleEdit(row)}>Edit Lab Test</button>&nbsp;
                        <button type="button" data-bs-toggle="modal" data-bs-target="#delete" onClick={() => handleDelete(row)}>Delete Lab Test</button>
                    </div>
                ),
            },
        ],
        []
    );

    const handleEdit = (row) => {
        // Set the selected patient for editing
        setSelectedDepartment(row.original);
        // Set the formData state for pId
        setFormData((prev) => ({
            ...prev,
            id: row.original.id,
        }));
    };

    const handleDelete = (row) => {
        setSelectedDepartment(row.original);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await axios.delete(`http://localhost:3001/thomas/delete-labtest/${selectedDepartment.id}`);
            setPatients((prevDepartments) =>
                prevDepartments.filter((department) => department.id !== selectedDepartment.id)
            );
            if (response.data.message.includes('already exists')) {
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            } else {
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error deleting lab test:', error);
        }
    };

    const handleInputChange = (e, fieldName) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: e.target.value,
        }));

        setSelectedDepartment((prev) => ({
            ...prev,
            [fieldName]: e.target.value,
        }));
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const initialFormData = {
        testname: '',
        price: '',
        department: '',
        userId: currentUser?.id,  // Assuming you can get userId from your context
        datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();

        try {

            if (!selectedDepartment) {
                console.error('Selected lab test is null. Cannot make the update request.');
                return;
            }

            const response = await axios.put(
                `http://localhost:3001/thomas/update-labtest/${selectedDepartment.id}`,
                {
                    testname: selectedDepartment.testname,
                    price: selectedDepartment.price,
                    department: selectedDepartment.department
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
            } else if (response.data.message.includes('updated successfully!')) {
                console.log('Update successful:', response.data);
                setFormData(initialFormData);

                // Update the local state to reflect the changes
                setPatients((prevDepartments) => {
                    const updatedDepartment = prevDepartments.map((department) => {
                        if (department.id === selectedDepartment.id) {
                            // Update the department data
                            return {
                                ...department,
                                testname: selectedDepartment.testname,
                                price: selectedDepartment.price,
                                department: selectedDepartment.department
                            };
                        }
                        return department;
                    });

                    return updatedDepartment;
                });
                setShowErrorAlert(true);
                setErrorMessage('Lab Test updated successfully!');
                window.scrollTo(0, 0);
            } else {
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error updating Lab Test:', error);
            setErrorMessage('Error updating Lab Test. Please try again.');
            setShowErrorAlert(true)
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const labTestData = {
            testname: formData.testname,
            price: formData.price,
            department: formData.department,
            userId: currentUser.id, // Assuming you can get userId from your context
        };

        console.log('Adding lab test:', labTestData);

        try {
            const response = await axios.post('http://localhost:3001/thomas/add-labtest', labTestData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            // Handle response accordingly
            if (response.data.message.includes('already exists')) {
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            } else if (response.data.message.includes('added successfully!')) {
                console.log('Added successful:', response.data);
                setFormData(initialFormData);
                const updatedResponse = await axios.get('http://localhost:3001/thomas/get-labtest');
                setPatients(updatedResponse.data.labTests);
                setShowErrorAlert(true);
                setErrorMessage('Lab Test added successfully!');
                window.scrollTo(0, 0);
            } else {
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error adding Lab Test:', error);
            setErrorMessage('Error adding Lab Test. Please try again.');
            setShowErrorAlert(true)
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
                <h1>Laboratory Test List</h1>
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

                                <form onSubmit={handleSubmit}>
                                    <h5 className="card-title">Lab Test Information</h5>

                                    {/* PATIENT INFORMATION */}
                                    {showErrorAlert && (
                                        <div className={`form-control alert ${errorMessage.includes('Lab Test updated successfully!') || errorMessage.includes('Lab Test added successfully!') || errorMessage.includes('Lab Test deleted successfully!') ? 'alert-success' : 'alert-danger'}`} role="alert">
                                            {errorMessage}
                                        </div>
                                    )}
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Laboratory Test Name</label>
                                        <input type="text" name='testname' className="form-control" id="exampleFormControlInput1" placeholder="Enter test name" value={formData.testname} onChange={handleChange} required />
                                    </div>

                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Test Price</label>
                                        <input type="text" name='price' pattern="^\d+(\.\d{1,2})?$" className="form-control" id="exampleFormControlInput1" placeholder="Enter price" value={formData.price} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label >Department</label>
                                        <select className="form-control" name='department' value={formData.department} onChange={handleChange} required>
                                            <option value="">Select a department</option>
                                            <option value="Laboratory Scientist">Laboratory Scientist</option>
                                            <option value="Radiologist">Radiologist</option>
                                            <option value="Special">Special</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <button type="submit" name='submit' style={{ width: '100%', marginTop: '10px' }} className="btn btn-outline-primary">Add Test To Grid</button>
                                </form><br />

                                {/* Custom HTML structure for datatable-top */}
                                <br />
                                <h5 className="card-title">Lab Test Table</h5>
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
                                                placeholder="Search by Lab Test Name..."
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
                                    {filteredDepartments.length > 0 ? (
                                        <table {...getTableProps()} className="table datatable datatable-table">
                                            <thead>
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
                                        <div className="table datatable datatable-table" style={{ padding: "10px" }}><strong>No Lab Test Searched</strong></div>
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

            {/* EDIT PATIENT MODAL */}
            < div className="modal fade" id="modalDialogScrollable" tabIndex="-1" >
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Edit Lab Test Details</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {selectedDepartment && (
                            <div className="modal-body">
                                <form onSubmit={handleUpdate}>
                                    <input type="hidden" name="id" value={formData.id || ''} />
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">Laboratory Test Name</label>
                                        <div className="col-md-7">
                                            <input name="testname" type="text" className="form-control" value={selectedDepartment.testname} onChange={(e) => handleInputChange(e, 'testname')}
                                                required />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">Price</label>
                                        <div className="col-md-7">
                                            <input name="price" type="text" className="form-control" value={selectedDepartment.price} onChange={(e) => handleInputChange(e, 'price')} required />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <label className="col-md-5 col-lg-4">Department</label>
                                        <div className="col-md-7">
                                            <select className="form-control" name='department' value={selectedDepartment.department} onChange={(e) => handleInputChange(e, 'department')} required>
                                                <option value="">Select a department</option>
                                                <option value="Laboratory Scientist">Laboratory Scientist</option>
                                                <option value="Radiologist">Radiologist</option>
                                                <option value="Special">Special</option>
                                                <option value="Other">Other</option>
                                            </select>
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
            </div >
            {/* END OF MODAL */}
            <div className="modal fade" id="delete" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form>
                            <div className="modal-header">
                                <h5 className="modal-title">Ready to Delete Lab Test?</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            {selectedDepartment && (
                                <div className="modal-body">
                                    Select "Delete" below if you are ready to delete Lab Test:<br /><br /><strong>{selectedDepartment.testname} (₦{selectedDepartment.price})</strong>
                                </div>
                            )}
                            <div className="modal-footer">
                                <button type="button" data-bs-dismiss="modal" onClick={handleConfirmDelete} className="btn btn-danger">Delete Lab Test from Grid</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main >
    );
};

export default AddLabTest;