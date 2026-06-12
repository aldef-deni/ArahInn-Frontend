import { useEffect } from 'react'
import { authApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'

// Web Client ID (publik, aman diekspos). Override via VITE_GOOGLE_CLIENT_ID bila perlu.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || '232007704410-cseo9n94uhrq4fpu86gf90sabsv88ke8.apps.googleusercontent.com'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

// Halaman yang TIDAK menampilkan One Tap (auth & panel staff)
const isExcludedPath = (p) => /^\/(login|register|auth|admin|owner)\b/.test(p || '')

/**
 * Google One Tap — prompt "Continue as <Nama>" otomatis saat user belum login
 * (mirip Traveloka). Pakai endpoint /auth/google/mobile yang sudah ada.
 */
export default function GoogleOneTap() {
  const token   = useAuthStore(s => s.token)
  const setAuth = useAuthStore(s => s.setAuth)

  useEffect(() => {
    if (token) return                                   // sudah login → skip
    if (isExcludedPath(window.location.pathname)) return
    let cancelled = false

    const handleCredential = async (resp) => {
      if (!resp?.credential) return
      try {
        const r = await authApi.googleOneTap(resp.credential)
        const data  = r.data?.data || {}
        const tkn   = data.token
        if (!tkn) return
        setAuth(data.user, tkn, null)
        // Ambil profil lengkap (role) lalu refresh agar state login konsisten
        try {
          const me = await authApi.me()
          const u  = me.data?.data?.user ?? me.data?.data ?? me.data
          setAuth(u, tkn, null)
        } catch { /* abaikan */ }
        window.location.reload()
      } catch { /* gagal verifikasi → abaikan, user bisa login manual */ }
    }

    const init = () => {
      if (cancelled || !window.google?.accounts?.id) return
      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback : handleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,   // wajib utk Chrome terbaru
        })
        window.google.accounts.id.prompt()
      } catch { /* origin belum di-whitelist / browser tak dukung → abaikan */ }
    }

    if (window.google?.accounts?.id) {
      init()
    } else if (!document.querySelector(`script[src="${GSI_SRC}"]`)) {
      const s = document.createElement('script')
      s.src = GSI_SRC; s.async = true; s.defer = true
      s.onload = init
      document.head.appendChild(s)
    } else {
      // script sedang dimuat oleh instance lain
      const iv = setInterval(() => { if (window.google?.accounts?.id) { clearInterval(iv); init() } }, 300)
      setTimeout(() => clearInterval(iv), 6000)
    }

    return () => { cancelled = true }
  }, [token, setAuth])

  return null
}
