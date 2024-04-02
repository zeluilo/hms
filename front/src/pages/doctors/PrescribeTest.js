import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useAuth } from '../../components/containers/Context';

const PrescibeTest = () => {
    const { currentUser } = useAuth();
    const userDepartment = currentUser?.department;

    useEffect(() => {
        console.log('User Department:', userDepartment);
    }, [userDepartment]);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [addConsultationToGrid, setAddConsultationToGrid] = useState(false);
    const [consultations, setConsultations] = useState([]);
    const [options, setOptions] = useState([]);
    const [selectedConsultation, setSelectedConsultation] = useState(null);

    const [addToGrid, setAddToGrid] = useState(false);
    const [overallTotalPrice, setOverallTotalPrice] = useState(0);
    const [gridInvestigations, setGridInvestigations] = useState([]);
    const [submitInvestigations, setSubmitInvestigations] = useState([]);
    const [investigations, setInvestigations] = useState([]);

    const [formData, setFormData] = useState({
        testname: '',
        comments: '',
        price: '',
        userId: currentUser?.id,
        patientId: selectedPatient?.value,
        datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    });

    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [biodata, setbiodata] = useState([]);
    const [patientDetails, setPatientDetails] = useState(null);
    const [testOptions, setTestOptions] = useState([]);
    const [selectedTestOption, setSelectedTestOption] = useState(null);

    const handleTestOptionChange = (selectedOption) => {
        setSelectedTestOption(selectedOption);
        setFormData({ ...formData, testname: selectedOption.label, price: selectedOption.price, department: selectedOption.department, });
    };

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/get-labtest');
                const tests = response.data.labTests.map(test => ({
                    value: test.id,
                    label: test.testname,
                    price: test.price,
                    department: test.department,
                }));
                setTestOptions(tests);
            } catch (error) {
                console.error('Error fetching tests:', error);
            }
        };

        fetchTests();
    }, []);


    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                if (selectedPatient) {
                    const patientId = selectedPatient.value;
                    const patientDetailsResponse = await axios.get(`http://localhost:3001/thomas/patient-details/${patientId}`);
                    const biodataResponse = await axios.get(`http://localhost:3001/thomas/get-biodata/${patientId}`);
                    const consultationResponse = await axios.get(`http://localhost:3001/thomas/get-consultations/${patientId}`);

                    setPatientDetails(patientDetailsResponse.data.patientDetails);
                    setbiodata(biodataResponse.data.biodata);
                    setConsultations(consultationResponse.data.consultations);

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

    useEffect(() => {
        let total = 0;
        submitInvestigations.forEach(investigations => {
            total += parseFloat(investigations.price) || 0;
        });
        setOverallTotalPrice(total);

        if (submitInvestigations.length === 0) {
            setAddToGrid(false);
        }
    }, [submitInvestigations]);

    const handleConsultationClick = (consultation) => {
        // Handle what happens when a consultation button is clicked
        setAddConsultationToGrid(true);
        setAddToGrid(false);
        setSelectedConsultation(consultation);
        console.log('Consultation :', consultation);
    };

    const handleSelectChange = (selectedOption) => {
        setSelectedPatient(selectedOption);

        // Set the patientId in the formData
        setFormData({ ...formData, patientId: selectedOption ? selectedOption.value : '' });

    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Function to handle adding investigations to the grid
    const handleAddToGrid = (selectedInvestigation) => {
        if (selectedInvestigation && formData.comments.trim()) {
            window.scrollTo(0, document.body.scrollHeight);
            console.log('Investigation: ', selectedInvestigation);
            const totalPrice = selectedInvestigation.price;
            console.log('Total price:', totalPrice);

            // Remove investigation from the gridInvestigations
            const updatedGridInvestigations = gridInvestigations.filter((p) => p !== selectedInvestigation);
            setGridInvestigations(updatedGridInvestigations);

            // Add investigation to the submitInvestigations
            const updatedSubmitInvestigations = [...submitInvestigations, { ...selectedInvestigation, comments: formData.comments }];
            setSubmitInvestigations(updatedSubmitInvestigations);

            // Update overall total price
            const updatedOverallTotalPrice = overallTotalPrice + totalPrice;
            setOverallTotalPrice(updatedOverallTotalPrice);

            setAddToGrid(true);
            setErrorMessage('Investigations added to table successfully!');
            setShowErrorAlert(true);
            setSelectedTestOption([])

            // Clear comments field
            setFormData((prevData) => ({
                ...prevData,
                comments: ''
            }));
        } else {
            if (!selectedInvestigation) {
                setErrorMessage('Please select a Test!');
            } else {
                setErrorMessage('Please enter comments!');
            }
            setShowErrorAlert(true);
            window.scrollTo(0, document.body.scrollHeight);
        }
    };

    const handleRemoveFromGrid = (investigations) => {
        // Add prescription back to gridInvestigations with previous details
        const updatedGridInvestigations = [...gridInvestigations, { ...investigations }];
        setGridInvestigations(updatedGridInvestigations);

        // Remove prescription from the updatedSubmitInvestigations
        const updatedSubmitInvestigations = submitInvestigations.filter((p) => p !== investigations);
        setSubmitInvestigations(updatedSubmitInvestigations);

        // Update overall total price
        const updatedOverallTotalPrice = overallTotalPrice - (investigations.price || 0);
        setOverallTotalPrice(updatedOverallTotalPrice);

        setErrorMessage('Investigation removed from grid successfully!');
        setShowErrorAlert(true);
    };

    // Function to handle submitting investigations to the backend
    const handleInvestigationsSubmit = async (e) => {
        e.preventDefault();

        try {
            console.log('Submitting investigations:', submitInvestigations);

            // Make the API call to add payment details to the 'payment' table
            const paymentData = {
                total_amount: overallTotalPrice,
                userId: currentUser.id,
                status: 'Not Paid',
                datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
            };

            console.log('Adding Payment:', paymentData);

            // Make the API call to add payment details to the 'payment' table
            const paymentResponse = await axios.post('http://localhost:3001/thomas/add-payment', paymentData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Payment Response:', paymentResponse.data);
            if (paymentResponse.data.message.includes('Payment added successfully')) {

                // Make a POST request to your backend to add Investigations
                const investigationPromises = submitInvestigations.map(async (investigation) => {
                    const investigationData = {
                        testname: investigation.label,
                        price: investigation.price,
                        comments: investigation.comments,
                        department: investigation.department,
                        consultationId: selectedConsultation.id,
                        patientId: formData.patientId,
                        userId: currentUser?.id,
                        datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
                    };
                    console.log('Investigation data:', investigationData);

                    const investigationResponse = await axios.post('http://localhost:3001/thomas/add-investigations', investigationData, {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    console.log('Investigation Response:', investigationResponse.data); // Log the entire response

                    if (investigationResponse.data.message === 'Investigation added successfully!') {
                        const investigationId = investigationResponse.data.id; // Retrieve the generated investigationId
                        const paymentId = paymentResponse.data.id; // Retrieve the generated paymentId
                        console.log('Investigation price:', paymentId);


                        // If successful, add investigation payment details to the 'investigation_payment' table
                        const investigationPaymentPromises = await axios.post('http://localhost:3001/thomas/add-investigation-payments', {
                            paymentId: paymentId, // Use the retrieved paymentId
                            investigationId: investigationId,
                            price: investigation.price,
                        });

                        console.log('Payment Response:', investigationPaymentPromises.data); // Log the entire response

                        return investigationResponse.data;
                    } else {
                        // Handle failure case
                        console.error('Error adding investigations:', investigationResponse.data.message);
                        return investigationResponse.data;
                    }
                });

                const allInvestigationResponses = await Promise.all(investigationPromises);

                // Check if all investigations were added successfully
                const allInvestigationsAdded = allInvestigationResponses.every(response => response.message === 'Investigation added successfully!');
                if (allInvestigationsAdded) {
                    setErrorMessage('Investigation submited successfully!');
                    setShowErrorAlert(true);
                    setInvestigations([]);
                    setAddToGrid(false);
                    window.scrollTo(0, 0);
                } else {
                    console.error('Error adding investigations:', allInvestigationResponses.map(response => response.message).join(', '));
                    setErrorMessage('Error adding investigations. Please try again.');
                    setShowErrorAlert(true);
                }

            } else {
                // Handle failure case
                console.error('Error adding payment:', paymentResponse.data.message);
                setErrorMessage('Error adding payment. Please try again.');
                setShowErrorAlert(true);
            }
        } catch (error) {
            console.error('Error making payment:', error);
            // Handle the error, e.g., display an error to the user
            setErrorMessage('Error making payment. Please try again.');
            setShowErrorAlert(true);
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
                                            {/* Add more properties as needed */}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {consultations.length > 0 ? (
                            <div className="row mt-4">
                                <div className="col-lg-12">
                                    <h2>Consultations</h2>
                                    <table className="table table-bordered table-hover">
                                        <thead className='table table-primary'>
                                            <tr>
                                                <th>#</th>
                                                <th>Complaints</th>
                                                <th>Physcial Examine</th>
                                                <th>Diagnosis</th>
                                                <th>Comments</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consultations.map((consultation, index) => (
                                                <tr key={index}>
                                                    <td>{consultation.id}</td>
                                                    <td>{consultation.complaints}</td>
                                                    <td>{consultation.physical_examine}</td>
                                                    <td>{consultation.diagnosis}</td>
                                                    <td>{consultation.comments}</td>
                                                    <td><button 
                                                    className='btn btn-outline-primary btn-md rounded-pill'
                                                    onClick={() => handleConsultationClick(consultation)}>Prescribe Investigations</button></td>
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
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="text-center">
                                        <h1 className="card-title">Patient Investigation Prescriptions ({selectedConsultation.id})</h1>
                                        <h2 className="bi bi-prescription2"> </h2>
                                    </div>
                                    <form>
                                        <table className="table table-bordered table-hover">
                                            <thead className="table table-primary">
                                                <tr>
                                                    <th>Investigation(s)</th>
                                                    <th>Provisional Diagnosis</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td style={{ paddingRight: '20px' }}>
                                                        <Select
                                                            options={testOptions}
                                                            value={selectedTestOption}
                                                            onChange={handleTestOptionChange}
                                                            placeholder="Search a Test"
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <textarea
                                                            type="text"
                                                            value={formData.comments}
                                                            onChange={handleChange}
                                                            className="form-control"
                                                            name='comments'
                                                            placeholder="Extra Note/Comments"
                                                        ></textarea>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className='btn btn-outline-primary btn-md rounded-pill'
                                                        type="button" onClick={() => handleAddToGrid(selectedTestOption)}>Add To Grid</button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </form>

                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {addToGrid && selectedConsultation && (
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="text-center">
                                        <h1 className="card-title">Patient's Investigations Prescribed</h1>
                                        <h2 className="bi bi-prescription2"> </h2>
                                    </div>
                                    <form onSubmit={handleInvestigationsSubmit}>
                                        {/* PATIENT INFORMATION */}
                                        <input
                                            type="hidden"
                                            name='patientId'
                                            className="form-control"
                                            id="exampleFormControlInput1"
                                            value={formData.patientId}
                                            onChange={handleChange} readOnly
                                        />
                                        <table className="table table-borderless table-hover">
                                            <thead className='table table-primary'>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Investigations</th>
                                                    <th>Price</th>
                                                    <th>Comments</th>
                                                    <th>Department</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {submitInvestigations.map((investigations, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <strong>{index + 1}</strong>
                                                        </td>
                                                        <td style={{ paddingRight: '20px' }}>
                                                            {investigations.label || "-"}<br />
                                                        </td>
                                                        <td>
                                                            ₦{investigations.price || "-"}<br />
                                                        </td>
                                                        <td>
                                                            {investigations.comments || "-"}<br />
                                                        </td>
                                                        <td>
                                                            {investigations.department || "-"}<br />
                                                        </td>
                                                        <td>
                                                            <button 
                                                                className='btn btn-outline-primary btn-md rounded-pill'
                                                            type="button" onClick={() => handleRemoveFromGrid(investigations)}>Remove from Grid</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button type="submit" 
                                        
                                        name='submit' style={{ width: '100%', marginTop: '10px' }} className="btn btn-primary">Submit Prescriptions</button>
                                    </form>
                                </div>
                                <div className="text-center">
                                    <h4><strong>Price:</strong> ₦{overallTotalPrice}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main >
    );
};

export default PrescibeTest;