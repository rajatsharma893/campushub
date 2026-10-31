import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [notices, setNotices] = useState([])

  useEffect(() => {
    api.get('/notices?limit=5').then((res) => setNotices(res.data.data)).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-3 flex justify-between items-center">
        <span className="font-bold text-lg">College Portal</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.name} ({user.role})</span>
          <button onClick={logout} className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user.name}</h2>
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Latest Notices</h3>
          {notices.length === 0 && <p className="text-gray-500 text-sm">No notices yet.</p>}
          {notices.map((n) => (
            <div key={n.id} className="border-b last:border-0 py-2">
              <p className="font-medium">{n.title}</p>
              <p className="text-sm text-gray-600">{n.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}