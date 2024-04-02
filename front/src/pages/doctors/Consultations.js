import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useAuth } from '../../components/containers/Context';

const Consultations = () => {
    const { currentUser } = useAuth();
    const userDepartment = currentUser?.department;

    useEffect(() => {
        console.log('User Department:', userDepartment);
    }, [userDepartment]);

    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [options, setOptions] = useState([]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const initialFormData = {
        bp: '',  // Adding default values for vital signs
        temperature: '',
        pulse: '',
        respiration: '',
        spo2: '',
        bmi: '',
        height: '',
        weight: '',
        complaints: '',
        pmr: '',
        drughistory: '',
        socialhistory: '',
        familyhistory: '',
        physical_examine: '',
        diagnosis: '',
        comments: '',
        patientId: selectedPatient?.value,
        userId: currentUser?.id,  // Assuming you can get userId from your context
        datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [biodata, setbiodata] = useState([]);
    const [patientDetails, setPatientDetails] = useState(null);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/thomas/get_doctors_queue/${userDepartment}`);
                setPatients(response.data.appointments);
            } catch (error) {
                console.error('Error fetching appointments:', error);
            }
        };

        fetchData();
    }, [userDepartment]);


    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                if (selectedPatient) {
                    const patientId = selectedPatient.value;
                    const patientDetailsResponse = await axios.get(`http://localhost:3001/thomas/patient-details/${patientId}`);
                    const biodataResponse = await axios.get(`http://localhost:3001/thomas/get-biodata/${patientId}`);

                    setPatientDetails(patientDetailsResponse.data.patientDetails);
                    setbiodata(biodataResponse.data.biodata);

                    console.log('Patient details:', patientDetailsResponse.data.patientDetails);
                    console.log('Biological Data:', biodataResponse.data.biodata);
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
                setPatients(response.data.patients);

                // Create options for react-select
                const patientOptions = response.data.patients.map(patient => ({
                    value: patient.pId,
                    label: `${patient.firstname} ${patient.lastname} (PID: ${patient.pId})`,
                }));

                setOptions(patientOptions);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };

        fetchData();
    }, []);


    const handleSelectChange = (selectedOption) => {
        setSelectedPatient(selectedOption);

        // Set the patientId in the formData
        setFormData({ ...formData, patientId: selectedOption ? selectedOption.value : '' });
    };

    const handleConsultationSubmit = async (e) => {
        e.preventDefault();

        if (!selectedPatient) {
            setErrorMessage('Please select a Patient');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
            return;
        }

        try {
            // Assuming you have the Diagnosis data in your component state
            const consultationData = {
                bp: formData.bp,
                temperature: formData.temperature,
                pulse: formData.pulse,
                respiration: formData.respiration,
                spo2: formData.spo2,
                bmi: formData.bmi,
                height: formData.height,
                weight: formData.weight,
                complaints: formData.complaints,
                pmr: formData.pmr,
                drughistory: formData.drughistory,
                socialhistory: formData.socialhistory,
                familyhistory: formData.familyhistory,
                physical_examine: formData.physical_examine,
                diagnosis: formData.diagnosis,
                comments: formData.comments,
                patientId: formData.patientId, // Assuming you have patientId in your state
                userId: currentUser.id, // Assuming you can get userId from your context
            };

            console.log('Adding Consultations:', consultationData);

            // Make a POST request to your backend to add Diagnosis
            const response = await axios.post('http://localhost:3001/thomas/add-consultations', consultationData);

            if (response.data.message === 'Consultations added successfully!') {
                // If the message includes 'added successfully', it's a successful registration
                console.log('Consultations successful:', response.data);
                // Clear form data
                setFormData(
                    {
                        bp: '',
                        temperature: '',
                        pulse: '',
                        respiration: '',
                        spo2: '',
                        bmi: '',
                        height: '',
                        weight: '',
                        complaints: '',
                        pmr: '',
                        drughistory: '',
                        socialhistory: '',
                        familyhistory: '',
                        physical_examine: '',
                        diagnosis: '',
                        comments: '',
                        patientId: selectedPatient?.value,
                        userId: currentUser?.id,  // Assuming you can get userId from your context
                        datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
                    }
                );
                setErrorMessage('Consultations added successfully!');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            } else {
                // Handle other cases where the response is not as expected
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }

        } catch (error) {
            console.error('Error adding Consultations:', error);
            // Handle the error, e.g., display an error message to the user
            setErrorMessage('Error registering patient. Please try again.');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
        }
    }

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
                                        {/* Add more properties as needed */}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <br />
                    </>
                )}
                {showErrorAlert && (
                    <div className={`form-control alert ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`} role="alert">
                        {errorMessage}
                    </div>
                )}
                <form onSubmit={handleConsultationSubmit}>
                    <div className="row">

                        <div className="col-lg-4">

                            <div className="card">
                                <div className="card-body">
                                    <div className="text-center">
                                        <h1 className="card-title">Vital Signs</h1>
                                        <h2 className="bi bi-heart-pulse-fill"> </h2>
                                    </div>
                                    {/* PATIENT INFORMATION */}
                                    <input
                                        type="hidden"
                                        name='patientId'
                                        className="form-control"
                                        id="exampleFormControlInput1"
                                        value={formData.patientId}
                                        onChange={handleChange} readOnly
                                    />
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Blood Pressure (BP)</label>
                                        <input
                                            type="text"
                                            name='bp'
                                            className="form-control"
                                            placeholder="Enter BP"
                                            value={formData.bp}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Temperature</label>
                                        <input
                                            type="text"
                                            name='temperature'
                                            className="form-control"
                                            placeholder="Enter temperature"
                                            value={formData.temperature}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Pulse</label>
                                        <input
                                            type="text"
                                            name='pulse'
                                            className="form-control"
                                            placeholder="Enter pulse"
                                            value={formData.pulse}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Respiration</label>
                                        <input
                                            type="text"
                                            name='respiration'
                                            className="form-control"
                                            placeholder="Enter respiration"
                                            value={formData.respiration}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>SPO2</label>
                                        <input
                                            type="text"
                                            name='spo2'
                                            className="form-control"
                                            placeholder="Enter SPO2"
                                            value={formData.spo2}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>BMI</label>
                                        <input
                                            type="text"
                                            name='bmi'
                                            className="form-control"
                                            placeholder="Enter BMI"
                                            value={formData.bmi}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Height</label>
                                        <input
                                            type="text"
                                            name='height'
                                            className="form-control"
                                            placeholder="Enter height"
                                            value={formData.height}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Weight</label>
                                        <input
                                            type="text"
                                            name='weight'
                                            className="form-control"
                                            placeholder="Enter weight"
                                            value={formData.weight}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="text-center">
                                        <h1 className="card-title">Medical History</h1>
                                        <h2 className="bi bi-file-earmark-medical-fill"> </h2>
                                    </div>
                                    {/* PATIENT INFORMATION */}
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Complaints</label>
                                        <textarea
                                            name='complaints'
                                            className="form-control"
                                            placeholder="Enter complaints"
                                            value={formData.complaints}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>PMR (Past Medical Record)</label>
                                        <textarea
                                            name='pmr'
                                            className="form-control"
                                            placeholder="Enter PMR"
                                            value={formData.pmr}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Drug History</label>
                                        <textarea
                                            name='drughistory'
                                            className="form-control"
                                            placeholder="Enter drug history"
                                            value={formData.drughistory}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Social History</label>
                                        <textarea
                                            name='socialhistory'
                                            className="form-control"
                                            placeholder="Enter social history"
                                            value={formData.socialhistory}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Family History</label>
                                        <textarea
                                            name='familyhistory'
                                            className="form-control"
                                            placeholder="Enter family history"
                                            value={formData.familyhistory}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Physical Examination</label>
                                        <textarea
                                            name='physical_examine'
                                            className="form-control"
                                            placeholder="Enter physical examination details"
                                            value={formData.physical_examine}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="text-center">
                                        <h1 className="card-title">Diagnosis</h1>
                                        <h2 className="ri-wheelchair-line"> </h2>
                                    </div>
                                    {/* PATIENT INFORMATION */}
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Assessments/Diagnosis</label>
                                        <textarea
                                            name='diagnosis'
                                            className="form-control"
                                            placeholder="Enter diagnosis"
                                            value={formData.diagnosis}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="form-group" style={{ padding: '15px' }}>
                                        <label>Extra Comments</label>
                                        <textarea
                                            name='comments'
                                            className="form-control"
                                            placeholder="Enter Extra Comments"
                                            value={formData.comments}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="submit" name='submit' style={{ width: '100%', marginTop: '10px' }} className="btn btn-outline-primary">Submit Medical History</button>
                </form>
            </section>
        </main >
    );
};

export default Consultations;