import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'ADMIN'

  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    branchId: '',
    department: '',
    designation: '',
    baseSalary: 0,
    active: true,
  })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
    if (isAdmin) {
      fetchBranches()
    }
  }, [isAdmin])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/users')
      setUsers(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchBranches() {
    try {
      const res = await api.get('/api/branches')
      setBranches(res.data)
    } catch (err) {
      console.error('Failed to load branches for selector:', err)
    }
  }

  function handleOpenCreate() {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      branchId: isAdmin ? (branches[0]?.id || '') : currentUser?.branchId,
      department: '',
      designation: '',
      baseSalary: 0,
      active: true,
    })
    setFormError(null)
    setShowModal(true)
  }

  function handleOpenEdit(u) {
    setEditingUser(u)
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '', // optional on update
      role: u.role || 'EMPLOYEE',
      branchId: u.branchId || '',
      department: u.department || '',
      designation: u.designation || '',
      baseSalary: u.baseSalary || 0,
      active: u.active ?? true,
    })
    setFormError(null)
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      if (editingUser) {
        // Update
        const payload = {
          name: formData.name,
          email: formData.email,
          department: formData.department,
          designation: formData.designation,
          baseSalary: Number(formData.baseSalary),
          active: formData.active,
        }
        if (formData.password) payload.password = formData.password
        if (isAdmin) {
          payload.role = formData.role
          payload.branchId = formData.branchId
        }

        const res = await api.put(`/api/users/${editingUser.id}`, payload)
        setUsers(prev => prev.map(u => (u.id === editingUser.id ? res.data : u)))
      } else {
        // Create
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department,
          designation: formData.designation,
          baseSalary: Number(formData.baseSalary),
        }
        if (isAdmin && formData.branchId) {
          payload.branchId = formData.branchId
        }

        const res = await api.post('/api/users', payload)
        setUsers(prev => [...prev, res.data])
      }
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save user.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  )

  const getBranchName = (bId) => {
    const found = branches.find(b => b.id === bId)
    return found ? `${found.name} (${found.location})` : bId
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users</h1>
          <p className="text-sm text-slate-400">
            {isAdmin ? 'Manage organization-wide users' : 'Manage branch users'}
          </p>
        </div>
        <button
          id="create-user-btn"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-all shadow-md shadow-indigo-500/20"
        >
          + Add User
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center">
        <input
          id="user-search"
          type="text"
          placeholder="Search users by name, email, department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Department / Designation</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : u.role === 'HR'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {isAdmin ? getBranchName(u.branchId) : u.branchId}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      <div>{u.department || '—'}</div>
                      <div className="text-slate-400">{u.designation || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        u.active ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${u.active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8">
            <h2 className="text-xl font-bold text-white">
              {editingUser ? 'Edit User' : 'Create User'}
            </h2>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Password {editingUser && '(leave blank to keep unchanged)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                  {isAdmin ? (
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="HR">HR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="HR">HR</option>
                    </select>
                  )}
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Branch</label>
                    <select
                      value={formData.branchId}
                      onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.location})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. Engineering"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Base Salary</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.baseSalary}
                    onChange={e => setFormData({ ...formData, baseSalary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {editingUser && (
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      Account Active
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg font-medium text-sm shadow-md"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
