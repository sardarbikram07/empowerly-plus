import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', department: '', designation: '' })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    if (!authUser?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/users/${authUser.id}`)
      setProfile(res.data)
      setFormData({
        name: res.data.name || '',
        department: res.data.department || '',
        designation: res.data.designation || '',
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user profile.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const res = await api.put(`/api/users/${authUser.id}`, formData)
      setProfile(res.data)
      setIsEditing(false)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading profile...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-400">View and manage your personal details</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-all shadow-md"
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Main card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {(profile?.name?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {profile?.role}
            </span>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg text-sm font-medium shadow-md"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Department</p>
              <p className="text-white mt-1">{profile?.department || '—'}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Designation</p>
              <p className="text-white mt-1">{profile?.designation || '—'}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Branch ID</p>
              <p className="text-white font-mono text-xs mt-1">{profile?.branchId || '—'}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Organization ID</p>
              <p className="text-white font-mono text-xs mt-1">{profile?.orgId || '—'}</p>
            </div>
          </div>
        )}

        {/* Leave Balances Section */}
        {profile?.leaveBalance && (
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-base font-semibold text-white mb-4">Leave Balances</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-xs text-slate-400 uppercase font-medium">Sick Leave</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{profile.leaveBalance.sick}</p>
                <p className="text-xs text-slate-500">days</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-xs text-slate-400 uppercase font-medium">Casual Leave</p>
                <p className="text-2xl font-bold text-sky-400 mt-1">{profile.leaveBalance.casual}</p>
                <p className="text-xs text-slate-500">days</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-xs text-slate-400 uppercase font-medium">Earned Leave</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{profile.leaveBalance.earned}</p>
                <p className="text-xs text-slate-500">days</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
