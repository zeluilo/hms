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

const BioData = () => {

    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm } = usePatientSearch(patients);
    const [hasBioData, setHasBioData] = useState(false);
    const [medicalData, setMedicalData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/medical_records');
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
                        <strong>Reg Date: </strong>{row.original.patient_datecreate ? format(new Date(row.original.patient_datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}<br />
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
                Header: 'Medical Data Details',
                accessor: 'biodataDetailsButton',
                Cell: ({ row }) => (
                    <div>
                        <strong>Height: </strong> {row.original.height || "-"}<br />
                        <strong>Weight: </strong> {row.original.weight || "-"}<br />
                        <strong>Blood Group: </strong> {row.original.bloodgroup}{row.original.rhesus} <br />
                        <strong>Hypertensive: </strong> {row.original.hypertensive || "-"}<br />
                        <strong>Genotype: </strong> {row.original.genotype || "-"}<br />
                        <strong>Diabetic: </strong> {row.original.diabetic || "-"}<br />
                        <strong>Drug Reaction: </strong> {row.original.reaction || "-"}<br />
                        <strong>Other Health Information: </strong> {row.original.other_info || "-"}
                        <div><strong>Date Added: </strong>{row.original.biodata_datecreate ? format(new Date(row.original.biodata_datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}</div>
                    </div>

                ),
            },
            {
                Header: 'Add Medical Data',
                accessor: 'familyButton',
                Cell: ({ row }) => (
                    <button
                        className='btn btn-outline-dark btn-md rounded-pill'
                        type="button"
                        data-bs-toggle="modal"
                        data-bs-target="#modalDialogScrollable"
                        onClick={() => handleAdd(row)}
                    >
                        Add/Edit Medical Data
                    </button>
                ),
            },
        ],
        []
    );

    const handleAdd = async (row) => {
        setSelectedPatient(row.original);
        setFormData((prev) => ({
            ...prev,
            patientId: row.original.pId,
        }));

        try {
            // Make an API call to fetch medical data for the selected patient
            const response = await axios.get(`http://localhost:3001/thomas/getbiodata/${row.original.pId}`);
            setMedicalData(response.data.medicalData);
            setHasBioData(response.data.hasMedicalData || false);
        } catch (error) {
            console.error('Error fetching medical data:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleInputChange = (e, fieldName) => {
        setMedicalData((prevData) => ({
            ...prevData,
            [fieldName]: e.target.value,
        }));
    };

    const initialFormData = {
        height: '',
        weight: '',
        bloodgroup: '',
        rhesus: '',
        genotype: '',
        hypertensive: '',
        diabetic: '',
        reaction: '',
        other_info: '',
        patientId: '',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Check if a patient with the same email or number already exists
            const response = await axios.post('http://localhost:3001/thomas/addbiodata', formData, {
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
                console.log('Registration successful:', response.data);
                setFormData(initialFormData);

                // Fetch updated medical data for the selected patient
                const updatedResponse = await axios.get(`http://localhost:3001/thomas/updatebiodata/${formData.patientId}`);
                setMedicalData(updatedResponse.data.medicalData);

                setShowErrorAlert(true);
                setErrorMessage('Medical Data added successfully!');
                window.scroll(0, 0);
                window.location.reload();
            } else {
                // Handle other cases where the response is not as expected
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scroll(0, 0);
            }
        } catch (error) {
            console.error('Error registering BioData:', error);
            // Handle the error, e.g., display an error message to the user
            setErrorMessage('Error registering BioData. Please try again.');
            setShowErrorAlert(true);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        try {
            if (!selectedPatient || selectedPatient.id === null || medicalData.id === null) {
                console.error('Selected patient, id, or medical data id is null. Cannot make the update request.');
                return;
            }

            console.log('Updating medical data with ID:', medicalData.id);
            const response = await axios.put(
                `http://localhost:3001/thomas/updatebiodata/${medicalData.id}`,
                {
                    height: medicalData.height,
                    weight: medicalData.weight,
                    bloodgroup: medicalData.bloodgroup,
                    rhesus: medicalData.rhesus,
                    genotype: medicalData.genotype,
                    hypertensive: medicalData.hypertensive,
                    diabetic: medicalData.diabetic,
                    reaction: medicalData.reaction,
                    other_info: medicalData.other_info,
                    patientId: medicalData.patientId,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Handle response accordingly
            if (response.data.message.includes('updated successfully!')) {
                console.log('Update successful:', response.data);

                // Fetch updated medical data for the selected patient
                const updatedResponse = await axios.get(`http://localhost:3001/thomas/getbiodata/${selectedPatient.pId}`);
                const updatedMedicalData = updatedResponse.data.medicalData;

                // Update the local state to reflect the changes
                setMedicalData(updatedMedicalData);

                setPatients((prevPatients) => {
                    return prevPatients.map((patient) => {
                        if (patient.pId === selectedPatient.patientId) {
                            // Update the patient data
                            return {
                                ...patient,
                                height: selectedPatient.height,
                                weight: selectedPatient.weight,
                                bloodgroup: selectedPatient.bloodgroup,
                                hypertensive: selectedPatient.hypertensive,
                                patientId: selectedPatient.patientId,
                                diabetic: selectedPatient.diabetic,
                                rhesus: selectedPatient.rhesus,
                                other_info: selectedPatient.other_info,
                                reaction: selectedPatient.reaction,
                            };
                        }
                        return patient;
                    });
                });

                setShowErrorAlert(true);
                setErrorMessage('Medical data updated successfully!');
                window.scrollTo(0, 0);
                window.location.reload();
            } else {
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error updating medical data:', error);
            setErrorMessage('Error updating medical data. Please try again.');
            setShowErrorAlert(true);
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
                <h1>Patient Medical Data</h1>
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
                            <h5 className="modal-title">Medical Biological Data</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {selectedPatient && (
                            <div className="modal-body">
                                {hasBioData ? (
                                    // Display existing medical data
                                    <div>
                                        <h4>Edit Medical Data</h4>
                                        {medicalData && (
                                            // Display form to add medical data
                                            <form onSubmit={handleUpdate}>
                                                <input type="hidden" name="id" value={formData.id || ''} />
                                                <div className="row mb-3">
                                                    <label className="col-md-4 col-lg-3 col-form-label">Height</label>
                                                    <div className="col-md-8">
                                                        <input name="height" type="text" className="form-control" placeholder="Enter height(feet)" pattern="[0-9]+(\.[0-9]+)?" value={medicalData.height} onChange={(e) => handleInputChange(e, 'height')} required />
                                                    </div>
                                                </div>
                                                <div className="row mb-3">
                                                    <label className="col-md-4 col-lg-3 col-form-label">Weight</label>
                                                    <div className="col-md-8">
                                                        <input name="weight" type="number" className="form-control" placeholder="Enter weight(Kg)" value={medicalData.weight} onChange={(e) => handleInputChange(e, 'weight')} required />
                                                    </div>
                                                </div>
                                                <div className="row mb-3">
                                                    <label className="col-md-4 col-lg-3 col-form-label">Blood Group</label>
                                                    <div className="col-md-8">
                                                        <select className="form-control" name='bloodgroup' value={medicalData.bloodgroup} onChange={(e) => handleInputChange(e, 'bloodgroup')} id="exampleFormControlSelect1" required>
                                                            <option value="">Select Blood Group</option>
                                                            <option value="A">A</option>
                                                            <option value="B">B</option>
                                                            <option value="AB">AB</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="row mb-3">
                                                    <label className="col-md-4 col-lg-3 col-form-label">Rhesus(RH)</label>
                                                    <div className="col-md-8">
                                                        <select className="form-control" name='rhesus' value={medicalData.rhesus} onChange={(e) => handleInputChange(e, 'rhesus')} id="exampleFormControlSelect1">
                                                            <option value="">Select Rhesus</option>
                                                            <option value="+">+</option>
                                                            <option value="-">-</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="row mb-3">
                                                    <label className="col-md-4 col-lg-3 col-form-label">Genotype</label>
                                                    <div className="col-md-8">
                                                        <select className="form-control" name='genotype' value={medicalData.genotype} onChange={(e) => handleInputChange(e, 'genotype')} id="exampleFormControlSelect1" required>
                                                            <option value="">Select Genotype</option>
                                                            <option value="AA">AA</option>
                                                            <option value="AS">AS</option>
                                                            <option value="SS">SS</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="row mb-3">
                                                    <label className="col-md-4 col-lg-3 col-form-label">Hypertensive</label>
                                                    <div className="col-md-8">
                                                        <select className="form-control" name='hypertensive' value={medicalData.hypertensive} onChange={(e) => handleInputChange(e, 'hypertensive')} id="exampleFormControlSelect1" required>
                                                            <option value="">Are you Hypertensive?</option>
                                                            <option value="Yes">Yes</option>
                                                            <option value="No">No</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="row mb-3">
                                                    <label className="col-md-4 col-lg-3 col-form-label">Diabetic</label>
                                                    <div className="col-md-8">
                                                        <select className="form-control" name='diabetic' value={medicalData.diabetic} onChange={(e) => handleInputChange(e, 'diabetic')} id="exampleFormControlSelect1" >
                                                            <option value="">Are you Diabetic?</option>
                                                            <option value="Yes">Yes</option>
                                                            <option value="No">No</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="row mb-3">
                                                    <label className="col-md-4 col-lg-3 col-form-label">Drug Reaction</label>
                                                    <div className="col-md-8">
                                                        <textarea name="reaction" type="text" className="form-control" placeholder="Enter drug reaction comments" value={medicalData.reaction} onChange={(e) => handleInputChange(e, 'reaction')}></textarea>
                                                    </div>
                                                </div>
                                                <div className="row mb-3">
                                                    <label className="col-md-4 col-lg-3 col-form-label">Other Health Information</label>
                                                    <div className="col-md-8">
                                                        <textarea name="other_info" type="text" className="form-control" placeholder="Enter any other health information" value={medicalData.other_info} onChange={(e) => handleInputChange(e, 'other_info')}></textarea>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <button type="submit" data-bs-dismiss="modal" className="btn btn-primary">Save Changes</button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                ) : (
                                    // Display form to add medical data
                                    <div>
                                        <h4>Add Medical Data</h4>
                                        <form onSubmit={handleSubmit}>
                                            <input type="hidden" name="patientId" value={formData.patientId || ''} />
                                            <div className="row mb-3">
                                                <label className="col-md-4 col-lg-3 col-form-label">Height</label>
                                                <div className="col-md-8">
                                                    <input name="height" type="text" className="form-control" placeholder="Enter height(feet)" pattern="[0-9]+(\.[0-9]+)?" value={formData.height} onChange={handleChange} required />
                                                </div>
                                            </div>
                                            <div className="row mb-3">
                                                <label className="col-md-4 col-lg-3 col-form-label">Weight</label>
                                                <div className="col-md-8">
                                                    <input name="weight" type="number" className="form-control" placeholder="Enter weight(Kg)" value={formData.weight} onChange={handleChange} required />
                                                </div>
                                            </div>
                                            <div className="row mb-3">
                                                <label className="col-md-4 col-lg-3 col-form-label">Blood Group</label>
                                                <div className="col-md-8">
                                                    <select className="form-control" name='bloodgroup' value={formData.bloodgroup} onChange={handleChange} id="exampleFormControlSelect1" required>
                                                        <option value="">Select Blood Group</option>
                                                        <option value="A">A</option>
                                                        <option value="B">B</option>
                                                        <option value="AB">AB</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row mb-3">
                                                <label className="col-md-4 col-lg-3 col-form-label">Rhesus(RH)</label>
                                                <div className="col-md-8">
                                                    <select className="form-control" name='rhesus' value={formData.rhesus} onChange={handleChange} id="exampleFormControlSelect1">
                                                        <option value="">Select Rhesus</option>
                                                        <option value="+">+</option>
                                                        <option value="-">-</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row mb-3">
                                                <label className="col-md-4 col-lg-3 col-form-label">Genotype</label>
                                                <div className="col-md-8">
                                                    <select className="form-control" name='genotype' value={formData.genotype} onChange={handleChange} id="exampleFormControlSelect1" required>
                                                        <option value="">Select Genotype</option>
                                                        <option value="AA">AA</option>
                                                        <option value="AS">AS</option>
                                                        <option value="SS">SS</option>
                                                        <option value="Others">Others</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row mb-3">
                                                <label className="col-md-4 col-lg-3 col-form-label">Hypertensive</label>
                                                <div className="col-md-8">
                                                    <select className="form-control" name='hypertensive' value={formData.hypertensive} onChange={handleChange} id="exampleFormControlSelect1" required>
                                                        <option value="">Are you Hypertensive?</option>
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row mb-3">
                                                <label className="col-md-4 col-lg-3 col-form-label">Diabetic</label>
                                                <div className="col-md-8">
                                                    <select className="form-control" name='diabetic' value={formData.diabetic} onChange={handleChange} id="exampleFormControlSelect1" >
                                                        <option value="">Are you Diabetic?</option>
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="row mb-3">
                                                <label className="col-md-4 col-lg-3 col-form-label">Drug Reaction</label>
                                                <div className="col-md-8">
                                                    <textarea name="reaction" type="text" className="form-control" placeholder="Enter drug reaction comments" value={formData.reaction} onChange={handleChange}></textarea>
                                                </div>
                                            </div>
                                            <div className="row mb-3">
                                                <label className="col-md-4 col-lg-3 col-form-label">Other Health Information</label>
                                                <div className="col-md-8">
                                                    <textarea name="other_info" type="text" className="form-control" placeholder="Enter any other health information" value={formData.other_info} onChange={handleChange}></textarea>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <button type="submit" data-bs-dismiss="modal" className="btn btn-primary">Save Changes</button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
            {/* END OF MODAL */}
        </main>
    );
};
export default BioData;