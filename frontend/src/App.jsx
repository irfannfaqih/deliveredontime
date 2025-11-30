import React, { Suspense } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAPI';
import Login from './pages/Login';
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Delivered = React.lazy(() => import('./pages/Delivered'));
const DeliveredInput = React.lazy(() => import('./pages/DeliveredInput'));
const Bbm = React.lazy(() => import('./pages/Bbm'));
const BbmInput = React.lazy(() => import('./pages/BbmInput'));
const Report = React.lazy(() => import('./pages/Report'));
const ReportDetail = React.lazy(() => import('./pages/ReportDetail'));
const Customer = React.lazy(() => import('./pages/Customer'));
const CustomerInput = React.lazy(() => import('./pages/CustomerInput'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Management = React.lazy(() => import('./pages/Management'));
const InputUser = React.lazy(() => import('./pages/InputUser'));
const ErrorPage = React.lazy(() => import('./pages/ErrorPage'));

function App() {
  const RequireAuth = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const hasToken = !!localStorage.getItem('access_token');
    if (!hasToken) return <Navigate to="/login" replace />;
    if (isLoading) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/delivered" element={<RequireAuth><Delivered /></RequireAuth>} />
          <Route path="/delivered/input" element={<RequireAuth><DeliveredInput /></RequireAuth>} />
          <Route path="/bbm" element={<RequireAuth><Bbm /></RequireAuth>} />
          <Route path="/bbm/input" element={<RequireAuth><BbmInput /></RequireAuth>} />
          <Route path="/report" element={<RequireAuth><Report /></RequireAuth>} />
          <Route path="/report/detail/:date" element={<RequireAuth><ReportDetail /></RequireAuth>} />
          <Route path="/customer" element={<RequireAuth><Customer /></RequireAuth>} />
          <Route path="/customer/input" element={<RequireAuth><CustomerInput /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/management" element={<RequireAuth><Management /></RequireAuth>} />
          <Route path="/management/input" element={<RequireAuth><InputUser /></RequireAuth>} />
          <Route path="/404" element={<ErrorPage />} />
          <Route path="*" element={<ErrorPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
