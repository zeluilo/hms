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

const CreateAppointment = () => {

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm } = usePatientSearch(patients);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDepartmentPrice, setSelectedDepartmentPrice] = useState(0);

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
        Header: 'Patient Details',
        accessor: 'patientDetailsButton',
        Cell: ({ row }) => (
          <div>
            <h3><strong>{row.original.firstname} {row.original.lastname}</strong></h3>
            <strong>Reg Date: </strong>{row.original.datecreate ? format(new Date(row.original.datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}<br />
            <strong>pId: </strong> {row.original.pId || "-"}<br />
            <strong>Age: </strong> {row.original.age || "-"}<br />
            <strong>Number: </strong> {row.original.number || "-"}<br />
            <strong>Email: </strong> {row.original.email || "-"}<br />
            <strong>Address: </strong> {row.original.address || "-"}<br />
            <strong>Gender: </strong> {row.original.gender || "-"}
          </div>

        ),
      },
      {
        Header: 'Book Appointment',
        accessor: 'appointmentButton',
        Cell: ({ row }) => (
          <button className='btn btn-outline-dark btn-md rounded-pill' type="button" data-bs-toggle="modal" data-bs-target="#modalDialogScrollable" onClick={() => handleAdd(row)}>Book an Appointment</button>

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

  const getTodayISOString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-based
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    // Check if the changed field is the department dropdown
    if (name === 'doctor') {
      // Find the selected department in the departments array
      const selectedDept = departments.find((dept) => dept.department === value);
  
      if (selectedDept) {
        // Set the selected department and its associated price in state
        console.log('Selected Department:', selectedDept.department);
        console.log('Price:', selectedDept.price);
        
        setSelectedDepartment(selectedDept.department);
        setSelectedDepartmentPrice(selectedDept.price);
  
        // Update the form data with the selected department's price
        setFormData((prev) => ({
          ...prev,
          price: selectedDept.price.toString(), // Convert the price to a string if needed
          [name]: value,
        }));
      } else {
        // Reset the selected department and its associated price if not found
        setSelectedDepartment('');
        setSelectedDepartmentPrice(0);
  
        // Update the form data with the default price (0) and the selected doctor
        setFormData((prev) => ({
          ...prev,
          price: selectedDept.price.toString(), // Set to default price
          [name]: value,
        }));
      }
    } else if (name === 'emergency') {
      // Handle special case for "Emergency Registration"
      if (value === 'Yes') {
        // Set the price to 20000 for Emergency Registration
        setFormData((prev) => ({
          ...prev,
          price: '20000',
          [name]: value,
        }));
      } else if (formData.price === '0') {
        // Set the type of visit to 0 if the price is 0
        setFormData((prev) => ({
          ...prev,
          price: '0',
          [name]: value,
        }));
      } else {
        // For other types of visit, use the selected department's price
        setFormData((prev) => ({
          ...prev,
          price: selectedDepartmentPrice.toString(),
          [name]: value,
        }));
      }
    } else {
      // For other form fields, update the form data normally
      setFormData({ ...formData, [name]: value });
    }
  };

  const initialFormData = {
    reason: '',
    price: '',
    doctor: '',
    patientId: '',
    timetovisit: '',
    emergency:'',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Check if a patient with the same email or number already exists
      const response = await axios.post('http://localhost:3001/thomas/addappointment', formData, {
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
        setErrorMessage('Appointment booked successfully!');
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
      console.error('Error booking appointment:', error);
      // Handle the error, e.g., display an error message to the user
      setErrorMessage('Error booking appointment. Please try again.');
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
        <h1>Book an Appointment</h1>
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
                  <div className="col-lg-5">
                    <div className="datatable-search">
                      <input
                        className="form-control"
                        placeholder="Enter a PID, Name of Patient here to search..."
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
              <h5 className="modal-title">Book an Appointment</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            {selectedPatient && (
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <input type="hidden" name="patientId" value={formData.patientId || ''} />
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-3 col-form-label">Summary of Vist</label>
                    <div className="col-md-8">
                      <textarea name="reason" type="text" className="form-control" placeholder="Enter summary of visit" value={formData.reason} onChange={handleChange} required></textarea>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-3 col-form-label">Price</label>
                    <div className="col-md-8">
                      <input name="price" type="text" className="form-control" placeholder="₦0.0" value={formData.price} readOnly />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-3 col-form-label">Attending Medical Doctor</label>
                    <div className="col-md-8">
                    <select className="form-control" name='doctor' value={formData.doctor} onChange={(e) => handleChange(e, 'doctor')} required>
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
                    <label className="col-md-4 col-lg-3 col-form-label">Is it an Emergency</label>
                    <div className="col-md-8">
                      <select className="form-control" name='emergency' value={formData.emergency} onChange={handleChange} required>
                        <option value="">-Select-</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <label className="col-md-4 col-lg-3 col-form-label">Time To Visit</label>
                    <div className="col-md-8">
                      <input name="timetovisit" type="datetime-local" className="form-control" min={getTodayISOString()} placeholder="Enter time of Visit" value={formData.timetovisit} onChange={handleChange} required />
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

export default CreateAppointment;