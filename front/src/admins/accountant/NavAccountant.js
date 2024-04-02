import React from "react";
import { Link } from "react-router-dom";

export default function NavPharmacist({ onNavItemClick }) {

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
            <i className="ri-medicine-bottle-line"></i><span>Payments</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="components-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li className="nav-item">
              <Link to="receptionist-unpaid-debts" onClick={() => onNavItemClick('receptionist-unpaid-debts')}>
                <i className="bi bi-circle"></i><span>Receptionist Platform</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="debts" className="nav-link" onClick={() => onNavItemClick('debts')}>
                <i className="bi bi-circle"></i><span>Nurse Platform</span>
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
          <Link to='/reports' className="nav-link" onClick={() => onNavItemClick('reports')}>
            <i className="bi bi-grid"></i><span>Reports</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
}
