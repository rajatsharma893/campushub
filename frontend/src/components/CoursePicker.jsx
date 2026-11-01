import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

// Course chunne ka dropdown. Faculty ko sirf uske apne courses dikhte hain.
export default function CoursePicker({ value, onChange }) {
  const { user } = useAuth()
  const isFaculty = user.role === 'FACULTY'
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState('')
  const [facultyId, setFacultyId] = useState(null)
  const [ready, setReady] = useState(!isFaculty)

  useEffect(() => {
    if (!isFaculty) return
    api
      .get('/faculty', { params: { search: user.email } })
      .then((res) => {
        const me = res.data.data.find((f) => f.user.email === user.email)
        setFacultyId(me ? me.id : null)
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [isFaculty, user.email])

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      const params = { limit: 100, search }
      if (isFaculty) params.facultyId = facultyId || 0
      api
        .get('/courses', { params })
        .then((res) => setCourses(res.data.data))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [ready, search, facultyId, isFaculty])

  return (
    <div className="flex flex-wrap gap-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search course code or name..."
        className="border rounded px-3 py-2 text-sm w-60 bg-white"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-3 py-2 text-sm bg-white w-72"
      >
        <option value="">Select a course</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} - {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
