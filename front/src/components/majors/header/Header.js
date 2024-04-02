import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../containers/Context";
import axios from 'axios';

import NavReceptionist from "../../../admins/receptionist/NavReceptionist";
import NavPharmacist from "../../../admins/pharmacist/NavPharmacist";
import NavDoctor from "../../../admins/doctor/NavDoctor";
import NavSuperAdmin from "../../../admins/superadmin/NavSuperAdmin";
import NavAccountant from "../../../admins/accountant/NavAccountant";
import NavNurse from "../../../admins/nurse/NavNurse";

const Header = () => {
  const { isLoggedIn, logout, currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen((prevState) => !prevState);
  };

  // Function to toggle showing all notifications
  const handleShowAllNotifications = () => {
    setShowAllNotifications(prevState => !prevState);
  };

  useEffect(() => {
    // Log current user details to the console
    console.log('Current User Details:', currentUser);
  }, [currentUser]);

  const handleSignOut = () => {
    logout(); // Use the logout function from useAuth
    navigate('/login');
  };

  const handleToProfile = () => {
    navigate('/profile');
  };

  useEffect(() => {
    console.log('isLoggedIn:', isLoggedIn);
    console.log('location.pathname:', location.pathname);
    // Redirect to login page if trying to access other pages while logged out
    if (!isLoggedIn && location.pathname !== '/login') {
      console.log('Redirecting to /login');
      navigate('/login');
    }
  }, [isLoggedIn, location.pathname, navigate]);

  useEffect(() => {
    const body = document.body;
    if (isSidebarOpen) {
      body.classList.add("toggle-sidebar");
    } else {
      body.classList.remove("toggle-sidebar");
    }
  }, [isSidebarOpen]);

  const renderAdminNav = () => {
    const adminType = currentUser?.adminType;

    // Check if the adminType is 'Pharmacist', render NavPharmacist
    if (adminType === 'Pharmacist') {
      return <NavPharmacist />;
    }

    // Check if the adminType is 'Receptionist', render NavDoctor
    if (adminType === 'Receptionist') {
      return <NavReceptionist />;
    }

    // Check if the adminType is 'Doctor', render NavDoctor
    if (adminType === 'Doctor') {
      return <NavDoctor />;
    }

    // Check if the adminType is 'SuperAdmin', render NavDoctor
    if (adminType === 'SuperAdmin') {
      return <NavSuperAdmin />;
    }

    // Check if the adminType is 'SuperAdmin', render NavDoctor
    if (adminType === 'Accountant') {
      return <NavAccountant />;
    }

    if (adminType === 'Nurse') {
      return <NavNurse />;
    }


    // Return null or an empty component for other admin types
    return null;
  };

  // Function to fetch new patient data and update notifications
  const fetchNewPatients = async () => {
    try {
      // Make a request to fetch new patient data from the server
      // Replace the URL with your endpoint for fetching new patient data
      const response = await axios.get('http://localhost:3001/thomas/get-notifications');
      const notificationResponse = response.data.notifications
      console.log('Notifications: ', notificationResponse)
      setNotifications(notificationResponse);
      // Update notification count and messages based on new patient data
      setNotificationCount(notificationResponse.length); // Update notification count
    } catch (error) {
      console.error('Error fetching new patient data:', error);
    }
  };

  useEffect(() => {
    // Fetch new patient data and update notifications every 5 seconds
    const intervalId = setInterval(fetchNewPatients, 90000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const handleNotificationClick = async (notificationId) => {
    try {
      // Perform deletion of the notification by sending a DELETE request to your backend API
      await axios.delete(`http://localhost:3001/thomas/delete-notifications/${notificationId}`);
      // Refetch notifications after deletion
      fetchNewPatients();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      // Send a request to the backend to clear all notifications
      await axios.delete('http://localhost:3001/thomas/delete-all-notifications');
      // After successfully clearing notifications, update the local state
      setNotifications([]);
      setNotificationCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - date.getTime();
    const secondsDifference = Math.floor(timeDifference / 1000);

    let formattedTime = '';

    if (secondsDifference < 60) {
      formattedTime = `${secondsDifference} secs ago`;
    } else if (secondsDifference < 3600) {
      const minutes = Math.floor(secondsDifference / 60);
      formattedTime = `${minutes} mins ago`;
    } else if (secondsDifference < 86400) {
      const hours = Math.floor(secondsDifference / 3600);
      formattedTime = `${hours} hours ago`;
    } else {
      const days = Math.floor(secondsDifference / 86400);
      formattedTime = `${days} days ago`;
    }

    return formattedTime;
  };



  return (
    <>
      <header id="header" className="header fixed-top d-flex align-items-center">
        {/* Title Logo */}
        <div className="d-flex align-items-center justify-content-between">
          <Link to="/" className="logo d-flex align-items-center">
            <img src={`${process.env.PUBLIC_URL}/img/thomas1.png`} alt="Logo" />
            <span className="d-none d-lg-block">Thomas</span>
          </Link>
          <i className="bi bi-list toggle-sidebar-btn" onClick={toggleSidebar}></i>
        </div>
        {/* Title Logo */}

        {/* Nav Dropdown */}
        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center">

            {/* Notifications */}
            {currentUser?.adminType === 'SuperAdmin' && (
            <li className="nav-item dropdown">
              <Link className="nav-link nav-icon" href="#" data-bs-toggle="dropdown">
                <i className="bi bi-bell"></i>
                <span className="badge bg-primary badge-number">{notificationCount}</span>
              </Link>
              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications" style={{ maxHeight: "400px", overflowY: "auto" }}>
                <li className="dropdown-header">
                  You have {notificationCount} new notifications
                  {notifications.length !== 0 ? (
                    <button className="badge rounded-pill bg-danger p-2 ms-2" onClick={(e) => {
                      e.stopPropagation();
                      handleClearAllNotifications();
                    }}>Clear All</button>
                  ) : null}
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                {/* Notification items */}
                {notifications.length === 0 ? (
                  <li className="dropdown-item">No notifications</li>
                ) : (
                  // Map over notifications array and render each notification
                  notifications.slice(0, showAllNotifications ? notifications.length : 4).map((notification, index) => (
                    <React.Fragment key={index}>
                      {!showAllNotifications && index === 4 && (
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                      )}
                      <li className="notification-item">
                        {notification.notification_patientId && (
                          <>
                            <i className="bi bi-info-circle text-primary"></i>
                            <Link to='/managepatients' onClick={() => handleNotificationClick(notification.notificationId)}>
                              <div>
                                <h4>New patient registered:</h4>
                                <p>{notification.message}</p>
                                <p>{formatTime(notification.notification_datecreate)} ago</p>
                              </div>
                            </Link>
                          </>
                        )}
                        {notification.notification_drugId && (
                          <>
                            <i className="bi bi-x-circle text-success"></i>
                            <Link to='/add-drug' onClick={() => handleNotificationClick(notification.notificationId)}>
                              <div>
                                <h4>New drug added to grid:</h4>
                                <p>{notification.message}</p>
                                <p>{formatTime(notification.notification_datecreate)} ago</p>
                              </div>
                            </Link>
                          </>
                        )}
                        {notification.notification_requestId && (
                          <>
                            <i className="bi bi-exclamation-circle text-danger"></i>
                            <Link to='/request-delete' onClick={() => handleNotificationClick(notification.notificationId)}>
                              <div>
                                <h4>New delete request added:</h4>
                                <p>{notification.message}</p>
                                <p>{formatTime(notification.notification_datecreate)} ago</p>
                              </div>
                            </Link>
                          </>
                        )}
                        {notification.notification_testId && (
                          <>
                            <i className="bi bi-info-circle text-primary"></i>
                            <Link to='/prescribe-test' onClick={() => handleNotificationClick(notification.notificationId)}>
                              <div>
                                <h4>New labtest added:</h4>
                                <p>{notification.message}</p>
                                <p>{formatTime(notification.notification_datecreate)} ago</p>
                              </div>
                            </Link>
                          </>
                        )}
                      </li>
                    </React.Fragment>
                  ))
                )}
                <li>
                  <hr className="dropdown-divider" />
                </li>
                {notifications.length > 4 && !showAllNotifications && (
                  <li className="dropdown-footer">
                    <button className="btn btn-link" onClick={(e) => {
                      e.stopPropagation();
                      handleShowAllNotifications();
                    }}>Show all notifications</button>
                  </li>
                )}

                {showAllNotifications && (
                  <li className="dropdown-footer">
                    <button className="btn btn-link" onClick={(e) => {
                      e.stopPropagation();
                      handleShowAllNotifications();
                    }}>Hide notifications</button>
                  </li>
                )}
              </ul>
            </li>
            )}
            {/* Notifications */}

            {/* Profile */}
            <li className="nav-item dropdown pe-3">
              <Link
                className="nav-link nav-profile d-flex align-items-center pe-0"
                href="#"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  src={`${process.env.PUBLIC_URL}/img/thomas1.png`}
                  alt="Profile"
                  className="rounded-circle"
                />
                <span className="d-none d-md-block dropdown-toggle ps-2">{currentUser?.firstname} {currentUser?.lastname}</span>
              </Link>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
                <li className="dropdown-header">
                  <h6>{currentUser?.firstname} {currentUser?.lastname}</h6>
                  <span>{currentUser?.department} {currentUser?.adminType}</span>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <Link to="/profile" onClick={handleToProfile} className="dropdown-item d-flex align-items-center" href="users-profile.html">
                    <i className="bi bi-person"></i>
                    <span>My Profile</span>
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center" onClick={handleSignOut}>
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Sign Out</span>
                  </Link>
                </li>

              </ul>
            </li>
            {/* Profile */}
          </ul>
        </nav>
      </header>
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        {renderAdminNav()}
      </aside>
    </>
  );
};

export default Header;
