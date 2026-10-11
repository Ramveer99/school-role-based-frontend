import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import AddTeacher from './pages/AddTeacher';
import Parents from './pages/Parents';
import AddParent from './pages/AddParent';
import NewAdmission from './pages/NewAdmission';
import Classes from './pages/Classes';
import Attendance from './pages/Attendance';
import Exams from './pages/Exams';
import AddExam from './pages/AddExam';
import Results from './pages/Results';
import Fees from './pages/Fees';
import Payment from './pages/Payment';
import Notices from './pages/Notices';
import Timetable from './pages/Timetable';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Organizations from './pages/Organizations';
import OrganizationStudents from './pages/OrganizationStudents';
import DefaultPassword from './pages/DefaultPassword';
import GenericPage from './pages/GenericPage';
export default function App() {
    return (<Routes>
      <Route path="/login" element={<Login />}/>
      <Route path="/forgot-password" element={<ForgotPassword />}/>
      <Route path="/reset-password" element={<ResetPassword />}/>
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
        <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/organizations" element={<Organizations />}/>
        <Route path="/organizations/:organizationId/students" element={<OrganizationStudents />}/>
        <Route path="/organizations/:organizationId/teachers" element={<OrganizationStudents />}/>
        <Route path="/organizations/:organizationId/payment" element={<OrganizationStudents />}/>
        <Route path="/organizations/:organizationId/parents" element={<OrganizationStudents />}/>
        <Route path="/default-password" element={<DefaultPassword />}/>
        <Route path="/students" element={<Students />}/>
        <Route path="/students/new" element={<NewAdmission />}/>
        <Route path="/teachers" element={<Teachers />}/>
        <Route path="/teachers/new" element={<AddTeacher />}/>
        <Route path="/parents" element={<Parents />}/>
        <Route path="/parents/new" element={<AddParent />}/>
        <Route path="/classes" element={<Classes />}/>
        <Route path="/attendance" element={<Attendance />}/>
        <Route path="/exams" element={<Exams />}/>
        <Route path="/exams/new" element={<AddExam />}/>
        <Route path="/results" element={<Results />}/>
        <Route path="/fees" element={<Fees />}/>
        <Route path="/payment" element={<Payment />}/>
        <Route path="/notices" element={<Notices />}/>
        <Route path="/timetable" element={<Timetable />}/>
        <Route path="/profile" element={<Profile />}/>
        <Route path="/settings" element={<Settings />}/>
        <Route path=":slug" element={<GenericPage />}/>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>);
}
