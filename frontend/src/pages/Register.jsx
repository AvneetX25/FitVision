// Register.jsx — Name + email + password registration form
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { setAuthToken } from '../services/api';
import api from '../services/api';

export default function Register() {
  const { login, logout, user, token } = useAuth()  // for auth
  const { workoutState, dispatch } = useApp()         // for workout state
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      /// Step 1: Register the user
      await api.post('/auth/register', {
        username: form.name,
        email: form.email,
        password: form.password,
      });

      // Step 2: Immediately log them in to get a token
      // FastAPI OAuth2 expects form-encoded data for /login
      // Step 2: Immediately log them in to get a token
      const loginRes = await api.post('/auth/login', {
       email: form.email,
       password: form.password,
      });
      

      const { access_token } = loginRes.data;
      setAuthToken(access_token);
      login(access_token, { email: form.email, name: form.name });

      navigate('/workout', { replace: true });
    } catch (err) {
      // FastAPI validation errors come back as err.response.data.detail
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        // Pydantic validation errors are an array of objects
        setError(detail[0]?.msg || 'Registration failed.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Alex Johnson', autocomplete: 'name' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autocomplete: 'email' },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', autocomplete: 'new-password' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 pt-16">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(14,165,233,0.08),transparent)] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-[0_0_60px_rgba(14,165,233,0.08)]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500 shadow-[0_0_24px_rgba(14,165,233,0.6)] mb-4">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white">Join FitVision</h1>
            <p className="text-slate-400 text-sm mt-1">Start your AI coaching journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {fields.map(({ name, label, type, placeholder, autocomplete }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  autoComplete={autocomplete}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all duration-200"
                />
              </div>
            ))}

            {/* Password strength hint */}
            {form.password.length > 0 && (
              <div className="flex gap-1 -mt-2">
                {[1, 2, 3, 4].map((lvl) => {
                  const strength = form.password.length >= lvl * 3 ? lvl : 0;
                  return (
                    <div
                      key={lvl}
                      className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{
                        background:
                          strength >= lvl
                            ? lvl <= 1 ? '#ef4444' : lvl <= 2 ? '#eab308' : lvl <= 3 ? '#22c55e' : '#38bdf8'
                            : '#334155',
                      }}
                    />
                  );
                })}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:shadow-[0_0_30px_rgba(14,165,233,0.7)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
