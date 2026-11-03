import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    departmentId: '',
    semester: 1,
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api
      .get('/auth/departments')
      .then((res) => {
        setDepartments(res.data)
        if (res.data.length) setForm((f) => ({ ...f, departmentId: res.data[0].id }))
      })
      .catch(() => setError('Could not load departments. Please try again in a moment.'))
  }, [])

  if (user) return <Navigate to="/" replace />

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const { confirm, ...payload } = form
      await register(payload)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot connect to server')
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-red-500'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border-t-4 border-red-600">
        <div className="flex justify-center mb-3">
          <Logo size={52} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">Create student account</h1>
        <p className="text-gray-500 text-center mb-5 text-sm">Join CampusHub as a student</p>

        {error && <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</div>}

        <label className="block text-sm font-medium mb-1">Full name</label>
        <input name="name" value={form.name} onChange={change} required className={input} />

        <label className="block text-sm font-medium mb-1">Email</label>
        <input name="email" type="email" value={form.email} onChange={change} required className={input} />

        <label className="block text-sm font-medium mb-1">Roll number</label>
        <input name="rollNumber" value={form.rollNumber} onChange={change} required className={input} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select name="departmentId" value={form.departmentId} onChange={change} required className={input + ' bg-white'}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Semester</label>
            <select name="semester" value={form.semester} onChange={change} className={input + ' bg-white'}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="block text-sm font-medium mb-1">Password</label>
        <input name="password" type="password" minLength="6" value={form.password} onChange={change} required className={input} />

        <label className="block text-sm font-medium mb-1">Confirm password</label>
        <input name="confirm" type="password" minLength="6" value={form.confirm} onChange={change} required className={input} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 mt-2"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-red-600 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs text-gray-500 mt-4">
          Created by <span className="font-semibold text-gray-800">Rajat Sharma</span>
        </p>
      </form>
    </div>
  )
}
