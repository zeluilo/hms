import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../components/containers/Context';

const Login = () => {
  const { login , setCurrentUser, setAuthData } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    console.log('Attempting login...');

    try {
      const response = await axios.post('http://localhost:3001/thomas/login', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response data:', response.data);

      const { token, user, tokenExpiration, message } = response.data;
      

      if (token && user) {
        console.log('Admin successful:', response.data);

        if (message.includes('successfully!')) {
          console.log('Login successful:', response.data);
          setErrorMessage('Admin logged in successfully!');
          setShowErrorAlert(true);

          // Use the setLoggedIn prop to update the state
          login(user, token, tokenExpiration);

          // Store the current user details in the session
          setCurrentUser(user);

          console.log('Logged-in user details:', user);

          setAuthData({user, token, tokenExpiration });
          console.log('Auth data:', {user, token, tokenExpiration });
    
          // Redirect to dashboard after successful login
          navigate('/dashboard', { state: { successMessage: 'Logged in successfully!' } });
        } else {
          console.error('Unexpected response:', response.data);
          setErrorMessage('Invalid credentials. Please try again.');
          setShowErrorAlert(true);
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
  
      // Handle the error, e.g., display an error message to the user
      if (error.response && error.response.status === 401) {
        // Handle 401 Unauthorized specifically for invalid credentials
        setErrorMessage('Invalid credentials. Please try again.');
      } else {
        // Handle other errors
        setErrorMessage('Error during login. Please try again.');
      }
  
      setShowErrorAlert(true);
    }
  };
  

  return (
    <main>
      <div className="container">
        <section className="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">
                <div className="d-flex justify-content-center py-4">
                  <a href="index.html" className="logo d-flex align-items-center w-auto">
                    <img src={`${process.env.PUBLIC_URL}/img/thomas1.png`} alt="" />
                    <span className="d-none d-lg-block">Thomas</span>
                  </a>
                </div>

                <div className="card mb-3">
                  <div className="card-body">
                    <div className="pt-4 pb-2">
                      <h5 className="card-title text-center pb-0 fs-4">Login to Your Account</h5>
                      <p className="text-center small">Enter your email & password to login</p>
                    </div>

                    <form onSubmit={handleLogin} className="row g-3 needs-validation" noValidate>
                      <div className="col-12">
                        <label htmlFor="yourUsername" className="form-label">Email Address</label>
                        <div className="input-group has-validation">
                          <input type="text" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
                        </div>
                      </div>

                      <div className="col-12">
                        <label htmlFor="yourPassword" className="form-label">Password</label>
                        <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required />
                      </div>
                      <div className="col-12">
                        <button className="btn btn-primary w-100" type="submit">Login</button>
                      </div>
                    </form>
                    
                    {/* Display error message as an alert */}
                    {showErrorAlert && (
                      <div className={`form-control alert ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`} role="alert">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="credits">
                  Designed by <a href="https://github.com/zeluilo">Prince Cue-Eze</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
