import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Header from '../components/majors/header/Header';
import Footer from '../components/majors/footer/Footer';
import { useAuth } from '../components/containers/Context'; // Adjust the path as needed

// Admin Body Content
import BodyReceptionist from '../admins/receptionist/BodyReceptionist';
// import BodyNurse from '../admins/nurse/BodyNurse';
import BodyPharmacist from '../admins/pharmacist/BodyPharmacist';
import BodySuperAdmin from '../admins/superadmin/BodySuperAdmin';
import BodyDoctor from '../admins/doctor/BodyDoctor';
import BodyAccountant from '../admins/accountant/BodyAccountant';

// Pages
import RegisterPatient from '../pages/patient/RegisterPatient';
import ManagePatient from '../pages/patient/ManagePatient';
import AddFamily from '../pages/patient/AddFamily';
import BioData from '../pages/patient/BioData';
import CreateAppointment from '../pages/appointment/CreateAppointment';
import ManageAppointment from '../pages/appointment/ManageAppointment';
import Queue from '../pages/appointment/Queue';
import AddDepartment from '../pages/patient/AddDepartment';
import ReceptionistDebt from '../pages/billings/ReceptionistDebt';
import PharmacistDebt from '../pages/billings/PharmacistDebt';
import AddDrug from '../pages/pharmacy/AddDrug';
import WaitingList from '../pages/pharmacy/WaitingList';
import Register from '../pages/profile/Register';
import Profile from '../pages/profile/Profile';
import DoctorsQueue from '../pages/doctors/DoctorsQueue';
import PrescribeMeds from '../pages/doctors/PrescribeMeds';
import Consultations from '../pages/doctors/Consultations';
import ViewRecords from '../pages/doctors/ViewRecords';
import PharmacistUnpaidDebts from '../pages/accountants/debts/PharmacistUnpaidDebts';
import ReceptionistUnpaidDebts from '../pages/accountants/debts/ReceptionistUnpaidDebts';
import ReceptionistInvoice from '../pages/accountants/invoice/ReceptionistInvoice';
import PharmacistInvoice from '../pages/accountants/invoice/PharmacistInvoice';
import Reports from '../pages/accountants/Reports';
import AddLabTest from '../pages/laboratory/AddLabTest';
import PrescibeTest from '../pages/doctors/PrescribeTest';
import DoctorUnpaidDebts from '../pages/accountants/debts/DoctorUnpaidDebts';
import DoctorInvoice from '../pages/accountants/invoice/DoctorInvoice';
import PredictedDiagnosis from '../pages/doctors/PredictedDiagnosis';
import ManageReceptionist from '../pages/admins/ManageReceptionist';
import ManageDoctor from '../pages/admins/ManageDoctor';
import ManageAccountant from '../pages/admins/ManageAccountant';
import ManagePharmacist from '../pages/admins/ManagePharmacist';
import BodyNurse from '../admins/nurse/BodyNurse';
import RequestDelete from '../pages/other/RequestDelete';
import AccountantOverview from '../pages/accountants/AccountantOverview';
import ManageNurse from '../pages/admins/ManageNurse';

const AppRoutes = () => {
  const { isLoggedIn, currentUser } = useAuth();

  if (!isLoggedIn) {
    // Redirect to login page if not logged in
    return <Navigate to="/login" />;
  }

  const adminType = currentUser?.adminType;

  return (
    <>
      <Header title={`Welcome, ${currentUser?.firstname}`} />
      <Routes>
        <Route path="/" element={getAdminComponent(adminType)} />
        <Route path="/dashboard" element={getAdminComponent(adminType)} />
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/manage-patient" element={<ManagePatient />} />
        <Route path="/add-family" element={<AddFamily />} />
        <Route path="/bio-data" element={<BioData />} />
        <Route path="/add-departments" element={<AddDepartment />} />
        <Route path="/check-queue" element={<Queue />} />
        <Route path="/create-appointments" element={<CreateAppointment />} />
        <Route path="/manage-appointments" element={<ManageAppointment />} />
        <Route path="/register-admins" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/receptionist-debts" element={<ReceptionistDebt />} />
        <Route path="/pharmacist-debts" element={<PharmacistDebt />} />
        <Route path="/add-drug" element={<AddDrug />} />
        <Route path="/waiting-list" element={<WaitingList />} />
        <Route path="/prescriptions" element={<PrescribeMeds />} />
        <Route path="/consultations" element={<Consultations />} />
        <Route path="/doctor-queue" element={<DoctorsQueue />} />
        <Route path="/view-records" element={<ViewRecords />} />
        <Route path="/receptionist-unpaid-debts" element={<ReceptionistUnpaidDebts />} />
        <Route path="/pharmacist-unpaid-debts" element={<PharmacistUnpaidDebts />} />
        <Route path="/receptionist-invoice/:bookingId" element={<ReceptionistInvoice />} />
        <Route path="/pharmacist-invoice/:paymentId" element={<PharmacistInvoice />} />
        <Route path="/doctor-invoice/:paymentId" element={<DoctorInvoice />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/doctor-unpaid-debts" element={<DoctorUnpaidDebts />} />
        <Route path="/prescribe-test" element={<PrescibeTest />} />
        <Route path="/predicted-diagnosis" element={<PredictedDiagnosis />} />
        <Route path="/add-labtest" element={<AddLabTest />} />
        <Route path="/manage-receptionist" element={<ManageReceptionist />} />
        <Route path="/manage-doctor" element={<ManageDoctor />} />
        <Route path="/manage-accountant" element={<ManageAccountant />} />
        <Route path="/manage-pharmacist" element={<ManagePharmacist />} />
        <Route path="/manage-nurse" element={<ManageNurse />} />
        <Route path="/request-delete" element={<RequestDelete />} />
        <Route path="/accountant-overview" element={<AccountantOverview />} />

      </Routes>
      <Footer />
    </>
  );
};

const getAdminComponent = (adminType) => {
  switch (adminType) {
    case 'Receptionist':
      return <BodyReceptionist />;
    case 'Pharmacist':
      return <BodyPharmacist />;
    case 'Doctor':
      return <BodyDoctor />;
    case 'Accountant':
      return <BodyAccountant />;
    case 'SuperAdmin':
      return <BodySuperAdmin />;
    case 'Nurse':
      return <BodyNurse />;
    default:
      return null;
  }
};

export default AppRoutes;
