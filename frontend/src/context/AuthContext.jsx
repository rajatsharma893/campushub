import { createContext, useContext, useEffect, useState } from 'react'
import api, { refreshSession, setAccessToken } from '../api'

const AuthContext = createContext(null)

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Free server so raha ho to thodi der baad dobara koshish karta hai
async function restoreSession() {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await refreshSession()
    } catch (err) {
      const status = err.response && err.response.status
      if (status === 401) throw err
      await wait(4000)
    }
  }
  throw new Error('Server unreachable')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    // Purane version ke localStorage tokens hata do
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    let alive = true
    const timer = setTimeout(() => alive && setSlow(true), 4000)

    restoreSession()
      .then((data) => alive && setUser(data.user))
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer)
        if (alive) setBooting(false)
      })

    const onForcedLogout = () => setUser(null)
    window.addEventListener('auth:logout', onForcedLogout)
    return () => {
      alive = false
      clearTimeout(timer)
      window.removeEventListener('auth:logout', onForcedLogout)
    }
  }, [])

  const startSession = (data) => {
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data.user
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return startSession(data)
  }

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form)
    return startSession(data)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // cookie server par hi hatni thi, fail ho to bhi local session band karo
    }
    setAccessToken(null)
    setUser(null)
  }

  if (booting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-600 text-sm px-4 text-center">
        <p className="font-medium">Loading CampusHub...</p>
        {slow && (
          <p className="mt-2 max-w-sm">
            The free server is waking up. This can take up to a minute on the first visit.
          </p>
        )}
      </div>
    )
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
