import React from "react";
import { Link } from "react-router-dom";
import { useAuth, refreshToken } from '../../components/containers/Context';

export default function NavDoctor({ onNavItemClick }) {
  const { currentUser, authData } = useAuth();
  const userDepartment = currentUser?.department;
  console.log('User Department:', userDepartment);

  return (
    <aside className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">
        {userDepartment === "Laboratory Scientist" || userDepartment === "Radiologist" ? (
          <>
            <li className="nav-item">
              <Link to='/dashboard' className="nav-link" onClick={() => onNavItemClick('dashboard')}>
                <i className="bi bi-grid"></i><span>Dashboard</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link collapsed" data-bs-target="#components-nav" data-bs-toggle="collapse">
                <i className="bi bi-prescription2"></i><span>Appointments</span><i className="bi bi-chevron-down ms-auto"></i>
              </Link>
              <ul id="components-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
                <li className="nav-item">
                  <Link to="/doctor-queue" onClick={() => onNavItemClick('doctor-queue')}>
                    <i className="bi bi-circle"></i><span>Queue</span>
                  </Link>
                </li>
              </ul>
            </li>

            <li className="nav-item">
              <Link className="nav-link collapsed" data-bs-target="#forms-nav" data-bs-toggle="collapse">
                <i className="ri-first-aid-kit-line"></i><span>Investigations</span><i className="bi bi-chevron-down ms-auto"></i>
              </Link>
              <ul id="forms-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
                <li>
                  <Link to="/predicted-diagnosis" className="nav-link" onClick={() => onNavItemClick('predicted-diagnosis')}>
                    <i className="bi bi-circle"></i><span>Predicted Diagnosis</span>
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
              <Link className="nav-link collapsed" data-bs-target="#test-nav" data-bs-toggle="collapse">
                <i className="ri-first-aid-kit-line"></i><span>Laboratory Test</span><i className="bi bi-chevron-down ms-auto"></i>
              </Link>
              <ul id="test-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
                <li>
                  <Link to="/add-labtest" className="nav-link" onClick={() => onNavItemClick('add-labtest')}>
                    <i className="bi bi-circle"></i><span>Add Tests</span>
                  </Link>
                </li>
              </ul>
            </li>
          </>
        ) : (
          <>
            <li className="nav-item">
              <Link to='/dashboard' className="nav-link" onClick={() => onNavItemClick('dashboard')}>
                <i className="bi bi-grid"></i><span>Dashboard</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link collapsed" data-bs-target="#components-nav" data-bs-toggle="collapse">
                <i className="bi bi-prescription2"></i><span>Appointments</span><i className="bi bi-chevron-down ms-auto"></i>
              </Link>
              <ul id="components-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
                <li className="nav-item">
                  <Link to="/doctor-queue" onClick={() => onNavItemClick('doctor-queue')}>
                    <i className="bi bi-circle"></i><span>Queue</span>
                  </Link>
                </li>
              </ul>
            </li>

            <li className="nav-item">
              <Link className="nav-link collapsed" data-bs-target="#forms-nav" data-bs-toggle="collapse">
                <i className="ri-first-aid-kit-line"></i><span>Investigations</span><i className="bi bi-chevron-down ms-auto"></i>
              </Link>
              <ul id="forms-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
                <li>
                  <Link to="/consultations" className="nav-link" onClick={() => onNavItemClick('consultations')}>
                    <i className="bi bi-circle"></i><span>Consultations</span>
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
              <Link className="nav-link collapsed" data-bs-target="#form-nav" data-bs-toggle="collapse">
                <i className="ri-capsule-fill"></i><span>Medications</span><i className="bi bi-chevron-down ms-auto"></i>
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
              </ul>
            </li>
          </>
        )}
      </ul>
    </aside>
  );
}