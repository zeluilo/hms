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
      const patientPId = typeof patient.pId === 'number' ? String(patient.pId) : patient.pId;

      return (
        patient.firstname.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.lastname.toLowerCase().includes(lowerCaseSearchTerm) ||
        patientPId.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.doctor.toLowerCase().includes(lowerCaseSearchTerm)
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



const ManageAppointment = () => {

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [departments, setDepartments] = useState([]);
  const { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm } = usePatientSearch(patients);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDepartmentPrice, setSelectedDepartmentPrice] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/thomas/get_appointments');
        setPatients(response.data.patients);
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
        const sortedDepartments = response.data.patients.sort((a, b) =>
          a.department.localeCompare(b.department)
        );
        setDepartments(sortedDepartments);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Patient Details',
        accessor: 'patientDetailsButton',
        Cell: ({ row }) => (
          <div>
            <h5><strong>{row.original.firstname} {row.original.lastname}</strong></h5>
            <strong>PID: </strong> {row.original.pId || "-"}<br />
            <strong>Number: </strong> {row.original.number || "-"}<br />
            <strong>Email: </strong> {row.original.email || "-"}<br />
            <strong>Booked on: </strong> {row.original.booking_datecreate ? format(new Date(row.original.booking_datecreate), 'yyyy/MM/dd') : "-"}<br />
          </div>
        ),
      },
      {
        Header: 'Attending Doctor',
        accessor: 'doctorgButton',
        Cell: ({ row }) => (
          <div>
            {row.original.doctor || "-"}<br />
          </div>
        ),
      },
      {
        Header: 'Time to Visit',
        accessor: 'bookingButton',
        Cell: ({ row }) => (
          <div>
            {row.original.timetovisit ? format(new Date(row.original.timetovisit), 'yyyy/MM/dd HH:mm:ss') : "-"}<br />
          </div>
        ),
      },
      {
        Header: 'Visited',
        accessor: 'visitButton',
        Cell: ({ row }) => (
          <div>
            {row.original.visited || "-"}<br />
          </div>
        ),
      },
      {
        Header: 'Action',
        accessor: 'editButton',
        Cell: ({ row }) => (
          <button type="button" className='btn btn-outline-dark btn-md rounded-pill' data-bs-toggle="modal" data-bs-target="#modalDialogScrollable" onClick={() => handleEdit(row)}>View Booking</button>
        ),
      },
    ],
    []
  );

  const getTodayISOString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-based
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };


  const handleEdit = (row) => {
    // Set the selected patient for editing
    setSelectedPatient(row.original);
    // Set the formData state for pId
    setFormData((prev) => ({
      ...prev,
      id: row.original.bookingId,
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

  const handleChange = (e, fieldName) => {
    const { name, value } = e.target;

    // Check if the changed field is the department dropdown
    if (name === 'doctor') {
      // Find the selected department in the departments array
      const selectedDept = departments.find((dept) => dept.department === value);

      if (selectedDept) {
        // Set the selected department and its associated price in state
        setSelectedDepartment(selectedDept.department);
        setSelectedDepartmentPrice(selectedDept.price);

        // Update the selected patient's price, doctor, and doctorgButton
        setSelectedPatient((prev) => ({
          ...prev,
          price: selectedDept.price,
          [fieldName]: value,
          doctorgButton: value, // Update doctorgButton field
        }));
      } else {
        // Reset the selected department and its associated price if not found
        setSelectedDepartment('');
        setSelectedDepartmentPrice(0);

        // Update the selected patient's doctor and doctorgButton
        setSelectedPatient((prev) => ({
          ...prev,
          [fieldName]: value,
          doctorButton: value, // Update doctorgButton field
        }));
      }
    }
  };

  const formatDateForInput = (dateString) => {
    const dateObject = new Date(dateString);
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const day = String(dateObject.getDate()).padStart(2, '0');
    const hours = String(dateObject.getHours()).padStart(2, '0');
    const minutes = String(dateObject.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const initialFormData = {
    id: '',
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
        `http://localhost:3001/thomas/updatebooking/${selectedPatient.bookingId}`,
        {
          reason: selectedPatient.reason,
          price: selectedPatient.price,
          doctor: selectedPatient.doctor,
          timetovisit: selectedPatient.timetovisit,
          patientId: selectedPatient.patientId,
          status: selectedPatient.status
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
        setPatients((prevPatients) => {
          const updatedPatients = prevPatients.map((patient) => {
            if (patient.pId === selectedPatient.pId) {
              // Update the patient data
              return {
                ...patient,
                reason: selectedPatient.reason,
                price: selectedPatient.price,
                doctor: selectedPatient.doctor,
                timetovisit: selectedPatient.timetovisit,
                patientId: selectedPatient.patientId,
                status: selectedPatient.status
              };
            }
            return patient;
          });

          return updatedPatients;
        });
        setShowErrorAlert(true);
        setErrorMessage('Booking updated successfully!');
        window.scrollTo(0, 0);
      } else {
        console.error('Unexpected response:', response.data);
        setErrorMessage('Unexpected response. Please try again.');
        setShowErrorAlert(true);
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      setErrorMessage('Error updating booking. Please try again.');
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
              <h5 className="modal-title">Booking Details</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            {selectedPatient && (
              <div className="modal-body">
                <h5><strong>{selectedPatient.firstname} {selectedPatient.lastname}</strong> ||<strong> PID: </strong>{selectedPatient.patientId}</h5><br />
                <p><strong>Summary of Visit:</strong><br /> <span>{selectedPatient.reason}</span></p>
                <p><strong>Price:</strong><br /> <span>₦{selectedPatient.price}</span></p>
                <p><strong>Attending Doctor:</strong><br /> <span>{selectedPatient.doctor}</span></p>
                <p><strong>Time to Visit:</strong><br /> <span>{new Date(selectedPatient.timetovisit).toLocaleString('en-Uk', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}</span></p>
                <p><strong>Status:</strong><br /> <span>{selectedPatient.status}</span></p>
                <p><strong>Visited:</strong><br /> <span>{selectedPatient.visited}</span></p>
                <p><strong>Booked on:</strong><br /> <span>{selectedPatient.booking_datecreate ? format(new Date(selectedPatient.booking_datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}</span></p>
                <p><strong>Booked by:</strong><br /> <span>{selectedPatient.booking_datecreate ? format(new Date(selectedPatient.booking_datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}</span></p><br />
                <br />
                <h5 className="modal-title"><strong>Edit Booking Details</strong></h5><br />
                <form onSubmit={handleSubmit}>
                  <input type="hidden" name="id" value={formData.id} />
                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Summary of Visit</label>
                    <div className="col-md-7">
                      <textarea name="reason" type="text" className="form-control" value={selectedPatient.reason} onChange={(e) => handleInputChange(e, 'reason')}
                        required></textarea>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Price</label>
                    <div className="col-md-7">
                      <input name="price" type="text" className="form-control" value={selectedPatient.price} readOnly />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Attending Medical Doctor</label>
                    <div className="col-md-7">
                      <select className="form-control" name="doctor" value={selectedPatient.doctor} onChange={(e) => handleChange(e, 'doctor')} required>
                        <option value="">Select a Department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.department}>
                            {department.department}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-5 col-lg-4">Time To Visit</label>
                    <div className="col-md-7">
                      <input name="timetovisit" type="datetime-local" className="form-control" min={getTodayISOString()} value={formatDateForInput(selectedPatient.timetovisit)} onChange={(e) => handleInputChange(e, 'timetovisit')} required />
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

    </main>
  );
};

export default ManageAppointment;