import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'

const PENGELOLA_ROLES = ['superadmin', 'admin', 'finance']

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { setAuth }    = useAuthStore()
  const { toast }      = useToast()
  const { t }          = useTranslation()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error || !token) {
      toast({ title: 'Login gagal', description: 'Autentikasi Google gagal.', variant: 'destructive' })
      navigate('/login', { replace: true })
      return
    }

    setAuth(null, token, null)

    authApi.me()
      .then(r => {
        const user = r.data?.data ?? r.data
        setAuth(user, token, null)
        toast({ title: t('auth.welcome', { name: user.name }) })
        navigate(PENGELOLA_ROLES.includes(user.role) ? '/admin' : '/', { replace: true })
      })
      .catch(() => {
        setAuth(null, null, null)
        toast({ title: 'Login gagal', description: 'Gagal mengambil data pengguna.', variant: 'destructive' })
        navigate('/login', { replace: true })
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Memproses login Google...</p>
      </div>
    </div>
  )
}
