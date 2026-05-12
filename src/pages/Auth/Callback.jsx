import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'
import {
  getCustomerPortalUrl,
  getManagementPortalUrl,
  getOwnerPortalUrl,
  isManagementPortal,
  isManagementRole,
  isOwnerPortal,
  isOwnerRole,
} from '@/utils/isExtranet'

const managementMode = isManagementPortal()
const ownerMode = isOwnerPortal()

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
        if (managementMode) {
          if (isManagementRole(user.role)) {
            navigate('/admin', { replace: true })
            return
          }
          if (isOwnerRole(user.role)) {
            window.location.replace(getOwnerPortalUrl('/owner'))
            return
          }
          window.location.replace(getCustomerPortalUrl())
          return
        }

        if (ownerMode) {
          if (isOwnerRole(user.role)) {
            navigate('/owner', { replace: true })
            return
          }
          if (isManagementRole(user.role)) {
            window.location.replace(getManagementPortalUrl('/admin'))
            return
          }
          window.location.replace(getCustomerPortalUrl())
          return
        }

        if (isManagementRole(user.role)) {
          window.location.replace(getManagementPortalUrl('/admin'))
          return
        }

        if (isOwnerRole(user.role)) {
          window.location.replace(getOwnerPortalUrl('/owner'))
          return
        }

        navigate('/', { replace: true })
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
