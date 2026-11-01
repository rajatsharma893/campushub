import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Notices() {
  const { user } = useAuth()
  const canPost = user.role === 'ADMIN' || user.role === 'FACULTY'

  const [notices, setNotices] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get('/notices', { params: { page, limit: 10 } })
      .then((res) => {
        setNotices(res.data.data)
        setPagination(res.data.pagination)
      })
      .catch(() => {})
  }, [page, reloadKey])

  const handlePost = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/notices', { title, content })
      setTitle('')
      setContent('')
      setPage(1)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post notice')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (n) => {
    if (!window.confirm('Delete this notice?')) return
    try {
      await api.delete(`/notices/${n.id}`)
      setReloadKey((k) => k + 1)
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Notices ({pagination.total})</h2>

      {canPost && (
        <form onSubmit={handlePost} className="bg-white rounded-xl shadow p-4 mb-6">
          <h3 className="font-semibold mb-3">Post a notice</h3>
          {error && <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-3">{error}</div>}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
            className="w-full border rounded px-3 py-2 text-sm mb-3"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the notice..."
            required
            rows="3"
            className="w-full border rounded px-3 py-2 text-sm mb-3"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Posting...' : 'Post notice'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {notices.length === 0 && <p className="text-gray-500 text-sm">No notices yet.</p>}
        {notices.map((n) => (
          <div key={n.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-xs text-gray-500">
                  {n.author.name} ({n.author.role}) on {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>
              {(user.role === 'ADMIN' || n.author.id === user.id) && (
                <button onClick={() => handleDelete(n)} className="text-sm text-red-600 hover:underline">
                  Delete
                </button>
              )}
            </div>
            <p className="text-sm text-gray-700 mt-2">{n.content}</p>
          </div>
        ))}
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
