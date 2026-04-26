import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const readUserFromStorage = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const user = readUserFromStorage();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role?.toLowerCase?.() !== 'admin') {
    // If it's an admin page and the user is not an admin, send them home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
