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
    const [dataAddedToGrid2, setDataAddedToGrid2] = useState(false);
    const [addConsultationToGrid, setAddConsultationToGrid] = useState(false);
    const [consultations, setConsultations] = useState([]);
    const [options, setOptions] = useState([]);
    const [selectedConsultation, setSelectedConsultation] = useState(null);
    const [selectedResult, setSelectedResult] = useState(null);

    const [formData, setFormData] = useState({
        drugname: '',
        dosage: '',
        remarks: '',
        price: '',
        quantity: '',
        total_price: '',
        userId: currentUser?.id,
        patientId: selectedPatient?.value,
        datecreate: new Date().toISOString().slice(0, 19).replace("T", " ")
    });

    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [biodata, setbiodata] = useState([]);
    const [patientDetails, setPatientDetails] = useState(null);
    const [drugOptions, setDrugOptions] = useState([]);
    const [selectedDrugOption, setSelectedDrugOption] = useState(null);

    const handleDrugOptionChange = (selectedOption) => {
        setSelectedDrugOption(selectedOption);
        setFormData({ ...formData, drugname: selectedOption.label, price: selectedOption.price });
    };

    useEffect(() => {
        const fetchDrugs = async () => {
            try {
                const response = await axios.get('http://localhost:3001/thomas/get-drugs');
                const drugs = response.data.drugs.map(drug => ({
                    value: drug.id,
                    label: drug.drugname,
                    price: drug.price,

                }));
                setDrugOptions(drugs);
            } catch (error) {
                console.error('Error fetching drugs:', error);
            }
        };

        fetchDrugs();
    }, []);


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
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };

        fetchData();
    }, []);

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

    const handleConsultationClick = (consultation) => {
        // Handle what happens when a consultation button is clicked
        setAddConsultationToGrid(true);
        setDataAddedToGrid(false);
        setDataAddedToGrid2(false);
        setSelectedConsultation(consultation);
        console.log('Consultation :', consultation);
    };

    const handleSelectChange = (selectedOption) => {
        setSelectedPatient(selectedOption);
        setDataAddedToGrid(false);
        setDataAddedToGrid2(false);
        setAddConsultationToGrid(false);
        setErrorMessage('');

        // Set the patientId in the formData
        setFormData({ ...formData, patientId: selectedOption ? selectedOption.value : '' });

    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const frequencyMultipliers = {
        "Stat": 1,
        "BDS": 2,
        "TDS": 3,
        "4hrly": 6,
        "6hrly": 4,
        "8hrly": 3,
        "12hrly": 2
    };

    const durationMultipliers = {
        "Day(s)": 1,
        "Week(s)": 7,
        "Month(s)": 30
    };

    const handleSubmitToTable = async (e) => {
        e.preventDefault();

        if (!selectedPatient) {
            setErrorMessage('Please select a Patient');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
            return;
        }

        if (formData.drugname.trim() === '') { // Check if drugname is empty
            setErrorMessage('Please enter a Drug');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
            return;
        }

        // Check if df and dd are greater than or equal to 1
        if (formData.df < 1 || formData.dd < 1) {
            setErrorMessage('Daily Frequency and Duration must be 1 or greater');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
            return;
        }

        try {
            const dosage = `${formData.df} ${formData.frequency} ${formData.dd} ${formData.duration}`;
            const frequencyMultiplier = frequencyMultipliers[formData.frequency];
            const durationMultiplier = durationMultipliers[formData.duration];
            const calculatedQuantity = formData.dd * frequencyMultiplier * formData.df * durationMultiplier;
            const total_price = parseFloat(formData.price) * calculatedQuantity;

            const formDataToTable = {
                drugname: formData.drugname,
                dosage: dosage,
                quantity: calculatedQuantity,
                remarks: formData.remarks,
                userId: formData.userId,
                patientId: formData.patientId,
                total_price: total_price.toFixed(2)
            };

            console.log('Adding Prescriptions to Table:', formDataToTable);

            // Set calculated quantity and formatted dosage into formData
            setFormData({ ...formData, quantity: calculatedQuantity, dosage: dosage, total_price: total_price.toFixed(2) });

            setDataAddedToGrid2(true);

            setErrorMessage('Prescriptions added to the grid table successfully!');
            setShowErrorAlert(true);
            window.scrollTo(0, 100); // Scroll down by 30 pixels
        } catch (error) {
            console.error('Error adding Prescriptions to Table:', error);
            setErrorMessage('Error adding Prescriptions to the table. Please try again.');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
        }
    };

    const handleRecordClick = (selectedConsultation) => {
        // Handle what happens when a investigation button is clicked
        setDataAddedToGrid(true);
        setDataAddedToGrid2(false);
        setSelectedConsultation(selectedConsultation);
        console.log('Prescribe Investigation :', selectedConsultation);
    };

    const handleView = (investigation) => {
        // Set the selected patient for editing
        setSelectedResult(investigation);
        console.log('Investigation :', investigation);
    };

    const handleDelete = (e) => {
        e.preventDefault();
        setFormData({
            drugname: '',
            dd: '',
            df: '',
            frequency: '',
            duration: '',
            remarks: '',
            userId: currentUser?.id,
            patientId: selectedPatient?.patientId,
        })
        setDataAddedToGrid2(false);
        setErrorMessage('Prescriptions deleted successfully!');
    };

    const handlePrescriptionSubmit = async (e) => {
        e.preventDefault();

        if (!selectedPatient) {
            setErrorMessage('Please select a Patient');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
            return;
        }

        try {
            const total_price = parseFloat(formData.quantity) * parseFloat(formData.price);
            let calculatedQuantity = formData.dd * formData.df * formData.duration * formData.frequency;
            calculatedQuantity = formData.quantity; // Now this line will update the value of calculatedQuantity
            const dosage = `${formData.df} ${formData.frequency} ${formData.dd} ${formData.duration}`;
            const consultation_Id = `${selectedConsultation[0].consultation_id}`;
            console.log('Consultation Id: ', consultation_Id)

            const prescriptionsData = {
                ...formData,
                quantity: calculatedQuantity,
                total_price: total_price.toFixed(2),
                dosage: dosage,
                consultationId: consultation_Id,
                userId: currentUser?.id,
                patientId: selectedPatient?.value,
            };

            console.log('Adding Prescriptions:', prescriptionsData);

            // Make a POST request to your backend to add Prescriptions
            const response = await axios.post('http://localhost:3001/thomas/add-prescriptions', prescriptionsData);

            if (response.data.message === 'Prescriptions added successfully!') {
                console.log('Prescriptions added successfully!');


                // Clear form data
                setErrorMessage('Prescriptions added successfully!');
                setShowErrorAlert(true);
                setSelectedDrugOption(null);
                // Set calculated quantity and formatted dosage into formData
                setFormData({
                    drugname: '',
                    dd: '',
                    df: '',
                    frequency: '',
                    duration: '',
                    remarks: '',
                    userId: currentUser?.id,
                    patientId: selectedPatient?.patientId,
                })
                setDataAddedToGrid2(false);
                window.scrollTo(0, 0);
            } else {
                // Handle other cases where the response is not as expected
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                setDataAddedToGrid(true);
                window.scrollTo(0, 0);
            }

        } catch (error) {
            console.error('Error adding Prescriptions:', error);
            // Handle the error, e.g., display an error message to the user
            setErrorMessage('Error registering patient. Please try again.');
            setShowErrorAlert(true);
            setDataAddedToGrid(true);
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
                                                <th>Physcial Examine</th>
                                                <th>Diagnosis</th>
                                                <th>Comments</th>
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
                                                    {/* {group.every(consultation => consultation.predicted_diagnosis == null) ? (
                                                        <td>
                                                            <button className="btn btn-primary" type="button" disabled>
                                                                All investigations sent
                                                            </button>
                                                        </td>
                                                    ) : (
                                                        group[0].investigation_id === null ? (
                                                            <td>
                                                                <button className="btn btn-primary" type="button" disabled>
                                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Pending...
                                                                </button>
                                                            </td>
                                                        ) : (
                                                            <td>
                                                                <button className="btn btn-primary" type="button" onClick={() => handleConsultationClick(group)}>
                                                                    View Results
                                                                </button>
                                                            </td>
                                                        )
                                                    )} */}
                                                    {group[0].predicted_diagnosis === null ? (
                                                        <td>
                                                            <button className="btn btn-primary" type="button" disabled>
                                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Pending...
                                                            </button>
                                                        </td>
                                                    ) : (
                                                        <td>
                                                            <button className="btn btn-primary" type="button" onClick={() => handleConsultationClick(group)}>
                                                                View Results
                                                            </button>
                                                        </td>
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
                            <h3 className="mb-3">All Laboratory Results</h3>
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
                                                {/* {investigation.predicted_diagnosis == null ? (
                                                    <td>
                                                        <button className="btn btn-outline-success" type="button" onClick={() => handleRecordClick(investigation)}>Record Lab Results</button>
                                                    </td>
                                                ) : (
                                                    <td>
                                                        <button className="btn btn-success" disabled type="button">Lab Results Sent</button>
                                                    </td>
                                                )} */}
                                                <td>
                                                    <button className="btn btn-outline-success" type="button" data-bs-toggle="modal" data-bs-target="#record" onClick={() => handleView(investigation)}>View More details</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button style={{ width: '100%', marginTop: '10px' }} className="btn btn-outline-success" type="button" onClick={() => handleRecordClick(selectedConsultation)}>Prescribe Medications</button>
                            </div>
                        </div>
                    </div>
                )}
                <br/>
                {dataAddedToGrid && (
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="text-center">
                                        <h1 className="card-title">Prescriptions: {selectedConsultation[0].complaints} ({selectedConsultation[0].consultation_id})</h1>
                                        <h2 className="bi bi-prescription2"> </h2>
                                    </div>
                                    <form onSubmit={handleSubmitToTable}>
                                        {/* PATIENT INFORMATION */}
                                        <input
                                            type="hidden"
                                            name='patientId'
                                            className="form-control"
                                            id="exampleFormControlInput1"
                                            value={formData.patientId}
                                            onChange={handleChange} readOnly
                                        />
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Drug</th>
                                                    <th>Daily Frequency</th>
                                                    <th>Duration</th>
                                                    <th>Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <Select
                                                            options={drugOptions}
                                                            value={selectedDrugOption}
                                                            onChange={handleDrugOptionChange}
                                                            placeholder="Search a Drug"
                                                            required
                                                        />

                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={formData.df}
                                                            onChange={handleChange}
                                                            className="form-control"
                                                            name='df'
                                                            placeholder='Enter number of times to be taken'
                                                            required
                                                        />
                                                        <br />
                                                        <select className="form-control" name='frequency' value={formData.frequency} onChange={handleChange} id="exampleFormControlSelect1" required>
                                                            <option value="">Select Frequency</option>
                                                            <option value="Stat">Stat</option>
                                                            <option value="BDS">BDS</option>
                                                            <option value="TDS">TDS</option>
                                                            <option value="4hrly">4hrly</option>
                                                            <option value="6hrly">6hrly</option>
                                                            <option value="8hrly">8hrly</option>
                                                            <option value="12hrly">12hrly</option>
                                                        </select>
                                                    </td>

                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={formData.dd}
                                                            onChange={handleChange}
                                                            className="form-control"
                                                            name='dd'
                                                            placeholder='Enter duration to be taken'
                                                            required
                                                        />

                                                        <br />
                                                        <select className="form-control" name='duration' value={formData.duration} onChange={handleChange} id="exampleFormControlSelect1" required>
                                                            <option value="">Select Duration</option>
                                                            <option value="Day(s)">Day(s)</option>
                                                            <option value="Week(s)">Week(s)</option>
                                                            <option value="Month(s)">Month(s)</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <textarea
                                                            type="text"
                                                            value={formData.remarks}
                                                            onChange={handleChange}
                                                            className="form-control"
                                                            name='remarks'
                                                            placeholder='Enter remarks for taking drug'
                                                        ></textarea>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <button type="submit" name='submit' style={{ width: '100%', marginTop: '10px' }} className="btn btn-outline-primary">Add To Grid</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {dataAddedToGrid2 && (
                    <div className="row">
                        <div className="col-lg-12">

                            <div className="card">
                                <div className="card-body">
                                    <div className="text-center">
                                        <h1 className="card-title">Patient's Medications Prescribed</h1>
                                        <h2 className="bi bi-prescription2"> </h2>
                                    </div>
                                    <form onSubmit={handlePrescriptionSubmit}>
                                        {/* PATIENT INFORMATION */}
                                        <input
                                            type="hidden"
                                            name='patientId'
                                            className="form-control"
                                            id="exampleFormControlInput1"
                                            value={formData.patientId}
                                            onChange={handleChange} readOnly
                                        />
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Drug</th>
                                                    <th>Dosage</th>
                                                    <th>Quantity</th>
                                                    <th>Price</th>
                                                    <th>Total Price</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={formData.drugname}
                                                            onChange={handleChange}
                                                            className="form-control"
                                                            name='drugname'
                                                            required
                                                            readOnly
                                                        />

                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={formData.dosage}
                                                            onChange={handleChange}
                                                            className="form-control"
                                                            name='dosage'
                                                            required
                                                            readOnly
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={formData.quantity}
                                                            onChange={handleChange}
                                                            className="form-control"
                                                            name='quantity'
                                                            required
                                                            readOnly
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={formData.price}
                                                            name='price'
                                                            readOnly
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={formData.total_price}
                                                            onChange={handleChange}
                                                            className="form-control"
                                                            name='total_price'
                                                            readOnly
                                                        />
                                                    </td>
                                                    <td>
                                                        <button type="button" onClick={handleDelete}>Delete</button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <button type="submit" name='submit' style={{ width: '100%', marginTop: '10px' }} className="btn btn-primary">Submit Prescriptions</button>
                                    </form>
                                </div>
                                <div className="text-center">
                                    <h4><strong>Price:</strong> ₦{formData.total_price}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* EDIT PATIENT MODAL */}
            <div className="modal fade" id="record" tabIndex="-1">
                <div className="modal-dialog ">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title"><strong>Full Lab Results</strong></h3>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        {selectedResult && (
                            <div className="modal-body">
                                <div className="row">
                                    <h5><strong>Date: </strong>{formatDateForInput(selectedResult.investigation_datecreate)}</h5><br /><br />
                                    <div className="col-lg-12">
                                        <div className="patient-details">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Provisional Diagnois</th>
                                                        <th>Predicted Diagnosis</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>
                                                            {selectedResult.diagnosis || "-"}
                                                        </td>
                                                        <td>
                                                            {selectedResult.predicted_diagnosis || "-"}
                                                        </td>

                                                    </tr>
                                                </tbody>
                                            </table>
                                            <strong>Notes from Lab: </strong>{selectedResult.notes || "-"}<br /><br />
                                            <strong>Test taken in Lab: </strong>{selectedResult.testname || "-"}<br />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* END OF MODAL */}


        </main >
    );
};

export default PrescribeMeds;
