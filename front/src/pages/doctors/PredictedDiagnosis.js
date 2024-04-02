import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useAuth } from '../../components/containers/Context';
import { formatDate } from 'date-fns';

const PrescribeMeds = () => {
    const { currentUser } = useAuth();
    const userDepartment = currentUser?.department;

    useEffect(() => {
        console.log('User Department:', userDepartment);
    }, [userDepartment]);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [dataAddedToGrid, setDataAddedToGrid] = useState(false);
    const [addConsultationToGrid, setAddConsultationToGrid] = useState(false);
    const [consultations, setConsultations] = useState([]);
    const [options, setOptions] = useState([]);
    const [selectedConsultation, setSelectedConsultation] = useState(null);
    const [selectedInvestigation, setSelectedInvestigation] = useState(null);

    const [formData, setFormData] = useState({
        predicted_diagnosis: '',
        notes: '',
        userId: currentUser?.id,
        patientId: selectedPatient?.value,
    });

    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [biodata, setbiodata] = useState([]);
    const [patientDetails, setPatientDetails] = useState(null);

    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                if (selectedPatient) {
                    const patientId = selectedPatient.value;
                    const patientDetailsResponse = await axios.get(`http://localhost:3001/thomas/patient-details/${patientId}`);
                    const biodataResponse = await axios.get(`http://localhost:3001/thomas/get-biodata/${patientId}`);
                    const consultationResponse = await axios.get(`http://localhost:3001/thomas/get-consultation-investigation/${patientId}`);
                    const consultationData = consultationResponse.data.consultations || [];

                    setPatientDetails(patientDetailsResponse.data.patientDetails);
                    setbiodata(biodataResponse.data.biodata);

                    // No need to process grouped consultations here, as it's already done in the backend
                    setConsultations(consultationData);

                    console.log('Patient details:', patientDetailsResponse.data.patientDetails);
                    console.log('Biological Data:', biodataResponse.data.biodata);
                    console.log('Consultations Data:', consultationData);
                }
            } catch (error) {
                console.error('Error fetching patient details:', error);
            }
        };

        fetchPatientDetails();
    }, [selectedPatient]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/managepatients');

                // Create options for react-select
                const patientOptions = response.data.patients.map(patient => ({
                    value: patient.pId,
                    label: `${patient.firstname} ${patient.lastname} (PID: ${patient.pId})`,
                }));

                setOptions(patientOptions);

                if (options === null) {
                    setSelectedPatient(null);
                    setSelectedConsultation(null);

                }
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };

        fetchData();
    }, [options]);

    const handleConsultationClick = (consultation) => {
        // Handle what happens when a consultation button is clicked
        setAddConsultationToGrid(true);
        setSelectedConsultation(consultation);
        console.log('Consultation :', consultation);
    };

    const handleRecordClick = (investigation) => {
        // Handle what happens when a investigation button is clicked
        setDataAddedToGrid(true);
        setSelectedInvestigation(investigation);
        console.log('Investigation :', investigation);
    };

    const handleSelectChange = (selectedOption) => {
        setSelectedPatient(selectedOption);
        setSelectedConsultation(null);

        // Set the patientId in the formData
        setFormData({ ...formData, patientId: selectedOption ? selectedOption.value : '' });

    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmitResults = async (e) => {
        e.preventDefault();

        try {

            const response = await axios.put(
                `http://localhost:3001/thomas/update-investigation-diagnois/${selectedInvestigation.investigation_id}`,
                {
                    predicted_diagnosis: formData.predicted_diagnosis,
                    notes: formData.notes
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.message.includes('updated successfully!')) {
                console.log('Update successful:', response.data);
                setShowErrorAlert(true);
                setFormData(
                    {
                        predicted_diagnosis: '',
                        notes: '',
                        patientId: selectedPatient?.value,
                        userId: currentUser?.id,  // Assuming you can get userId from your context
                    }
                );
                try {
                    if (selectedPatient) {
                        const patientId = selectedPatient.value;
                        const consultationResponse = await axios.get(`http://localhost:3001/thomas/get-consultation-investigation/${patientId}`);
                        const consultationData = consultationResponse.data.consultations || [];
        
                        // No need to process grouped consultations here, as it's already done in the backend
                        setConsultations(consultationData);
    
                        console.log('Consultations Data:', consultationData);
                    }
                } catch (error) {
                    console.error('Error fetching patient details:', error);
                }

                setDataAddedToGrid(false);
                setAddConsultationToGrid(false);
                setErrorMessage('Results sent successfully!');
                window.scrollTo(0, 0);
            } else {
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error sending results:', error);
            setErrorMessage('Error sending results. Please try again.');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
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

            <div className="col-4">
                {/* Use react-select for patient search */}
                <Select
                    value={selectedPatient}
                    onChange={handleSelectChange}
                    options={options}
                    placeholder="Search by PID or Patient Name..."
                    isClearable
                />
            </div><br />

            <section className="section">
                {patientDetails && patientDetails.length > 0 && (
                    <>
                        <div className="row">
                            <div className="col-lg-6">
                                <div className="patient-details">
                                    <h2>Patient Details</h2>
                                    <h5><strong>{patientDetails[0].firstname} {patientDetails[0].lastname}</strong></h5>
                                    <strong>PID: </strong>{patientDetails[0].pId || "-"}<br />
                                    <strong>Age: </strong>{patientDetails[0].age || "-"}<br />
                                    <strong>Number: </strong>{patientDetails[0].number || "-"}<br />
                                    <strong>Email: </strong>{patientDetails[0].email || "-"}<br />
                                    <strong>Address: </strong>{patientDetails[0].address || "-"}<br />
                                    <strong>Gender: </strong>{patientDetails[0].gender || "-"}<br />
                                </div>
                            </div>

                            {biodata.length > 0 && (
                                <div className="col-lg-6">
                                    <h3>Biological Data</h3>
                                    {biodata.map((medicalHistory, index) => (
                                        <div key={index}>
                                            <strong>Height: </strong> {medicalHistory.height || "-"}ft<br />
                                            <strong>Weight: </strong> {medicalHistory.weight || "-"}Kg<br />
                                            <strong>Blood Group: </strong> {medicalHistory.bloodgroup}{medicalHistory.rhesus} <br />
                                            <strong>Hypertensive: </strong> {medicalHistory.hypertensive || "-"}<br />
                                            <strong>Genotype: </strong> {medicalHistory.genotype || "-"}<br />
                                            <strong>Diabetic: </strong> {medicalHistory.diabetic || "-"}<br />
                                            <strong>Drug Reaction: </strong> {medicalHistory.reaction || "-"}<br />
                                            <strong>Other Health Information: </strong> {medicalHistory.other_info || "-"}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {consultations.length > 0 ? (
                            <div className="row mt-4">
                                <div className="col-lg-12">
                                    <h2>Consultations</h2>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Complaints</th>
                                                <th>Physical Examine</th>
                                                <th>Diagnosis</th>
                                                <th>Comments</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consultations.map((group, groupIndex) => (
                                                <tr key={groupIndex}>
                                                    <td>{group[0].consultation_id}</td>
                                                    <td>{group[0].complaints}</td>
                                                    <td>{group[0].physical_examine}</td>
                                                    <td>{group[0].diagnosis}</td>
                                                    <td>{group[0].consultation_comments}</td>
                                                    {group.every(consultation => consultation.predicted_diagnosis !== null) ? (
                                                        <td>
                                                            <button className="btn btn-primary" type="button" disabled>
                                                                All investigations sent
                                                            </button>
                                                        </td>
                                                    ) : (
                                                        group[0].investigation_id === null ? (
                                                            <td>
                                                                <button className="btn btn-primary" type="button" disabled>
                                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Waiting for Payment...
                                                                </button>
                                                            </td>
                                                        ) : (
                                                            <td>
                                                                <button className="btn btn-primary" type="button" onClick={() => handleConsultationClick(group)}>
                                                                    View Investigations
                                                                </button>
                                                            </td>
                                                        )
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <>
                                <br />
                                <strong>No consultations available for the selected patient.<br /></strong>
                            </>
                        )}



                    </>
                )}
                {showErrorAlert && (
                    <div className={`form-control alert ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`} role="alert">
                        {errorMessage}
                    </div>
                )}
                {addConsultationToGrid && selectedConsultation && (
                    <div className="row mt-4">
                        <div>
                            <h3 className="mb-3">All Investigations Details</h3>
                            <div className="col-lg-12">

                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Lab Testname</th>
                                            <th>Comments</th>
                                            <th>Attended Doctor</th>
                                            <th>Date/Time</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedConsultation.map((investigation, index) => (
                                            <tr style={{ padding: '10px' }} key={index}>
                                                <td>{index + 1}</td>
                                                <td>{investigation.testname}</td>
                                                <td>{investigation.investigation_comments}</td>
                                                <td>Dr. {investigation.firstname} {investigation.lastname}</td>
                                                <td>{investigation.investigation_datecreate ? formatDate(new Date(investigation.investigation_datecreate), 'yyyy/MM/dd HH:mm:ss') : "-"}</td>
                                                {investigation.predicted_diagnosis == null ? (
                                                    <td>
                                                        <button className="btn btn-outline-success" type="button" onClick={() => handleRecordClick(investigation)}>Record Lab Results</button>
                                                    </td>
                                                ) : (
                                                    <td>
                                                        <button className="btn btn-success" disabled type="button">Lab Results Sent</button>
                                                    </td>
                                                )}

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {dataAddedToGrid && (
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                <div className="text-center">
                                    <h1 className="card-title">Predicted Diagnosis: {selectedInvestigation.testname} {selectedInvestigation.investigation_id}   </h1>
                                </div>
                                <form onSubmit={handleSubmitResults}>
                                    {/* PATIENT INFORMATION */}
                                    <input
                                        type="hidden"
                                        name='patientId'
                                        value={formData.investigation_id}
                                        onChange={handleChange}
                                    />
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Lab Results</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <textarea
                                                        type="text"
                                                        name='predicted_diagnosis'
                                                        className="form-control"
                                                        value={formData.predicted_diagnosis}
                                                        onChange={handleChange}
                                                        placeholder='Enter predicted diagnosis based on lab results'
                                                    ></textarea>
                                                </td>
                                                <td>
                                                    <textarea
                                                        type="text"
                                                        value={formData.notes}
                                                        onChange={handleChange}
                                                        className="form-control"
                                                        name='notes'
                                                        placeholder='Enter notes from lab results'
                                                    ></textarea>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <button type="submit" name='submit' style={{ width: '100%', marginTop: '10px' }} className="btn btn-outline-primary">Send Lab Results to Doctor</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main >
    );
};

export default PrescribeMeds;