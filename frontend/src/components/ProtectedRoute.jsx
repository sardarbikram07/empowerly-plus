import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protects routes that require authentication.
 * Unauthenticated users are redirected to /login.
 * Passes through role prop for future role-based guard (EMPLOYEE / HR / ADMIN).
 */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
