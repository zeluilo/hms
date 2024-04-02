import React, { useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
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

    if (!lowerCaseSearchTerm.trim()) {
      // If no search term, return all patients
      setFilteredPatients(patients);
      return patients;
    }

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

  useEffect(() => {
    filterPatients(initialPatients, searchTerm);
  }, [searchTerm, initialPatients]);

  const handleSearchChange = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
  };

  return { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm };
};



const ManagePatient = () => {
  const { currentUser } = useAuth();

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm } = usePatientSearch(patients);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/thomas/managepatients');
        setPatients(response.data.patients);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchData();
  }, []);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Edit Patient',
        accessor: 'editButton',
        Cell: ({ row }) => (
          <button className='btn btn-outline-dark btn-md rounded-pill' type="button" data-bs-toggle="modal" data-bs-target="#modalDialogScrollable" onClick={() => handleEdit(row)}>Edit Patient</button>
        ),
      },
      {
        Header: 'Delete Patient',
        accessor: 'printCardButton',
        Cell: ({ row }) => (
          <button className='btn btn-outline-danger btn-md rounded-pill' type="button" data-bs-toggle="modal" data-bs-target="#delete" onClick={() => handleEdit(row)}>Delete Patient</button>
        ),
      },
      {
        Header: 'Book Patient',
        accessor: 'bookPatientButton',
        Cell: () => (
          <Link to='/create-appointments'>
          <button className='btn btn-outline-dark btn-md rounded-pill' type="button" onClick={() => handleBookPatient()}>Book Patient</button>
          </Link>
        ),
      },
      {
        Header: 'Patient Details',
        accessor: 'patientDetailsButton',
        Cell: ({ row }) => (
          <div>
            <h3><strong>{row.original.firstname} {row.original.lastname}</strong></h3>
            <strong>Reg Date: </strong>{row.original.datecreate ? format(new Date(row.original.datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}<br />
            <strong>PID: </strong> {row.original.pId || "-"}<br />
            <strong>Age: </strong> {row.original.age || "-"}<br />
            <strong>Number: </strong> {row.original.number || "-"}<br />
            <strong>Email: </strong> {row.original.email || "-"}<br />
            <strong>Address: </strong> {row.original.address || "-"}<br />
            <strong>Gender: </strong> {row.original.gender || "-"}<br />
            <strong>DOB: </strong> {row.original.dob ? format(new Date(row.original.dob), 'yyyy/MM/dd') : "-"}<br />
            <strong>Next of Kin: </strong> {row.original.nxt_firstname || "-"} {row.original.nxt_lastname || "-"} || {row.original.nxt_number || "-"}<br /><br />
            <strong>Referred By: </strong> {row.original.reference || "-"}<br />
            <strong>Registered By: </strong> {row.original.userId || "-"}
            <div><strong>Date Updated: </strong>{row.original.dateupdate ? format(new Date(row.original.dateupdate), 'yyyy/MM/dd HH:mm:ss') : "-"}</div>
          </div>
        ),
      },
      {
        Header: 'View Medical Records',
        accessor: 'medicalRecordsButton',
        Cell: () => (
          <button className='btn btn-outline-dark btn-md rounded-pill' type="button" onClick={() => handleMedicalRecords()}>View Medical Records</button>
        ),
      },
    ],
    []
  );

  const handleEdit = (row) => {
    // Set the selected patient for editing
    setSelectedPatient(row.original);
    console.log('ROW: ', row.original)
    // Set the formData state
    setFormData({
      ...initialFormData, // Reset other form fields
      pId: row.original.pId,
    });
  };


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      console.error('Selected patient is null. Cannot make the update request.');
      return;
    }

    try {

      const deleteData = {
        reason: formData.reason,
        patientId: formData.pId,
        userId: currentUser?.id,  // Assuming you can get userId from your context
        datecreate: new Date().toISOString().slice(0, 19).replace("T", " ") // Assuming you have patientId in your state
      };
      console.log('Adding Request to Delete:', deleteData);

      const response = await axios.post(
        `http://localhost:3001/thomas/create-delete-request`, deleteData);
      // Handle response accordingly
      if (response.data.message.includes('successfully!')) {
        console.log('Request successful:', response.data);
        setFormData(
          {
            reason: '',
            patientId: '',
            userId: currentUser?.id,  // Assuming you can get userId from your context
            datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
          }
        );
        setShowErrorAlert(true);
        setErrorMessage('Patient sent successfully!');
        window.scrollTo(0, 0);
      } else {
        console.error('Unexpected response:', response.data);
        setErrorMessage('Unexpected response. Please try again.');
        setShowErrorAlert(true);
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('Error sending patient:', error);
      setErrorMessage('Error sending patient. Please try again.');
      setShowErrorAlert(true)
      window.scrollTo(0, 0);
    }
  };

  const handleBookPatient = () => {
    // Handle book patient logic here
    console.log('Book Patient clicked');
  };

  const handleMedicalRecords = () => {
    // Handle view medical records logic here
    console.log('View Medical Records clicked');
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
        `http://localhost:3001/thomas/updatepatient/${selectedPatient.pId}`,
        {
          firstname: selectedPatient.firstname,
          lastname: selectedPatient.lastname,
          email: selectedPatient.email,
          number: selectedPatient.number,
          address: selectedPatient.address,
          dob: selectedPatient.dob,
          age: selectedPatient.age,
          gender: selectedPatient.gender,
          nxt_firstname: selectedPatient.nxt_firstname,
          nxt_lastname: selectedPatient.nxt_lastname,
          nxt_email: selectedPatient.nxt_email,
          nxt_address: selectedPatient.nxt_address,
          nxt_number: selectedPatient.nxt_number,
          reference: selectedPatient.reference,
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
        try {
          const response = await axios.get('http://localhost:3001/thomas/managepatients');
          setPatients(response.data.patients);
        } catch (error) {
          console.error('Error fetching patients:', error);
        }
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
              <h5 className="modal-title">Edit Patient Details</h5>
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
                      <input name="email" type="email" className="form-control" value={selectedPatient.email} onChange={(e) => handleInputChange(e, 'email')} required />
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
                      <textarea name="address" type="text" className="form-control" value={selectedPatient.address} onChange={(e) => handleInputChange(e, 'address')} required></textarea>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Date of Birth</label>
                    <div className="col-md-7">
                      <input name="dob" type="date" className="form-control" max={new Date().toISOString().split('T')[0]} value={formatDate(selectedPatient.dob)} onChange={(e) => handleInputChange(e, 'dob')} required />
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
                  <br />
                  <h5 className="card-title">Emergency Contact</h5>
                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Firstname</label>
                    <div className="col-md-7">
                      <input name="nxt_firstname" type="text" className="form-control" value={selectedPatient.nxt_firstname} onChange={(e) => handleInputChange(e, 'nxt_firstname')} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Lastname</label>
                    <div className="col-md-7">
                      <input name="nxt_lastname" type="text" className="form-control" value={selectedPatient.nxt_lastname} onChange={(e) => handleInputChange(e, 'nxt_lastname')} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Email Address</label>
                    <div className="col-md-7">
                      <input name="nxt_email" type="text" className="form-control" value={selectedPatient.nxt_email} onChange={(e) => handleInputChange(e, 'nxt_email')} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Phone Number</label>
                    <div className="col-md-7">
                      <input name="nxt_number" type="text" className="form-control" value={selectedPatient.nxt_number} onChange={(e) => handleInputChange(e, 'nxt_number')} required />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Home Address</label>
                    <div className="col-md-7">
                      <input name="nxt_address" type="text" className="form-control" value={selectedPatient.nxt_address} onChange={(e) => handleInputChange(e, 'nxt_address')} required />
                    </div>
                  </div><br />

                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Reference</label>
                    <div className="col-md-7">
                      <input name="reference" type="text" className="form-control" value={selectedPatient.reference} onChange={(e) => handleInputChange(e, 'reference')} required />
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
      <div className="modal fade" id="delete" tabIndex="-1">
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Request to Delete Patient</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleDelete}>
                <input type="hidden" name="pId" value={formData.pId || ''} />
                <div className="row mb-3">
                  <label className="col-md-4 col-lg-3 col-form-label">Reason for Request</label>
                  <div className="col-md-8">
                    <textarea name="reason" type="text" className="form-control" placeholder="Enter valid reason to delete patient" value={formData.reason} onChange={handleChange} required></textarea>
                  </div>
                </div>
                <div className="text-center">
                  <button type="submit" data-bs-dismiss="modal" className="btn btn-outline-primary">Send Request</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* END OF MODAL */}

    </main>
  );
};

export default ManagePatient;