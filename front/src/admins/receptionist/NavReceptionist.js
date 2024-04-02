import React from "react";
import { Link } from "react-router-dom";

export default function NavReceptionist({ onNavItemClick }) {

  return (
    <aside className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">
        <li className="nav-item">
          <Link to='/dashboard' className="nav-link" onClick={() => onNavItemClick('dashboard')}>
            <i className="bi bi-grid"></i><span>Dashboard</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link className="nav-link collapsed" data-bs-target="#components-nav" data-bs-toggle="collapse">
            <i className="bi bi-menu-button-wide"></i><span>Patients</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="components-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li className="nav-item">
              <Link to="/register-patient" onClick={() => onNavItemClick('register-patient')}>
                <i className="bi bi-circle"></i><span>Register Patient</span>
              </Link>
            </li>
            <li>
              <Link to="/manage-patient" onClick={() => onNavItemClick('manage-patient')}>
                <i className="bi bi-circle"></i><span>Patient List</span>
              </Link>
            </li>
            <li>
              <Link to="/add-family" onClick={() => onNavItemClick('add-family')}>
                <i className="bi bi-circle"></i><span>Add Family Member/Friend</span>
              </Link>
            </li>
            <li>
              <Link to="/bio-data" onClick={() => onNavItemClick('bio-data')}>
                <i className="bi bi-circle"></i><span>Medical Biological Data</span>
              </Link>
            </li>
            <li>
              <Link to="view-records" className="nav-link" onClick={() => onNavItemClick('view-records')}>
                <i className="bi bi-circle"></i><span>View Patient Records</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="nav-item">
          <Link className="nav-link collapsed" data-bs-target="#forms-nav" data-bs-toggle="collapse">
            <i className="bi bi-journal-text"></i><span>Appointments</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="forms-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li>
              <Link to="check-queue" className="nav-link" onClick={() => onNavItemClick('check-queue')}>
                <i className="bi bi-circle"></i><span>Check Queue</span>
              </Link>
            </li>
            <li>
              <Link to="create-appointments" className="nav-link" onClick={() => onNavItemClick('create-appointments')}>
                <i className="bi bi-circle"></i><span>Book Appointments</span>
              </Link>
            </li>
            <li>
              <Link to="manage-appointments" className="nav-link" onClick={() => onNavItemClick('manage-appointments')}>
                <i className="bi bi-circle"></i><span>View Bookings</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="nav-item">
          <Link className="nav-link collapsed" data-bs-target="#form-nav" data-bs-toggle="collapse">
            <i className="bi bi-journal-text"></i><span>Billings</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="form-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li>
              <Link to="receptionist-debts" className="nav-link" onClick={() => onNavItemClick('receptionist-debts')}>
                <i className="bi bi-circle"></i><span>Outstanding Debts</span>
              </Link>
            </li>
          </ul>
        </li>
      </ul>
    </aside>
  );
}
