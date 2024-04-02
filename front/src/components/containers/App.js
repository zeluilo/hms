import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context'; // Adjust the path as needed
import AppRoutes from '../../routes/Routes';
import Login from '../../pages/profile/Login';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
          <Route path="login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
