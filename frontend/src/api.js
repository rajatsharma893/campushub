import axios from 'axios'

// Access token sirf memory mein rehta hai (localStorage mein nahi)
let accessToken = null
export const setAccessToken = (token) => {
  accessToken = token
}

const api = axios.create({ baseURL: '/api', withCredentials: true })
const bare = axios.create({ baseURL: '/api', withCredentials: true })

// Ek saath kai requests fail hon to refresh sirf ek baar chalta hai
let refreshing = null
export const refreshSession = () => {
  if (!refreshing) {
    refreshing = bare
      .post('/auth/refresh')
      .then((res) => {
        accessToken = res.data.accessToken
        return res.data
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

const AUTH_URLS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response && error.response.status
    const isAuthCall = original && AUTH_URLS.some((u) => (original.url || '').includes(u))

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        await refreshSession()
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (e) {
        accessToken = null
        window.dispatchEvent(new Event('auth:logout'))
      }
    }
    return Promise.reject(error)
  }
)

export default api
