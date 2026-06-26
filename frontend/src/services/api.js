import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',  
})

const savedToken = sessionStorage.getItem('gym_token')
if (savedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('gym_token')
      sessionStorage.removeItem('gym_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const fetchAnalyticsSummary = () =>
  api.get('/analytics/summary').then(r => r.data)

export const fetchAnalyticsHistory = (limit = 7) =>
  api.get(`/analytics/history?limit=${limit}`).then(r => r.data)

export const fetchSessionReps = (sessionId) =>
  api.get(`/analytics/session/${sessionId}/reps`).then(r => r.data)

export const fetchWeeklyLeaderboard = () =>
  api.get('/leaderboard/weekly').then(r => r.data)

export default api