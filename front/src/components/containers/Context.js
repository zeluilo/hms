// Import necessary modules
import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setLoggedIn] = useState(() => {
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn');
    return storedIsLoggedIn ? JSON.parse(storedIsLoggedIn) : false;
  });

  const [authData, setAuthData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        return;
      }

      const userData = JSON.parse(localStorage.getItem('authData')); // Assuming user details are stored in localStorage
      console.log('User Data:', userData); 

      const response = await axios.post('/thomas/refresh-token', userData, {
        headers: {
          'Authorization': `Bearer ${token}` // Include "Bearer" prefix
        }
      });

      if (response.status === 200) {
        const data = response.data;
        console.log('Data:', response);
        localStorage.setItem('token', data.token);
        console.log('Token:', data.token);
        localStorage.setItem('tokenExpiration', data.expiration);
        console.log('Expiration:', data.expiration);
        console.log('Token refreshed successfully.');
      } else {
        console.error('Failed to refresh token:', response.statusText);
        // Handle token refresh failure (e.g., redirect to login page)
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Handle token refresh failure (e.g., redirect to login page)

      // If the error message is "Token expired", refresh the token
      if (error.response && error.response.data && error.response.data.message === "Token expired") {
        console.log('Token expired. Refreshing token...');
        await refreshToken();
      }
    }
  };



  useEffect(() => {
    const checkTokenExpiration = async () => {
      console.log('Checking token expiration...');
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      if (tokenExpiration && Date.now() > parseInt(tokenExpiration)) {
        console.log('Token expired. Refreshing token...');
        await refreshToken();
      } else {
        console.log('Token is still valid.');
      }
    };

    checkTokenExpiration(); // Initial check

    const tokenRefreshInterval = setInterval(checkTokenExpiration, 60000); // Check every minute

    return () => clearInterval(tokenRefreshInterval); // Cleanup
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
        setLoggedIn(true);
      } catch (error) {
        console.error('Error parsing storedUser:', error);
      }
    }

    const storedAuthData = localStorage.getItem('authData');
    if (storedAuthData) {
      try {
        setAuthData(JSON.parse(storedAuthData));
        setLoggedIn(true);
      } catch (error) {
        console.error('Error parsing storedAuth Data:', error);
      }
    }
  }, []);

  const login = (user, token, tokenExpiration) => {
    setCurrentUser(user);
    setLoggedIn(true);
    const newAuthData = { user, token, tokenExpiration };
    setAuthData(newAuthData);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', JSON.stringify(true));
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', tokenExpiration);
    localStorage.setItem('authData', JSON.stringify(newAuthData));
  };

  const logout = () => {
    setCurrentUser(null);
    setLoggedIn(false);
    setAuthData({ user: null, token: null, tokenExpiration: null });
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('authData');
  };

  const value = {
    isLoggedIn,
    currentUser,
    authData,
    login,
    logout,
    setCurrentUser,
    setLoggedIn,
    setAuthData,
    refreshToken // Export refreshToken function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const refreshToken = async () => {
  try {
    const response = await axios.post('/thomas/refresh-token', null, {
      headers: {
        'Authorization': `${localStorage.getItem('token')}`
      }
    });
    if (response.status === 200) {
      const data = response.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('tokenExpiration', data.expiration);
      console.log('Token refreshed successfully.');
    } else {
      console.error('Failed to refresh token:', response.statusText);
      // Handle token refresh failure (e.g., redirect to login page)
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Handle token refresh failure (e.g., redirect to login page)
  }
};


