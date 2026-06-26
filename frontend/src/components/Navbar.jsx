import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV_LINKS = [
  { to: '/',            label: 'Home' },
  { to: '/workout',     label: 'Sessions',    protected: true },
  { to: '/dashboard',   label: 'Dashboard',   protected: true },
  { to: '/leaderboard', label: 'Leaderboard', protected: true },
];

export default function Navbar() {
  const { user, logout } = useApp();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-sky-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center shadow-[0_0_16px_rgba(14,165,233,0.6)] group-hover:shadow-[0_0_24px_rgba(14,165,233,0.9)] transition-all duration-300">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-black text-lg tracking-tight text-white">
              FIT<span className="text-sky-400">VISION</span>
            </span>
          </Link>

          {/* ── Desktop links ── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, protected: prot }) => {
              const active      = location.pathname === to;
              // A protected link while logged out — still rendered, ProtectedRoute handles redirect
              const lockedOut   = prot && !user;

              return (
                <Link
                  key={to}
                  to={to}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                    ${active
                      ? 'bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                      : lockedOut
                        ? 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }
                  `}
                >
                  {label}
                  {/* tiny lock dot for logged-out protected links */}
                  {lockedOut && (
                    <span className="ml-1.5 inline-block w-1 h-1 rounded-full bg-slate-600 align-middle" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Auth area ── */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-slate-400">
                  Hey, <span className="text-sky-400 font-semibold">{user.username || user.name || user.email}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-700 text-slate-300 hover:border-sky-500 hover:text-white transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-sky-500 text-white hover:bg-sky-400 shadow-[0_0_16px_rgba(14,165,233,0.4)] hover:shadow-[0_0_24px_rgba(14,165,233,0.7)] transition-all duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile menu toggle ── */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="md:hidden bg-slate-950/95 border-t border-slate-800 px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ to, label, protected: prot }) => {
            const active    = location.pathname === to;
            const lockedOut = prot && !user;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold
                  ${active
                    ? 'bg-sky-500/20 text-sky-300'
                    : lockedOut
                      ? 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
              >
                <span>{label}</span>
                {lockedOut && (
                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-800">
            {user ? (
              <>
                <p className="px-4 py-2 text-xs text-slate-500">
                  Signed in as <span className="text-sky-400 font-semibold">{user.username || user.name || user.email}</span>
                </p>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white text-left rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 px-4 py-2.5 text-center text-sm font-semibold text-slate-300 border border-slate-700 rounded-lg hover:border-sky-500 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 px-4 py-2.5 text-center text-sm font-bold bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
