import React, { useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { useNavigate } from "react-router-dom";
import { useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Modal from 'react-modal';
import { useAuth, refreshToken } from '../../components/containers/Context'; // Update the path accordingly

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

const DoctorsQueue = () => {
  const { currentUser, authData } = useAuth();
  const navigate = useNavigate();
  const userDepartment = currentUser?.department;

  useEffect(() => {
    console.log('User Department:', userDepartment);
  }, [userDepartment]);

  console.log('Local Storage :', currentUser);

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm } = usePatientSearch(patients);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch appointments based on the user's department
        const response = await axios.get(`http://localhost:3001/thomas/get_doctors_queue/${userDepartment}`);
        setPatients(response.data.appointments);
        console.log('appointments:', response.data.appointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchData();
  }, [userDepartment]);


  const columns = React.useMemo(
    () => [
      {
        Header: '#',
        accessor: 'patientNumber', // Use the same name as assigned in the server response
      },
      {
        Header: 'Patient Details',
        accessor: 'patientDetailsButton',
        Cell: ({ row }) => (
          <div>
            <h3><strong>{row.original.firstname} {row.original.lastname}</strong></h3>
            <strong>PID: </strong> {row.original.pId || "-"}<br />
            <strong>Number: </strong> {row.original.number || "-"}<br />
            <strong>Email: </strong> {row.original.email || "-"}<br />
            <div><strong>Booking Made on : </strong>{new Date(row.original.booking_datecreate).toLocaleString('en-Uk', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}
            </div>
            <br /><strong>Registered By: </strong> {row.original.userId || "-"}
          </div>

        ),
      },
      {
        Header: 'Action',
        accessor: 'medicalRecordsButton',
        Cell: ({ row }) => (
          <button
            type="button"
            className='btn btn-outline-dark btn-md rounded-pill'
            data-bs-toggle="modal"
            data-bs-target="#visited"
            onClick={() => handleVisited(row)}
          >
            Patient was Visited
          </button>
        ),
      },
    ],
    []
  );

  const handleVisited = (row) => {
    // Set the selected patient for editing
    setSelectedPatient(row.original);
  };

  const handleConfirmVisit = async (event) => {
    event.preventDefault();
    try {

      // Check if the token is expired
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      if (tokenExpiration && Date.now() > parseInt(tokenExpiration)) {
        console.log('Token expired. Refreshing token...');
        await refreshToken(); // Refresh token if expired
      }

      const updateStatusResponse = await axios.put(`http://localhost:3001/thomas/updateVisitation/${selectedPatient.uId}`, {
        visited: 'Has Visited'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData?.token}` // Pass only the token here
        }
      });

      if (updateStatusResponse.data.message.includes('updated successfully')) {
        setPatients(prevPatients =>
          prevPatients.filter(patient => patient.uId !== selectedPatient.uId)
        );
        setShowErrorAlert(true);
        setErrorMessage(updateStatusResponse.data.message);
      } else {
        setShowErrorAlert(true);
      }
    } catch (error) {
      console.error('Error confirming visit:', error);
    }
  };

  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);

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
                <h5 className="card-title">Awaiting Patients</h5>

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
      </section>

      <div className="modal fade" id="visited" tabIndex="-1">
        <div className="modal-dialog">
          {selectedPatient && (
            <div className="modal-content">
              <form onSubmit={handleConfirmVisit}>
                <input type="hidden" name="bookingId" value={selectedPatient.bookingId} />
                <div className="modal-header">
                  <h5 className="modal-title">Ready to Confirm Visitation?</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  Select "Visted" below if you are ready to confrim visit for <br /><br /><strong>{selectedPatient.firstname} {selectedPatient.lastname}, PID:{selectedPatient.pId}</strong>
                </div>
                <div className="modal-footer">
                  <button type="submit" data-bs-dismiss="modal" className="btn btn-danger">Visited</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

    </main>
  );
};

export default DoctorsQueue;