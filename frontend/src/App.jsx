import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Bbm from './pages/Bbm';
import BbmInput from './pages/BbmInput';
import Customer from './pages/Customer';
import CustomerInput from './pages/CustomerInput';
import Dashboard from './pages/Dashboard';
import Delivered from './pages/Delivered';
import DeliveredInput from './pages/DeliveredInput';
import Login from './pages/Login';
import Report from './pages/Report';
import ReportDetail from './pages/ReportDetail';
import Settings from './pages/Settings';
import Management from './pages/Management';
import InputUser from './pages/InputUser';

function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/delivered" element={<Delivered />} />
        <Route path="/delivered/input" element={<DeliveredInput />} />
        <Route path="/bbm" element={<Bbm />} />
        <Route path="/bbm/input" element={<BbmInput />} />
        <Route path="/report" element={<Report />} />
        <Route path="/report/detail/:date" element={<ReportDetail />} />
        <Route path="/customer" element={<Customer />} />
        <Route path="/customer/input" element={<CustomerInput />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/management" element={<Management />} />
        <Route path="/management/input" element={<InputUser />} />
      </Routes>
    </Router>
  );
}

export default App;
