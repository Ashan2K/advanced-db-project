import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';


function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();


  if (!user) {
    
    return <Navigate to="/login" replace />;
  }

  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    
    return <Navigate to="/login" replace />; 
  }


  return <Outlet />;
}

export default ProtectedRoute;