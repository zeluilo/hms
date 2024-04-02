import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../components/containers/Context';

const RegisterPatient = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const initialFormData = {
    firstname: '',
    lastname: '',
    email: '',
    number: '',
    address: '',
    dob: '',
    gender: '',
    nxt_firstname: '',
    nxt_lastname: '',
    nxt_email: '',
    nxt_number: '',
    nxt_address: '',
    reference: '',
    userId: userId,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    

    try {

      const patientData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        number: formData.number,
        address: formData.address,
        dob: formData.dob,
        gender: formData.gender,
        nxt_firstname: formData.nxt_firstname,
        nxt_lastname: formData.nxt_lastname,
        nxt_email: formData.nxt_email,
        nxt_number: formData.nxt_number,
        nxt_address: formData.nxt_address,
        reference: formData.reference,
        userId: userId
      };

      // Check if a patient with the same email or number already exists
      const response = await axios.post('http://localhost:3001/thomas/addpatient', patientData);

      if (response.data.message.includes('already exists')) {
        // Display an alert if a duplicate is found
        setErrorMessage(response.data.message);
        setShowErrorAlert(true);
      } else if (response.data.message.includes('at least 1 year old to be added')) {
        // Display an alert if the age requirement is not met
        setErrorMessage(response.data.message);
        setShowErrorAlert(true);
      } else if (response.data.message.includes('added successfully!')) {
        // If the message includes 'added successfully', it's a successful registration
        console.log('Registration successful:', response.data);
        // Clear form data
        setFormData(initialFormData);
        // Reset error message and hide error alert
        setErrorMessage('Patient added successfully!');
        setShowErrorAlert(true);
      } else {
        // Handle other cases where the response is not as expected
        console.error('Unexpected response:', response.data);
        setErrorMessage('Unexpected response. Please try again.');
        setShowErrorAlert(true);
      }
    } catch (error) {
      console.error('Error registering patient:', error);
      // Handle the error, e.g., display an error message to the user
      setErrorMessage('Error registering patient. Please try again.');
      setShowErrorAlert(true);
    }
  };


  return (
    <>
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Register a Patient</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item">Tables</li>
              <li className="breadcrumb-item active">Data</li>
            </ol>
          </nav>
        </div>

        <section className="section dashboard">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {/* PATIENT INFORMATION */}
                    <h5 className="card-title">Patient Information</h5>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>First Name</label>
                      <input type="text" name='firstname' className="form-control" id="exampleFormControlInput1" placeholder="Enter first name" value={formData.firstname} onChange={handleChange} required />
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Last Name</label>
                      <input type="text" name='lastname' className="form-control" id="exampleFormControlInput1" placeholder="Enter last name" value={formData.lastname} onChange={handleChange} required />
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Email</label>
                      <input type="email" name='email' className="form-control" id="exampleFormControlInput1" placeholder="Enter email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Phone Number</label>
                      <input type="text" name='number' className="form-control" id="exampleFormControlInput1" placeholder="Enter Phone Number" value={formData.number} onChange={handleChange} required />
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Home Address</label>
                      <textarea type="text" name='address' className="form-control" id="exampleFormControlInput1" placeholder="Enter Home Address" value={formData.address} onChange={handleChange}></textarea>
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Date of Birth</label>
                      <input type="date" name='dob' className="form-control" id="exampleFormControlInput1" max={new Date().toISOString().split('T')[0]} value={formData.dob} onChange={handleChange} required />
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label for="exampleFormControlSelect1">Sex</label>
                      <select className="form-control" name='gender' value={formData.gender} onChange={handleChange} id="exampleFormControlSelect1">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    {/* EMERGENCY CONTACT */}
                    <h5 className="card-title">Emergency Contact</h5>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>First Name</label>
                      <input type="text" name='nxt_firstname' className="form-control" id="exampleFormControlInput1" placeholder="Enter first name" value={formData.nxt_firstname} onChange={handleChange} required />
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Last Name</label>
                      <input type="text" name='nxt_lastname' className="form-control" id="exampleFormControlInput1" placeholder="Enter last name" value={formData.nxt_lastname} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Email</label>
                      <input type="email" name='nxt_email' className="form-control" id="exampleFormControlInput1" placeholder="Enter email" value={formData.nxt_email} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Phone Number</label>
                      <input type="text" name='nxt_number' className="form-control" id="exampleFormControlInput1" placeholder="Enter Phone Number" value={formData.nxt_number} onChange={handleChange} required />
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Home Address</label>
                      <textarea type="text" name='nxt_address' className="form-control" id="exampleFormControlInput1" placeholder="Enter Home Address" value={formData.nxt_address} onChange={handleChange}></textarea>
                    </div><br />

                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Reference</label>
                      <input type="text" name='reference' className="form-control" id="exampleFormControlInput1" placeholder="Enter Reference" value={formData.reference} onChange={handleChange} />
                    </div>
                    <button type="submit" name='submit' style={{ width: '100%', marginTop: '10px' }} className="btn btn-primary">REGISTER</button>
                  </form>
                </div>
                {/* Display error message as an alert */}
              </div>
            </div>
          </div>
        </section>
        {showErrorAlert && (
                  <div className={`form-control alert ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`} role="alert">
                    {errorMessage}
                  </div>
                )}
      </main>
    </>
  );
};


export default RegisterPatient;
