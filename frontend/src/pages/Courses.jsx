import { useEffect, useState } from 'react'
import api from '../api'

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [departments, setDepartments] = useState([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [semester, setSemester] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/courses', {
          params: { page, limit: 10, search, departmentId, semester },
        })
        setCourses(data.data)
        setPagination(data.pagination)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [page, search, departmentId, semester])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Courses ({pagination.total})</h2>
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search code or name..."
            className="border rounded px-3 py-2 text-sm w-56 bg-white"
          />
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value)
              setPage(1)
            }}
            className="border rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.code}</option>
            ))}
          </select>
          <select
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value)
              setPage(1)
            }}
            className="border rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">All semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Sem</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Faculty</th>
              <th className="px-4 py-3">Students</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-gray-500">Loading...</td>
              </tr>
            )}
            {!loading && courses.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-gray-500">No courses found</td>
              </tr>
            )}
            {!loading &&
              courses.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">{c.code}</td>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.department.code}</td>
                  <td className="px-4 py-3">{c.semester}</td>
                  <td className="px-4 py-3">{c.credits}</td>
                  <td className="px-4 py-3">{c.faculty ? c.faculty.user.name : 'Unassigned'}</td>
                  <td className="px-4 py-3">{c._count.enrollments}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-gray-600">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded bg-white disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded bg-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}