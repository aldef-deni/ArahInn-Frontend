import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]'

const toSnakeKey = (key) =>
  typeof key === 'string' ? key.replace(/([A-Z])/g, '_$1').toLowerCase() : key

const toCamelKey = (key) =>
  typeof key === 'string' ? key.replace(/_([a-z])/g, (_, char) => char.toUpperCase()) : key

const convertKeysDeep = (value, keyConverter) => {
  if (Array.isArray(value)) {
    return value.map(item => convertKeysDeep(item, keyConverter))
  }

  if (!isPlainObject(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      keyConverter(key),
      convertKeysDeep(nestedValue, keyConverter),
    ])
  )
}

// Endpoint auth publik: 401/404 di sini artinya KREDENSIAL SALAH (email/password),
// bukan sesi kedaluwarsa. Jangan dipicu refresh-token / logout / redirect —
// biarkan halaman login & daftar menampilkan error per kolom.
const AUTH_PUBLIC_URL = /\/auth\/(login|register|register-owner|forgot-password|reset-password|google)/

const api = axios.create({
  baseURL        : import.meta.env.VITE_API_URL || '/api/v1',
  timeout        : 30000,
  headers        : { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ── Request interceptor: tambah token ─────────────────
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`

  if (config.params) {
    config.params = convertKeysDeep(config.params, toSnakeKey)
  }

  if (config.data && isPlainObject(config.data)) {
    config.data = convertKeysDeep(config.data, toSnakeKey)
  }

  return config
})

// ── Response interceptor: handle 401 / refresh ────────
api.interceptors.response.use(
  res => {
    if (res.data) {
      res.data = convertKeysDeep(res.data, toCamelKey)
    }

    return res
  },
  async err => {
    const original = err.config
    const isAuthPublic = AUTH_PUBLIC_URL.test(original?.url || '')
    if (err.response?.status === 401 && !original._retry && !isAuthPublic) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh-token', { refreshToken })
          const { accessToken, refreshToken: newRefresh } = data.data
          const user = useAuthStore.getState().user
          useAuthStore.getState().setAuth(user, accessToken, newRefresh)
          original.headers.Authorization = `Bearer ${accessToken}`
          return api(original)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Helpers ───────────────────────────────────────────
export const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

export const handleApiError = (err) =>
  err?.response?.data?.message || err?.message || 'Terjadi kesalahan.'
