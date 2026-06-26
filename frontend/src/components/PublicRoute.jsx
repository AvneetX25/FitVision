import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PublicRoute({ children }) {
  const { token } = useAuth()
  if (token) return <Navigate to="/workout" replace />
  return children
}

