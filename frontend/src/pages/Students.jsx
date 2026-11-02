import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

const emptyForm = { name: '', email: '', rollNumber: '', departmentId: '', semester: 1, phone: '' }

export default function Students() {
  const { user } = useAuth()
  const isAdmin = user.role === 'ADMIN'

  const [students, setStudents] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [departments, setDepartments] = useState([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/students', { params: { page, limit: 10, search } })
        setStudents(data.data)
        setPagination(data.pagination)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [page, search, reloadKey])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, departmentId: departments[0]?.id || '' })
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({
      name: s.user.name,
      email: s.user.email,
      rollNumber: s.rollNumber,
      departmentId: s.departmentId,
      semester: s.semester,
      phone: s.phone || '',
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (editing) await api.put(`/students/${editing.id}`, form)
      else await api.post('/students', form)
      setShowForm(false)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete ${s.user.name}? Attendance and marks will also be removed.`)) return
    try {
      await api.delete(`/students/${s.id}`)
      setReloadKey((k) => k + 1)
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Students ({pagination.total})</h2>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search name, email, roll no..."
            className="border rounded px-3 py-2 text-sm w-64 bg-white"
          />
          {isAdmin && (
            <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
              + Add Student
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Roll No</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Sem</th>
              {isAdmin && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">Loading...</td>
              </tr>
            )}
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">No students found</td>
              </tr>
            )}
            {!loading &&
              students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3">{s.rollNumber}</td>
                  <td className="px-4 py-3">{s.user.name}</td>
                  <td className="px-4 py-3">{s.user.email}</td>
                  <td className="px-4 py-3">{s.department.code}</td>
                  <td className="px-4 py-3">{s.semester}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 space-x-3">
                      <button onClick={() => openEdit(s)} className="text-neutral-900 font-medium hover:underline">Edit</button>
                      <button onClick={() => handleDelete(s)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  )}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit Student' : 'Add Student'}</h3>
            {formError && <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-3">{formError}</div>}

            <div className="space-y-3">
              <input name="name" value={form.name} onChange={change} placeholder="Full name" required className="w-full border rounded px-3 py-2 text-sm" />
              <input name="email" type="email" value={form.email} onChange={change} placeholder="Email" required className="w-full border rounded px-3 py-2 text-sm" />
              <input name="rollNumber" value={form.rollNumber} onChange={change} placeholder="Roll number" required className="w-full border rounded px-3 py-2 text-sm" />
              <select name="departmentId" value={form.departmentId} onChange={change} required className="w-full border rounded px-3 py-2 text-sm bg-white">
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
              <input name="semester" type="number" min="1" max="8" value={form.semester} onChange={change} placeholder="Semester" required className="w-full border rounded px-3 py-2 text-sm" />
              <input name="phone" value={form.phone} onChange={change} placeholder="Phone (optional)" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            {!editing && <p className="text-xs text-gray-500 mt-3">Default password: password123</p>}

            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}