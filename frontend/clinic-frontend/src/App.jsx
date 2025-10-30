import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';



import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { user, logout } = useAuth();

  return (
    <>
      {user && (
        <nav style={{ padding: '10px', background: '#eee' }}>
          <span>Logged in as: {user.role}</span>
          <button onClick={logout} style={{ marginLeft: '20px' }}>Logout</button>
        </nav>
      )}

      <Routes>
     
        <Route path="/login" element={<LoginPage />} />


        <Route element={<ProtectedRoute allowedRoles={['Patient']} />}>
          <Route path="/patient" element={<PatientDashboard />} />
         
        </Route>

  
        <Route element={<ProtectedRoute allowedRoles={['Doctor']} />}>
          <Route path="/doctor" element={<DoctorDashboard />} />
    
        </Route>

   
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
      
        </Route>

  
        <Route path="/" element={<HomePage />} />
      </Routes>
    </>
  );
}


function HomePage() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (user.role === 'Patient') {
    return <Navigate to="/patient" />;
  }
  if (user.role === 'Doctor') {
    return <Navigate to="/doctor" />;
  }
  if (user.role === 'Admin') {
    return <Navigate to="/admin" />;
  }
  return <Navigate to="/login" />; // Fallback
}

export default App;
