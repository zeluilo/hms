import React from "react";
import { Link } from "react-router-dom";

export default function NavSuperAdmin({ onNavItemClick }) {

  return (
    <aside className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">
        <li className="nav-item">
          <Link to='/dashboard' className="nav-link" onClick={() => onNavItemClick('dashboard')}>
            <i className="bi bi-grid"></i><span>Dashboard</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link className="nav-link collapsed" data-bs-target="#admins" data-bs-toggle="collapse">
            <i className="bi bi-person-badge"></i><span>Admins</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="admins" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li className="nav-item">
              <Link to="/manage-doctor" onClick={() => onNavItemClick('manage-doctor')}>
                <i className="bi bi-circle"></i><span>Doctors</span>
              </Link>
            </li>
            <li>
              <Link to="/manage-nurse" onClick={() => onNavItemClick('manage-nurse')}>
                <i className="bi bi-circle"></i><span>Nurse</span>
              </Link>
            </li>
            <li>
              <Link to="/manage-pharmacist" onClick={() => onNavItemClick('manage-pharmacist')}>
                <i className="bi bi-circle"></i><span>Pharmacist</span>
              </Link>
            </li>
            <li>
              <Link to="/manage-accountant" onClick={() => onNavItemClick('manage-accountant')}>
                <i className="bi bi-circle"></i><span>Accountant</span>
              </Link>
            </li>
            <li>
              <Link to="/manage-receptionist" onClick={() => onNavItemClick('manage-receptionist')}>
                <i className="bi bi-circle"></i><span>Receptionist</span>
              </Link>
            </li>
          </ul>
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
          <Link className="nav-link collapsed" data-bs-target="#appointment" data-bs-toggle="collapse">
            <i className="bi bi-journal-text"></i><span>Appointments</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="appointment" className="nav-content collapse " data-bs-parent="#sidebar-nav">
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
          <Link className="nav-link collapsed" data-bs-target="#consultations" data-bs-toggle="collapse">
            <i className="ri-first-aid-kit-line"></i><span>Investigations</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="consultations" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li>
              <Link to="/consultations" className="nav-link" onClick={() => onNavItemClick('consultations')}>
                <i className="bi bi-circle"></i><span>Consultations</span>
              </Link>
            </li>
            <li>
              <Link to="/predicted-diagnosis" className="nav-link" onClick={() => onNavItemClick('predicted-diagnosis')}>
                <i className="bi bi-circle"></i><span>Predicted Diagnosis</span>
              </Link>
            </li>
            <li>
              <Link to="/add-labtest" className="nav-link" onClick={() => onNavItemClick('add-labtest')}>
                <i className="bi bi-circle"></i><span>Add Laboratory Tests</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="nav-item">
          <Link className="nav-link collapsed" data-bs-target="#form-nav" data-bs-toggle="collapse">
            <i className="ri-capsule-fill"></i><span>Prescriptions</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="form-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li>
              <Link to="/prescriptions" className="nav-link" onClick={() => onNavItemClick('prescriptions')}>
                <i className="bi bi-circle"></i><span>Prescribe Meds</span>
              </Link>
            </li>
            <li>
              <Link to="/prescribe-test" className="nav-link" onClick={() => onNavItemClick('prescribe-test')}>
                <i className="bi bi-circle"></i><span>Prescribe Tests</span>
              </Link>
            </li>
            <li>
              <Link to="create-appointments" className="nav-link" onClick={() => onNavItemClick('create-appointments')}>
                <i className="bi bi-circle"></i><span>Drip/Blood & Go</span>
              </Link>
            </li>
            <li>
              <Link to="manage-appointments" className="nav-link" onClick={() => onNavItemClick('manage-appointments')}>
                <i className="bi bi-circle"></i><span>Operation Notes</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="nav-item">
          <Link className="nav-link collapsed" data-bs-target="#pharmacy" data-bs-toggle="collapse">
            <i className="ri-hospital-line"></i><span>Pharmacy</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="pharmacy" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li>
            <li className="nav-item">
              <Link to="/add-drug" onClick={() => onNavItemClick('add-drug')}>
                <i className="bi bi-circle"></i><span>Add Drug</span>
              </Link>
            </li>
              <Link to="/prescriptions" className="nav-link" onClick={() => onNavItemClick('prescriptions')}>
                <i className="bi bi-circle"></i><span>Prescriptions</span>
              </Link>
            </li>
            <li>
              <Link to="/waiting-list" className="nav-link" onClick={() => onNavItemClick('waiting-list')}>
                <i className="bi bi-circle"></i><span>Waiting List</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="nav-item">
          <Link className="nav-link collapsed" data-bs-target="#accountant" data-bs-toggle="collapse">
            <i className="bi bi-cash-stack"></i><span>Accountant</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="accountant" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li>
              <Link to="accountant-overview" className="nav-link" onClick={() => onNavItemClick('accountant-overview')}>
                <i className="bi bi-circle"></i><span>Overview</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="receptionist-unpaid-debts" onClick={() => onNavItemClick('receptionist-unpaid-debts')}>
                <i className="bi bi-circle"></i><span>Receptionist Platform</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="pharmacist-unpaid-debts" onClick={() => onNavItemClick('pharmacist-unpaid-debts')}>
                <i className="bi bi-circle"></i><span>Pharmacist Platform</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="doctor-unpaid-debts" onClick={() => onNavItemClick('doctor-unpaid-debts')}>
                <i className="bi bi-circle"></i><span>Doctor Platform</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="nav-item">
          <Link className="nav-link collapsed" data-bs-target="#department" data-bs-toggle="collapse">
            <i className="bi bi-file-earmark-medical"></i><span>Other Services</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="department" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li>
              <Link to="add-departments" className="nav-link" onClick={() => onNavItemClick('add-departments')}>
                <i className="bi bi-circle"></i><span>Add Department</span>
              </Link>
              <Link to="register-admins" className="nav-link" onClick={() => onNavItemClick('register-admins')}>
                <i className="bi bi-circle"></i><span>Register Admin</span>
              </Link>
              <Link to="request-delete" className="nav-link" onClick={() => onNavItemClick('request-delete')}>
                <i className="bi bi-circle"></i><span>Request Messages</span>
              </Link>
            </li>
          </ul>
        </li>
      </ul>
    </aside>
  );
}
