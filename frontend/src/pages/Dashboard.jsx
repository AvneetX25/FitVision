import React, { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts'
import { fetchAnalyticsSummary, fetchAnalyticsHistory, fetchSessionReps } from '../services/api'

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e']

// ── Shared tooltip style — matches dark slate background ──────────────────────
const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '13px',
  },
  labelStyle: { color: '#94a3b8' },
  cursor: { stroke: '#334155' },
}

// ── Summary stat card ─────────────────────────────────────────────────────────
function StatCard({ label, value, icon }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2 shadow-[0_0_30px_rgba(14,165,233,0.03)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-500">{label}</span>
        {icon && <span className="text-slate-600 text-lg">{icon}</span>}
      </div>
      <span className="text-3xl font-black text-sky-400">{value}</span>
    </div>
  )
}

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, children }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-5">{title}</h3>
      {children}
    </div>
  )
}

// ── Empty state inside a chart ────────────────────────────────────────────────
function ChartEmpty({ message }) {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <p className="text-slate-600 text-sm italic">{message}</p>
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary]       = useState(null)
  const [history, setHistory]       = useState([])
  const [repDetails, setRepDetails] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true)
        const [s, h] = await Promise.all([
          fetchAnalyticsSummary(),
          fetchAnalyticsHistory(7),
        ])
        setSummary(s)
        // Reverse so chart reads oldest → newest left to right
        setHistory([...h].reverse())

        if (h.length > 0) {
          const reps = await fetchSessionReps(h[0].session_id)
          setRepDetails(reps)
        }
      } catch {
        setError('Failed to load analytics. Complete at least one session first.')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  const exerciseBreakdown = React.useMemo(() => {
    const counts = {}
    history.forEach(s => { counts[s.exercise] = (counts[s.exercise] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [history])

  const chartData = history.map((s, i) => ({
    label: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    reps: s.total_reps,
    formScore: s.avg_form_score != null ? +(s.avg_form_score * 100).toFixed(1) : null,
  }))

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading analytics…</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pt-16 flex items-center justify-center">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-slate-300 font-semibold mb-1">No data yet</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your training progress at a glance</p>
        </div>

        {/* ── Summary cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Sessions"
            value={summary?.total_sessions ?? 0}
            icon="📅"
          />
          <StatCard
            label="Total Reps"
            value={summary?.total_reps ?? 0}
            icon="🔁"
          />
          <StatCard
            label="Avg Form Score"
            value={
              summary?.avg_form_score != null
                ? `${(summary.avg_form_score * 100).toFixed(0)}%`
                : '—'
            }
            icon="🎯"
          />
          <StatCard
            label="Top Exercise"
            value={summary?.best_exercise ?? '—'}
            icon="🏆"
          />
        </div>

        {/* ── Charts 2-col grid ─────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Chart 1 — Rep Trend */}
          <ChartCard title="Rep Trend — Last 7 Sessions">
            {chartData.length === 0
              ? <ChartEmpty message="No completed sessions yet." />
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={v => [v, 'Reps']} />
                    <Line
                      type="monotone" dataKey="reps" stroke="#6366f1"
                      strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#818cf8' }} name="Reps"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
          </ChartCard>

          {/* Chart 2 — Form Score Trend */}
          <ChartCard title="Form Score Trend (%)">
            {chartData.length === 0
              ? <ChartEmpty message="No completed sessions yet." />
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Form Score']} />
                    <Line
                      type="monotone" dataKey="formScore" stroke="#22d3ee"
                      strokeWidth={2.5} dot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#67e8f9' }} name="Form Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
          </ChartCard>

          {/* Chart 3 — Exercise Breakdown */}
          <ChartCard title="Exercise Breakdown">
            {exerciseBreakdown.length === 0
              ? <ChartEmpty message="No session data yet." />
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={exerciseBreakdown}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {exerciseBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      formatter={v => (
                        <span style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'capitalize' }}>{v}</span>
                      )}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value, name) => [
                        `${value} session${value !== 1 ? 's' : ''}`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
          </ChartCard>

          {/* Chart 4 — Rep Quality Heatmap */}
          <ChartCard title="Rep Quality — Most Recent Session">
            {repDetails.length === 0
              ? <ChartEmpty message="No rep data for the latest session." />
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={repDetails} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="rep_number"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false} tickLine={false}
                      label={{ value: 'Rep #', position: 'insideBottom', offset: -2, fill: '#475569', fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={v => [`${(v * 100).toFixed(0)}%`, 'Form Score']}
                    />
                    <Bar dataKey="form_score" name="Form Score" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {repDetails.map((rep, i) => (
                        <Cell
                          key={i}
                          fill={
                            rep.form_score >= 0.8 ? '#10b981' :
                            rep.form_score >= 0.5 ? '#f59e0b' : '#f43f5e'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
          </ChartCard>

        </div>

        {/* ── Legend for rep quality colours ───────────────────────────────── */}
        <div className="mt-4 flex items-center gap-5 px-1">
          <span className="text-xs text-slate-600 uppercase tracking-widest">Form quality</span>
          {[
            { color: 'bg-emerald-500', label: 'Good  ≥80%' },
            { color: 'bg-amber-500',   label: 'Fair  ≥50%' },
            { color: 'bg-rose-500',    label: 'Poor  <50%' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
