import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import BranchesPage from './pages/BranchesPage'
import UsersPage from './pages/UsersPage'
import ProfilePage from './pages/ProfilePage'

function DefaultRedirect() {
  const { user } = useAuth()
  if (user?.role === 'ADMIN') return <Navigate to="/branches" replace />
  if (user?.role === 'HR') return <Navigate to="/users" replace />
  return <Navigate to="/profile" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DefaultRedirect />} />

              {/* ADMIN only */}
              <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                <Route path="/branches" element={<BranchesPage />} />
              </Route>

              {/* ADMIN and HR */}
              <Route element={<ProtectedRoute roles={['ADMIN', 'HR']} />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>

              {/* All roles */}
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
