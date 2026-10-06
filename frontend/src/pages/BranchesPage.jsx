import React, { useState, useEffect } from 'react'
import api from '../api/axios'

export default function BranchesPage() {
  const [branches, setBranches] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [formData, setFormData] = useState({ name: '', location: '' })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  async function fetchBranches() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/branches')
      setBranches(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load branches.')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenCreate() {
    setEditingBranch(null)
    setFormData({ name: '', location: '' })
    setFormError(null)
    setShowModal(true)
  }

  function handleOpenEdit(branch) {
    setEditingBranch(branch)
    setFormData({ name: branch.name, location: branch.location })
    setFormError(null)
    setShowModal(true)
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this branch?')) return
    try {
      await api.delete(`/api/branches/${id}`)
      setBranches(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete branch.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      if (editingBranch) {
        const res = await api.put(`/api/branches/${editingBranch.id}`, formData)
        setBranches(prev => prev.map(b => (b.id === editingBranch.id ? res.data : b)))
      } else {
        const res = await api.post('/api/branches', formData)
        setBranches(prev => [...prev, res.data])
      }
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save branch.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredBranches = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Branches</h1>
          <p className="text-sm text-slate-400">Manage organization branch locations</p>
        </div>
        <button
          id="create-branch-btn"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-all shadow-md shadow-indigo-500/20"
        >
          + Add Branch
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center">
        <input
          id="branch-search"
          type="text"
          placeholder="Search branches by name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading branches...</div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No branches found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Branch Name</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Branch ID</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBranches.map(branch => (
                  <tr key={branch.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{branch.name}</td>
                    <td className="px-6 py-4 text-slate-300">{branch.location}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{branch.id}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => handleOpenEdit(branch)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="text-red-400 hover:text-red-300 font-medium"
                      >
                        Delete
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-white">
              {editingBranch ? 'Edit Branch' : 'Create Branch'}
            </h2>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. North Branch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Delhi"
                />
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
                  {submitting ? 'Saving...' : editingBranch ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
