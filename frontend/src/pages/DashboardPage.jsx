import React from 'react'

/**
 * Placeholder dashboard page.
 * Will be replaced with real analytics charts (Recharts) in a later task.
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-slate-400 text-sm">Welcome to Empowerly+. Select a module from the sidebar to get started.</p>

      {/* Stat cards placeholder */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Employees', 'Present Today', 'Pending Leaves', 'Payroll Cycles'].map((label, i) => (
          <div
            key={label}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm"
          >
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">—</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 text-center text-slate-500 text-sm">
        Analytics charts (Recharts) will be rendered here in the analytics task.
      </div>
    </div>
  )
}
