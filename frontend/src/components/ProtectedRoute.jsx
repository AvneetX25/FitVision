// ProtectedRoute.jsx — Redirects to /login if user is not authenticated
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { login, logout, user, token } = useAuth()  // for auth
  const { workoutState, dispatch } = useApp()         // for workout state
  const location = useLocation();

  
  if (!token) return <Navigate to="/login" replace />

  return children;
}
