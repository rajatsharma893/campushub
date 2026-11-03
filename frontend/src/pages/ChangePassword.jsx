import { useState } from 'react'
import api from '../api'

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    if (form.newPassword !== form.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setMessage({ type: 'success', text: data.message })
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not change password' })
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500'

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 border-t-4 border-red-600">
        {message.text && (
          <div className={`text-sm p-2 rounded mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <label className="block text-sm font-medium mb-1">Current password</label>
        <input name="currentPassword" type="password" value={form.currentPassword} onChange={change} required className={input} />

        <label className="block text-sm font-medium mb-1">New password</label>
        <input name="newPassword" type="password" minLength="6" value={form.newPassword} onChange={change} required className={input} />

        <label className="block text-sm font-medium mb-1">Confirm new password</label>
        <input name="confirm" type="password" minLength="6" value={form.confirm} onChange={change} required className={input} />

        <button
          type="submit"
          disabled={saving}
          className="bg-red-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </div>
  )
}
