import React, { useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Modal from 'react-modal';
import Select from 'react-select';
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

const ViewRecords = () => {

    const { currentUser, authData } = useAuth();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const { searchTerm, filterPatients, handleSearchChange, filteredPatients, setSearchTerm } = usePatientSearch(patients);
    const [consultations, setConsultations] = useState([]);
    const [options, setOptions] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null); // State to store details of the selected record

    const userDepartment = currentUser?.department;

    useEffect(() => {
        console.log('User Department:', userDepartment);
    }, [userDepartment]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/thomas/get_doctors_queue/${userDepartment}`);
                const response2 = await axios.get(`http://localhost:3001/thomas/managepatients`);

                setPatients(response2.data.patients);

                console.log('Patients:', response2.data.patients);

                // Create options for react-select
                const patientOptions = response2.data.patients.map(patient => ({
                    value: patient.pId,
                    label: `${patient.firstname} ${patient.lastname} (PID: ${patient.pId})`,
                    firstname: patient.firstname,
                    lastname: patient.lastname,
                    email: patient.email,
                    age: patient.age,
                    number: patient.number,
                    address: patient.address,
                    gender: patient.gender,
                    dob: patient.dob,
                }));


                setOptions(patientOptions);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };

        fetchData();
    }, [userDepartment]);

    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                if (selectedPatient) {
                    const patientId = selectedPatient.value;
                    const consultationResponse = await axios.get(`http://localhost:3001/thomas/get-consultations/${patientId}`);

                    setConsultations(consultationResponse.data.consultations);

                    console.log('Medical Data:', consultationResponse.data.consultations);
                }
            } catch (error) {
                console.error('Error fetching patient details:', error);
            }
        };


        fetchPatientDetails();
    }, [patients, selectedPatient]);

    // Function to fetch details of the selected record
    const fetchRecordDetails = async (id) => {
        try {
            console.log('Selected Record ID:', id);
            const response = await axios.get(`http://localhost:3001/thomas/get-selected-consultations/${id}`);
            setSelectedRecord(response.data.consultations);
            console.log('Selected Record:', response.data.consultations);
        } catch (error) {
            console.error('Error fetching record details:', error);
        }
    };

    const handleSelectChange = (selectedOption) => {
        setSelectedPatient(selectedOption);

        // Set the patientId in the formData
        setFormData({ ...formData, patientId: selectedOption ? selectedOption.value : '' });

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

    const formatDate = (dateString) => {
        // Check if dateString is not empty and is a valid date
        if (dateString && !isNaN(new Date(dateString))) {
            const dateObject = new Date(dateString);
            const formattedDate = dateObject.toISOString().split('T')[0];
            return formattedDate;
        } else {
            // If dateString is empty or not a valid date, return a default value or handle it as needed
            return "Invalid Date";
        }
    };


    const formatDateForInput = (dateString) => {
        const dateObject = new Date(dateString);
        const options = {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };
        return new Intl.DateTimeFormat('en-US', options).format(dateObject);
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
                `http://localhost:3001/thomas/updatepatient/${selectedPatient.value}`,
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
                window.location.reload(6000);
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

    const handleEdit = (patients) => {
        console.log('Editing patient:', patients);
        if (patients) {

            // Set the formData state for pId
            setFormData((prev) => ({
                ...prev,
                pId: patients.value,
            }));
        }
    };


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

            <div className="col-12">
                <div className='row'>
                    <div className="col-5">
                        <Select
                            value={selectedPatient}
                            onChange={handleSelectChange}
                            options={options}
                            placeholder="Search by PID or Patient Name..."
                            isClearable
                        />
                    </div>
                    <div className="col-3">
                        <button type="button" data-bs-toggle="modal" data-bs-target="#modalDialogScrollable"
                            onClick={() => handleEdit(selectedPatient)} style={{ display: selectedPatient ? 'inline-block' : 'none' }}>
                            Edit Patient</button>
                    </div>
                </div>
            </div><br />
            {showErrorAlert && (
                <div className={`form-control alert ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`} role="alert">
                    {errorMessage}
                </div>
            )}

            <section className="section">
                <>
                    {selectedPatient && consultations.length > 0 ? (
                        <div className="row">
                            <div className="col-lg-6">
                                <div className="patient-details">
                                    <h4>Patient Details</h4>
                                    <h5><strong>{selectedPatient.firstname} {selectedPatient.lastname}</strong></h5>
                                    <strong>PID: </strong>{selectedPatient.value || "-"}<br />
                                    <strong>Age: </strong>{selectedPatient.age || "-"}<br />
                                    <strong>Number: </strong>{selectedPatient.number || "-"}<br />
                                    <strong>Email: </strong>{selectedPatient.email || "-"}<br />
                                    <strong>Address: </strong>{selectedPatient.address || "-"}<br />
                                    <strong>Gender: </strong>{selectedPatient.gender || "-"}<br />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </><br />
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Patient Table</h5>
                                {selectedPatient && consultations.length > 0 ? (
                                    <>
                                        <h3>Medical Records</h3>
                                        <table className="table table-bordered table-hover">
                                            {/* Table header */}
                                            <thead className='table table-primary'>
                                                <tr>
                                                    <th>Date</th>
                                                    {/* Vital Signs */}
                                                    <th>BP</th>
                                                    <th>°C</th>
                                                    <th>Height</th>
                                                    <th>Weight</th>
                                                    {/* Medical History */}
                                                    <th>Complaints</th>
                                                    <th>Physical Examination</th>
                                                    {/* Diagnosis */}
                                                    <th>Diagnosis</th>
                                                    <th>Action</th>

                                                </tr>
                                            </thead>
                                            {/* Table body */}
                                            <tbody>
                                                {consultations.map((records, index) => {
                                                    console.log('Records: ', records.id); // Move the console.log here
                                                    return (
                                                        <tr key={index}>
                                                            <td>{format(records.datecreate, 'MM/dd/yyyy HH:mm') || "-"}</td>
                                                            <td>{records.bp || "-"}</td>
                                                            <td>{records.temperature || "-"}</td>
                                                            <td>{records.height || "-"}</td>
                                                            <td>{records.weight || "-"}</td>
                                                            <td>{records.complaints || "-"}</td>
                                                            <td>{records.physical_examine || "-"}</td>
                                                            <td>{records.diagnosis || "-"}</td>
                                                            <td><button type="button" 
                                                            className='btn btn-outline-dark btn-md rounded-pill'
                                                            data-bs-toggle="modal" data-bs-target="#record" onClick={() => fetchRecordDetails(records.id)}>View All</button></td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>

                                        </table>
                                    </>
                                ) : (
                                    <strong>{!selectedPatient ? "Please select a patient" : "No medical records found for this patient."}</strong>
                                )}
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

            {/* EDIT PATIENT MODAL */}
            <div className="modal fade" id="record" tabIndex="-1">
                <div class="modal-dialog modal-xl">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title"><strong>Full Medical Records</strong></h3>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {selectedRecord && (
                            <div className="modal-body">
                                <div className="row">
                                    <h5><strong>Consulted on: </strong>{formatDateForInput(selectedRecord[0].consultation_datecreate)}</h5><br /><br />
                                    <div className="col-lg-4">
                                        <div className="patient-details">
                                            <h4>Vital Signs</h4>
                                            <strong>BP: </strong>{selectedRecord[0].bp || "-"}<br />
                                            <strong>Temperature: </strong>{selectedRecord[0].temperature || "-"}<br />
                                            <strong>Pulse: </strong>{selectedRecord[0].pulse || "-"}<br />
                                            <strong>Respiration: </strong>{selectedRecord[0].respiration || "-"}<br />
                                            <strong>SPO2: </strong>{selectedRecord[0].spo2 || "-"}<br />
                                            <strong>BMI: </strong>{selectedRecord[0].bmi || "-"}<br />
                                            <strong>Height: </strong>{selectedRecord[0].height || "-"}ft<br />
                                            <strong>Weight: </strong>{selectedRecord[0].weight || "-"}kg<br />
                                        </div>
                                    </div>

                                    <div className="col-lg-4">
                                        <h4>Medical History</h4>
                                        <strong>Complaints: </strong> {selectedRecord[0].complaints || "-"}<br />
                                        <strong>Past Medical Record: </strong> {selectedRecord[0].pmr || "-"}<br />
                                        <strong>Drug History: </strong> {selectedRecord[0].drughistory || "-"}<br />
                                        <strong>Social History: </strong> {selectedRecord[0].socialhistory || "-"}<br />
                                        <strong>Family History: </strong> {selectedRecord[0].familyhistory || "-"}<br />
                                        <strong>Physical Examination: </strong> {selectedRecord[0].physical_examine || "-"}
                                    </div>
                                    <div className="col-lg-4">
                                        <div className="patient-details">
                                            <h4>Diagnosis</h4>
                                            <strong>Diagnosis: </strong> {selectedRecord[0].diagnosis || "-"}<br />
                                            <strong>Comments: </strong> {selectedRecord[0].comments || "-"}<br />
                                        </div>
                                    </div>
                                </div><br />
                                <div className="patient-details">
                                    <h5>Prescription: </h5>

                                    {selectedRecord.map((record, index) => (
                                            record.prescriptionId ? (
                                                <>
                                                    <strong>{record.drugname} </strong> taken at <strong>{record.dosage}</strong><br />
                                                </>
                                            ) : (
                                                <p style={{ color: 'red', fontWeight: 'bold' }}>Hasn't been prescribed a medication yet :(</p>
                                            )
                                    ))}

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* END OF MODAL */}

        </main>
    );
};

export default ViewRecords;