import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import CoursePicker from '../components/CoursePicker'

function StudentView() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/attendance/my')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load attendance'))
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-gray-500">Loading...</p>

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">My Attendance</h2>

      {data.overallPercentage === null ? (
        <p className="text-gray-500">No attendance has been marked yet.</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <p className="text-sm text-gray-500">Overall attendance</p>
            <p className="text-3xl font-bold">{data.overallPercentage}%</p>
            {data.lowAttendance && (
              <p className="mt-2 text-sm bg-red-100 text-red-700 p-2 rounded">
                Warning: your attendance is below 75%.
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Attended</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((c) => (
                  <tr key={c.course.id} className="border-t">
                    <td className="px-4 py-3">{c.course.code} - {c.course.name}</td>
                    <td className="px-4 py-3">{c.attended}</td>
                    <td className="px-4 py-3">{c.total}</td>
                    <td className={`px-4 py-3 font-medium ${c.lowAttendance ? 'text-red-600' : 'text-green-600'}`}>
                      {c.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function StaffView() {
  const [courseId, setCourseId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState([])
  const [statuses, setStatuses] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!courseId || !date) return
    setLoading(true)
    setMessage({ type: '', text: '' })
    api
      .get(`/attendance/course/${courseId}/students`, { params: { date } })
      .then((res) => {
        setStudents(res.data.students)
        const initial = {}
        res.data.students.forEach((s) => {
          initial[s.studentId] = s.status || 'PRESENT'
        })
        setStatuses(initial)
      })
      .catch((err) => {
        setStudents([])
        setMessage({ type: 'error', text: err.response?.data?.message || 'Could not load students' })
      })
      .finally(() => setLoading(false))
  }, [courseId, date])

  const markAll = (status) => {
    const all = {}
    students.forEach((s) => {
      all[s.studentId] = status
    })
    setStatuses(all)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const records = students.map((s) => ({ studentId: s.studentId, status: statuses[s.studentId] }))
      const { data } = await api.post('/attendance/mark', { courseId: Number(courseId), date, records })
      setMessage({ type: 'success', text: `${data.message} (${data.count} students)` })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <CoursePicker value={courseId} onChange={setCourseId} />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm bg-white"
        />
      </div>

      {message.text && (
        <div className={`text-sm p-2 rounded mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {!courseId && <p className="text-gray-500 text-sm">Select a course to begin.</p>}
      {loading && <p className="text-gray-500 text-sm">Loading...</p>}

      {courseId && !loading && students.length > 0 && (
        <>
          <div className="flex gap-3 mb-3 text-sm">
            <button onClick={() => markAll('PRESENT')} className="px-3 py-1 border rounded bg-white">All present</button>
            <button onClick={() => markAll('ABSENT')} className="px-3 py-1 border rounded bg-white">All absent</button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentId} className="border-t">
                    <td className="px-4 py-3">{s.rollNumber}</td>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3 space-x-4">
                      {['PRESENT', 'ABSENT', 'LATE'].map((st) => (
                        <label key={st} className="inline-flex items-center gap-1">
                          <input
                            type="radio"
                            name={`status-${s.studentId}`}
                            checked={statuses[s.studentId] === st}
                            onChange={() => setStatuses({ ...statuses, [s.studentId]: st })}
                          />
                          {st.charAt(0) + st.slice(1).toLowerCase()}
                        </label>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save attendance'}
          </button>
        </>
      )}

      {courseId && !loading && students.length === 0 && !message.text && (
        <p className="text-gray-500 text-sm">No students are enrolled in this course.</p>
      )}
    </div>
  )
}

export default function Attendance() {
  const { user } = useAuth()
  return user.role === 'STUDENT' ? <StudentView /> : <StaffView />
}
