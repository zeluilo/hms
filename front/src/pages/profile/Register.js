import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Register = () => {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    number: '',
    address: '',
    dob: '',
    gender: '',
    adminType: '',
    password: '',
    confirmPassword: '',
    department: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showDepartment, setShowDepartment] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:3001/thomas/getdepartment');
        const departmentsData = response.data.patients;

        if (departmentsData && departmentsData.length > 0) {
          const sortedDepartments = departmentsData.sort((a, b) =>
            a.department.localeCompare(b.department)
          );
          setDepartments(sortedDepartments);
        } else {
          console.error('No departments found in the response:', response.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Check if the selected adminType is "Doctor"
    if (name === 'adminType' && value === 'Doctor') {
      setShowDepartment(true);
    } else {
      setShowDepartment(false);
      setFormData({ ...formData, department: '' });
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:3001/thomas/register-admin', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.message.includes('successfully')) {
        console.log('Registration successful:', response.data);
        setFormData({
          ...formData,
          firstname: '',
          lastname: '',
          email: '',
          number: '',
          address: '',
          dob: '',
          gender: '',
          adminType: '',
          password: '',
          confirmPassword: '',
          department: '', // Reset the selected department
        });
      }

      setErrorMessage(response.data.message);
      setShowErrorAlert(true);
    } catch (error) {
      console.error('Error registering Admin:', error);
      setErrorMessage('Error registering Admin. Please try again.');
      setShowErrorAlert(true);
    }
  };

  return (
    <>
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Register an Admin</h1>
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
                    {/* Admin INFORMATION */}
                    <h5 className="card-title">Admin Information</h5>
                    <div className="row">
                      <div className="col-xl-6">
                        <div className="form-group" style={{ padding: '15px' }}>
                          <label>First Name</label>
                          <input type="text" name='firstname' className="form-control" id="exampleFormControlInput1" placeholder="Enter first name" value={formData.firstname} onChange={handleChange} required />
                        </div>
                      </div>
                      <div className="col-xl-6">
                        <div className="form-group" style={{ padding: '15px' }}>
                          <label>Last Name</label>
                          <input type="text" name='lastname' className="form-control" id="exampleFormControlInput1" placeholder="Enter last name" value={formData.lastname} onChange={handleChange} required />
                        </div>
                      </div>
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Email</label>
                      <input type="email" name='email' className="form-control" id="exampleFormControlInput1" placeholder="Enter email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="row">
                      <div className="col-xl-6">
                        <div className="form-group" style={{ padding: '15px' }}>
                          <label>Password</label>
                          <input type="password" name='password' className="form-control" id="exampleFormControlInput1" placeholder="Enter Password" value={formData.password} onChange={handleChange} required />
                        </div>
                      </div>
                      <div className="col-xl-6">
                        <div className="form-group" style={{ padding: '15px' }}>
                          <label>Repeat Password</label>
                          <input type="password" name='confirmPassword' className="form-control" id="exampleFormControlInput1" placeholder="Confirm Password..." value={formData.confirmPassword} onChange={handleChange} required />
                        </div>
                      </div>
                    </div>
                    <div className="form-group" style={{ padding: '15px' }}>
                      <label>Home Address</label>
                      <textarea type="text" name='address' className="form-control" id="exampleFormControlInput1" placeholder="Enter Home Address" value={formData.address} onChange={handleChange}></textarea>
                    </div>
                    <div className="row">
                      <div className="col-xl-6">
                        <div className="form-group" style={{ padding: '15px' }}>
                          <label>Phone Number</label>
                          <input type="text" name='number' className="form-control" id="exampleFormControlInput1" placeholder="Enter Phone Number" value={formData.number} onChange={handleChange} required />
                        </div>
                      </div>
                      <div className="col-xl-6">
                        <div className="form-group" style={{ padding: '15px' }}>
                          <label>Date of Birth</label>
                          <input type="date" name='dob' className="form-control" id="exampleFormControlInput1" max={new Date().toISOString().split('T')[0]} value={formData.dob} onChange={handleChange} required />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-xl-6">
                        <div className="form-group" style={{ padding: '15px' }}>
                          <label htmlFor="exampleFormControlSelect1">Sex</label>
                          <select className="form-control" name='gender' value={formData.gender} onChange={handleChange} id="exampleFormControlSelect1">
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-xl-6">
                        <div className="form-group" style={{ padding: '15px' }}>
                          <label htmlFor="exampleFormControlSelect1">Admin Category</label>
                          <select className="form-control" name='adminType' value={formData.adminType} onChange={handleChange} id="exampleFormControlSelect1">
                            <option value="">Select</option>
                            <option value="SuperAdmin">SuperAdmin</option>
                            <option value="Doctor">Doctor</option>
                            <option value="Nurse">Nurse</option>
                            <option value="Pharmacist">Pharmacist</option>
                            <option value="Accountant">Accountant</option>
                            <option value="Receptionist">Receptionist</option>
                          </select>
                        </div>
                      </div>
                      {showDepartment && (
                      <div className="row mb-3">
                        <label className="col-md-4 col-lg-3 col-form-label">Department</label>
                        <div className="col-md-8">
                            <select className="form-control" name='department' value={formData.department} onChange={(e) => handleChange(e, 'department')} required>
                              <option value="">Select a Department</option>
                              {departments.map((department) => (
                                <option key={department.id} value={department.department}>
                                  {department.department}
                                </option>
                              ))}
                            </select>
                        </div>
                      </div>
                      )}
                    </div>
                    <button type="submit" name='submit' style={{ width: '100%', marginTop: '10px' }} className="btn btn-primary">REGISTER</button>
                  </form>
                </div>
                {/* Display error message as an alert */}
                {showErrorAlert && (
                  <div className={`form-control alert ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`} role="alert">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Register;
