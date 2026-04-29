import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

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
  return config
})

// ── Response interceptor: handle 401 / refresh ────────
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
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
