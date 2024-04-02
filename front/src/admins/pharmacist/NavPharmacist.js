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
            <i className="ri-medicine-bottle-line"></i><span>Medications</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="components-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li className="nav-item">
              <Link to="/add-drug" onClick={() => onNavItemClick('add-drug')}>
                <i className="bi bi-circle"></i><span>Add Drug</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="nav-item">
          <Link className="nav-link collapsed" data-bs-target="#forms-nav" data-bs-toggle="collapse">
            <i className="ri-capsule-fill"></i><span>Provide Medications</span><i className="bi bi-chevron-down ms-auto"></i>
          </Link>
          <ul id="forms-nav" className="nav-content collapse " data-bs-parent="#sidebar-nav">
            <li>
              <Link to="/waiting-list" className="nav-link" onClick={() => onNavItemClick('waiting-list')}>
                <i className="bi bi-circle"></i><span>Waiting List</span>
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
              <Link to="pharmacist-debts" className="nav-link" onClick={() => onNavItemClick('pharmacist-debts')}>
                <i className="bi bi-circle"></i><span>Outstanding Debts</span>
              </Link>
            </li>
          </ul>
        </li>
      </ul>
    </aside>
  );
}
