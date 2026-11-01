import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const isStaff = user.role === 'ADMIN' || user.role === 'FACULTY'
  const [notices, setNotices] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/notices?limit=5').then((res) => setNotices(res.data.data)).catch(() => {})

    if (!isStaff) return
    Promise.all([
      api.get('/students', { params: { limit: 1 } }),
      api.get('/faculty', { params: { limit: 1 } }),
      api.get('/courses', { params: { limit: 1 } }),
      api.get('/departments'),
    ])
      .then(([s, f, c, d]) =>
        setStats({
          students: s.data.pagination.total,
          faculty: f.data.pagination.total,
          courses: c.data.pagination.total,
          departments: d.data.length,
        })
      )
      .catch(() => {})
  }, [isStaff])

  const cards = stats
    ? [
        { label: 'Students', value: stats.students, color: 'bg-blue-600' },
        { label: 'Faculty', value: stats.faculty, color: 'bg-green-600' },
        { label: 'Courses', value: stats.courses, color: 'bg-purple-600' },
        { label: 'Departments', value: stats.departments, color: 'bg-orange-500' },
      ]
    : []

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">Welcome, {user.name}</h2>

      {isStaff && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {cards.map((c) => (
            <div key={c.label} className={`${c.color} text-white rounded-xl shadow p-4`}>
              <p className="text-sm opacity-90">{c.label}</p>
              <p className="text-3xl font-bold">{c.value}</p>
            </div>
          ))}
          {!stats && <p className="text-gray-500 text-sm">Loading stats...</p>}
        </div>
      )}

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
    </div>
  )
}
