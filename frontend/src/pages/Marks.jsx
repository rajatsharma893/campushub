import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import CoursePicker from '../components/CoursePicker'

function StudentView() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/marks/my')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load report card'))
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-gray-500">Loading...</p>

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">My Report Card</h2>

      {data.subjects.length === 0 ? (
        <p className="text-gray-500">No marks have been entered yet.</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow p-4 mb-4 flex gap-10">
            <div>
              <p className="text-sm text-gray-500">CGPA</p>
              <p className="text-3xl font-bold">{data.cgpa}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Result</p>
              <p className={`text-3xl font-bold ${data.overallResult === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                {data.overallResult}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Internal</th>
                  <th className="px-4 py-3">External</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((s) => (
                  <tr key={s.course.id} className="border-t">
                    <td className="px-4 py-3">{s.course.code} - {s.course.name}</td>
                    <td className="px-4 py-3">{s.course.credits}</td>
                    <td className="px-4 py-3">{s.internal}</td>
                    <td className="px-4 py-3">{s.external}</td>
                    <td className="px-4 py-3">{s.total}</td>
                    <td className="px-4 py-3 font-medium">{s.grade}</td>
                    <td className={`px-4 py-3 ${s.result === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>{s.result}</td>
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
  const [students, setStudents] = useState([])
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    api
      .get(`/marks/course/${courseId}`)
      .then((res) => {
        setStudents(res.data.students)
        const initial = {}
        res.data.students.forEach((s) => {
          initial[s.studentId] = {
            internal: s.internal ?? '',
            external: s.external ?? '',
          }
        })
        setValues(initial)
      })
      .catch((err) => {
        setStudents([])
        setMessage({ type: 'error', text: err.response?.data?.message || 'Could not load students' })
      })
      .finally(() => setLoading(false))
  }, [courseId, reloadKey])

  const setField = (studentId, field, value) => {
    setValues({ ...values, [studentId]: { ...values[studentId], [field]: value } })
  }

  const handleSave = async () => {
    setMessage({ type: '', text: '' })
    // Sirf wahi rows jinke dono marks bhare hain
    const records = students
      .filter((s) => values[s.studentId].internal !== '' && values[s.studentId].external !== '')
      .map((s) => ({
        studentId: s.studentId,
        internal: Number(values[s.studentId].internal),
        external: Number(values[s.studentId].external),
      }))

    if (records.length === 0) {
      setMessage({ type: 'error', text: 'Enter internal and external marks for at least one student' })
      return
    }

    setSaving(true)
    try {
      const { data } = await api.post('/marks/enter', { courseId: Number(courseId), records })
      setMessage({ type: 'success', text: `${data.message} (${data.count} students)` })
      setReloadKey((k) => k + 1)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Enter Marks</h2>
      <div className="mb-4">
        <CoursePicker
          value={courseId}
          onChange={(id) => {
            setCourseId(id)
            setMessage({ type: '', text: '' })
          }}
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
          <p className="text-xs text-gray-500 mb-2">Internal is out of 40 and external is out of 60.</p>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Internal (40)</th>
                  <th className="px-4 py-3">External (60)</th>
                  <th className="px-4 py-3">Saved total</th>
                  <th className="px-4 py-3">Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentId} className="border-t">
                    <td className="px-4 py-3">{s.rollNumber}</td>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={values[s.studentId]?.internal ?? ''}
                        onChange={(e) => setField(s.studentId, 'internal', e.target.value)}
                        className="w-20 border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={values[s.studentId]?.external ?? ''}
                        onChange={(e) => setField(s.studentId, 'external', e.target.value)}
                        className="w-20 border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3">{s.total ?? '-'}</td>
                    <td className="px-4 py-3 font-medium">{s.grade ?? '-'}</td>
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
            {saving ? 'Saving...' : 'Save marks'}
          </button>
        </>
      )}

      {courseId && !loading && students.length === 0 && !message.text && (
        <p className="text-gray-500 text-sm">No students are enrolled in this course.</p>
      )}
    </div>
  )
}

export default function Marks() {
  const { user } = useAuth()
  return user.role === 'STUDENT' ? <StudentView /> : <StaffView />
}