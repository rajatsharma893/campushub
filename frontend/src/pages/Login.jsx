import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-1/2 bg-black text-white flex-col justify-between p-12 border-r-4 border-red-600">
        <div className="flex items-center gap-3">
          <Logo size={52} light />
          <span className="text-2xl font-bold tracking-tight">
            Campus<span className="text-red-500">Hub</span>
          </span>
        </div>
        <div>
          <div className="w-14 h-1 bg-red-600 mb-6" />
          <h2 className="text-4xl font-bold leading-tight mb-4">Everything your campus needs, in one hub.</h2>
          <p className="text-neutral-400 max-w-md">
            Students, faculty, attendance, marks and notices, all managed from one simple place.
          </p>
        </div>
        <p className="text-sm text-neutral-500">Created by Rajat Sharma</p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-100 px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg border-t-4 border-red-600">
          <div className="md:hidden flex justify-center mb-4">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
          <p className="text-gray-500 text-center mb-6">Sign in to CampusHub</p>

          {error && <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</div>}

          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        <p data-credit className="text-center text-xs text-gray-500 mt-6">
            Created by <span className="font-semibold text-gray-800">Rajat Sharma</span>
          </p>
        </form>
      </div>
    </div>
  )
}
