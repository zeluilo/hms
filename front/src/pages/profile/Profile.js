import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from "../../components/containers/Context";

const Profile = () => {
    const { currentUser, login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstname: currentUser?.firstname || '',
        lastname: currentUser?.lastname || '',
        email: currentUser?.email || '',
        number: currentUser?.number || '',
        address: currentUser?.address || '',
        dob: currentUser?.dob || '',
        gender: currentUser?.gender || '',
        adminType: currentUser?.adminType || '',
        id: currentUser?.id || '',

    });

    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const formatDate = (dateString) => {
        const dateObject = new Date(dateString);
        const formattedDate = dateObject.toISOString().split('T')[0];
        return formattedDate;
      };

    const handleChange = (e) => {
        if (e.target.name === 'id') {
            setFormData({
                ...formData,
                id: currentUser?.id || '',
            });
        } else {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value,
            });
        }
    };

    const handleInputChange = (e, fieldName) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: e.target.value,
        }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.put(`http://localhost:3001/thomas/update-profile/${formData.id}`, formData);

            console.log(response.data);

            if (response.data.message) {
                // Handle error messages
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
            if (response.data.user) {
                // Update the user details in local storage
                if (typeof window !== 'undefined' && window.localStorage) {
                    login({ ...currentUser, ...formData });
                }
                setErrorMessage('Profile updated successfully!');
                setShowErrorAlert(true);
                navigate('/dashboard', { state: { successMessage: 'Updated successfully!' } });
            } else {
                console.error('Unexpected response:', response.data);
                setErrorMessage(response.data.message);
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setErrorMessage('Error updating profile. Please try again.');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
        }
    };

    return (
        <>
            <main id="main" className="main">

                <div className="pagetitle">
                    <h1>Profile</h1>
                    <nav>
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><a href="index.html">Home</a></li>
                            <li className="breadcrumb-item">Users</li>
                            <li className="breadcrumb-item active">Profile</li>
                        </ol>
                    </nav>
                </div>

                <section className="section profile">
                    <div className="row">
                        <div className="col-xl-4">

                            <div className="card">
                                <div className="card-body profile-card pt-4 d-flex flex-column align-items-center">

                                    <img src="assets/img/profile-img.jpg" alt="Profile" className="rounded-circle" />
                                    <h2>{currentUser?.firstname} {currentUser?.lastname}</h2>
                                    <h3>{currentUser?.department} {currentUser?.adminType}</h3>
                                </div>
                            </div>

                        </div>

                        <div className="col-xl-8">

                            <div className="card">
                                <div className="card-body pt-3">
                                    <ul className="nav nav-tabs nav-tabs-bordered">

                                        <li className="nav-item">
                                            <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#profile-overview">Overview</button>
                                        </li>

                                        <li className="nav-item">
                                            <button className="nav-link" data-bs-toggle="tab" data-bs-target="#profile-edit">Edit Profile</button>
                                        </li>

                                    </ul>
                                    <div className="tab-content pt-2">

                                        <div className="tab-pane fade show active profile-overview" id="profile-overview">
                                            <h5 className="card-title">Profile Details</h5>
                                            <div className="row">
                                                <div className="col-lg-3 col-md-4 label ">Full Name</div>
                                                <div className="col-lg-9 col-md-8">{currentUser?.firstname} {currentUser?.lastname}</div>
                                            </div>

                                            <div className="row">
                                                <div className="col-lg-3 col-md-4 label">Email</div>
                                                <div className="col-lg-9 col-md-8">{currentUser?.email}</div>
                                            </div>

                                            <div className="row">
                                                <div className="col-lg-3 col-md-4 label">Number</div>
                                                <div className="col-lg-9 col-md-8">{currentUser?.number}</div>
                                            </div>

                                            <div className="row">
                                                <div className="col-lg-3 col-md-4 label">Address</div>
                                                <div className="col-lg-9 col-md-8">{currentUser?.address}</div>
                                            </div>
                                        </div>

                                        <div className="tab-pane fade profile-edit pt-3" id="profile-edit">
                                            <form onSubmit={handleUpdateProfile}>
                                                {/* Admin INFORMATION */}
                                                <h5 className="card-title">Admin Information</h5>
                                                <div className="row">
                                                    <input type="hidden" name='firstname' className="form-control" value={formData.id} onChange={handleChange} />
                                                    <input type="hidden" name='adminType' className="form-control" value={formData.adminType} onChange={handleChange} />
                                                    <input type="hidden" name='gender' className="form-control" value={formData.gender} onChange={handleChange} />
                                                    <div className="col-xl-6">
                                                        <div className="form-group" style={{ padding: '10px' }}>
                                                            <label>First Name</label>
                                                            <input type="text" name='firstname' className="form-control" placeholder="Enter first name" onChange={(e) => handleInputChange(e, 'firstname')} value={formData.firstname} required />
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-6">
                                                        <div className="form-group" style={{ padding: '10px' }}>
                                                            <label>Last Name</label>
                                                            <input type="text" name='lastname' className="form-control" placeholder="Enter last name" value={formData.lastname} onChange={handleChange} required />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-group" style={{ padding: '10px' }}>
                                                    <label>Email</label>
                                                    <input type="email" name='email' className="form-control" placeholder="Enter email" value={formData.email} onChange={handleChange} required />
                                                </div>
                                                <div className="form-group" style={{ padding: '10px' }}>
                                                    <label>Home Address</label>
                                                    <textarea type="text" name='address' className="form-control" placeholder="Enter Home Address" value={formData.address} onChange={handleChange} required></textarea>
                                                </div>
                                                <div className="row">
                                                    <div className="col-xl-6">
                                                        <div className="form-group" style={{ padding: '10px' }}>
                                                            <label>Phone Number</label>
                                                            <input type="text" name='number' className="form-control" placeholder="Enter Phone Number" value={formData.number} onChange={handleChange} required />
                                                        </div>
                                                    </div>
                                                    <div className="col-xl-6">
                                                    <div className="form-group" style={{ padding: '10px' }}>
                                                        <label>Dart of Birth</label>
                                                        <input type="date" name='dob' className="form-control" id="exampleFormControlInput1" max={new Date().toISOString().split('T')[0]} value={formatDate(formData.dob)} onChange={handleChange} required />
                                                    </div>
                                                </div>
                                                </div>
                                                
                                                <button type="submit" style={{ width: '100%', marginTop: '10px' }} className="btn btn-primary">Update Profile</button>
                                            </form>
                                            {/* Display error message as an alert */}
                                            {showErrorAlert && (
                                                <div className={`form-control alert ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`} role="alert">
                                                    {errorMessage}
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                </section>

            </main>

        </>
    );
};


export default Profile;
