import React, { useEffect, useState, useCallback } from 'react'
import { fetchWeeklyLeaderboard } from '../services/api'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// ── Rank badge for positions > 3 ─────────────────────────────────────────────
function RankBadge({ rank }) {
  if (MEDALS[rank]) {
    return <span className="text-xl leading-none">{MEDALS[rank]}</span>
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700">
      {rank}
    </span>
  )
}

export default function Leaderboard() {
  const [entries, setEntries]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [error, setError]             = useState(null)

  // Get current logged-in username from sessionStorage
  const currentUser     = JSON.parse(sessionStorage.getItem('gym_user') || 'null')
  const currentUsername = currentUser?.username || currentUser?.email || null

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await fetchWeeklyLeaderboard()
      setEntries(data)
      setLastRefresh(new Date())
      setError(null)
    } catch {
      setError('Failed to load leaderboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeaderboard()
    const interval = setInterval(loadLeaderboard, 60_000)
    return () => clearInterval(interval)
  }, [loadLeaderboard])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading leaderboard…</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pt-16 flex items-center justify-center">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 max-w-md text-center">
          <p className="text-slate-300 font-semibold mb-1">Couldn't load leaderboard</p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-16">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Weekly Leaderboard</h1>
            <p className="text-slate-400 text-sm mt-0.5">Top 10 athletes this week</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">Live</span>
            </div>
            {lastRefresh && (
              <span className="text-xs text-slate-600">
                Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {entries.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-slate-300 font-semibold mb-1">No entries yet this week</p>
            <p className="text-slate-500 text-sm">Complete a workout session to appear on the leaderboard.</p>
          </div>
        ) : (
          <>
            {/* ── Top 3 podium cards ───────────────────────────────────────── */}
            {entries.slice(0, 3).length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {entries.slice(0, 3).map((entry) => {
                  const isMe = currentUsername &&
                    entry.username.toLowerCase() === currentUsername.toLowerCase()
                  return (
                    <div
                      key={entry.rank}
                      className={`rounded-2xl border p-4 text-center transition-all ${
                        isMe
                          ? 'bg-indigo-950/60 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="text-2xl mb-1">{MEDALS[entry.rank]}</div>
                      <div className="text-sm font-bold text-white truncate">
                        {entry.username}
                        {isMe && <span className="ml-1 text-indigo-400 text-xs">(you)</span>}
                      </div>
                      <div className="text-xl font-black text-sky-400 mt-1">
                        {entry.weekly_reps}
                        <span className="text-xs font-normal text-slate-500 ml-1">reps</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {entry.avg_form != null
                          ? `${(entry.avg_form * 100).toFixed(0)}% form`
                          : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Full table (all 10) ───────────────────────────────────────── */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[3rem_1fr_6rem_6rem] gap-2 px-5 py-3 border-b border-slate-800">
                {['Rank', 'Athlete', 'Reps', 'Avg Form'].map(h => (
                  <span key={h} className="text-xs font-semibold tracking-widest uppercase text-slate-500">{h}</span>
                ))}
              </div>

              {/* Rows */}
              {entries.map((entry) => {
                const isMe = currentUsername &&
                  entry.username.toLowerCase() === currentUsername.toLowerCase()
                return (
                  <div
                    key={entry.rank}
                    className={`grid grid-cols-[3rem_1fr_6rem_6rem] gap-2 items-center px-5 py-3.5 border-b border-slate-800/60 last:border-0 transition-colors ${
                      isMe
                        ? 'bg-indigo-950/40'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Rank */}
                    <div>
                      <RankBadge rank={entry.rank} />
                    </div>

                    {/* Username */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-semibold truncate text-sm ${isMe ? 'text-indigo-300' : 'text-slate-200'}`}>
                        {entry.username}
                      </span>
                      {isMe && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                          you
                        </span>
                      )}
                    </div>

                    {/* Reps */}
                    <div className="font-bold text-sky-400 text-sm">
                      {entry.weekly_reps}
                    </div>

                    {/* Form */}
                    <div className="text-sm text-slate-400">
                      {entry.avg_form != null
                        ? `${(entry.avg_form * 100).toFixed(0)}%`
                        : <span className="text-slate-600">—</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Refresh hint ─────────────────────────────────────────────── */}
            <p className="text-center text-xs text-slate-700 mt-4">
              Leaderboard refreshes automatically every 60 seconds
            </p>
          </>
        )}
      </div>
    </div>
  )
}