import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, Loader2 } from 'lucide-react'
import { wishlistApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'

/**
 * Tombol simpan ke wishlist (toggle hati). Otomatis tersembunyi bila fitur
 * dimatikan superadmin atau tipe item tidak diizinkan.
 * variant: 'floating' (bulat di kartu/hero) | 'inline' (tombol berlabel).
 */
export default function WishlistButton({ type, id, variant = 'floating', className = '' }) {
  const { t } = useTranslation()
  const token = useAuthStore(s => s.token)
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: cfg } = useQuery({
    queryKey: ['wishlist-config'],
    queryFn: () => wishlistApi.config().then(r => r.data?.data),
    staleTime: 5 * 60_000,
  })
  const { data: ids = [] } = useQuery({
    queryKey: ['wishlist-ids'],
    queryFn: () => wishlistApi.ids().then(r => r.data?.data || []),
    enabled: !!token,
    staleTime: 60_000,
  })

  const saved = ids.includes(`${type}:${id}`)

  const mut = useMutation({
    mutationFn: () => wishlistApi.toggle({ itemType: type, itemId: id }).then(r => r.data),
    onSuccess: (res) => {
      if (!res?.success) { toast({ title: res?.message || t('wishlistBtn.failed') }); return }
      qc.invalidateQueries({ queryKey: ['wishlist-ids'] })
      qc.invalidateQueries({ queryKey: ['wishlist-list'] })
      toast({ title: res.data?.saved ? t('wishlistBtn.added') : t('wishlistBtn.removed') })
    },
    onError: (e) => toast({ title: e?.response?.data?.message || t('wishlistBtn.failed') }),
  })

  // Fitur dimatikan atau tipe tak diizinkan → sembunyikan tombol
  if (cfg && (cfg.enabled === false || (Array.isArray(cfg.types) && !cfg.types.includes(type)))) return null

  const onClick = (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.()
    if (!token) { toast({ title: t('wishlistBtn.loginNeeded') }); navigate('/login'); return }
    mut.mutate()
  }

  if (variant === 'inline') {
    return (
      <button type="button" onClick={onClick} disabled={mut.isPending}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-colors disabled:opacity-60 ${saved ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-500'} ${className}`}>
        {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />}
        {saved ? t('wishlistBtn.saved') : t('wishlistBtn.save')}
      </button>
    )
  }

  return (
    <button type="button" onClick={onClick} disabled={mut.isPending} aria-label={t('wishlistBtn.save')}
      className={`w-9 h-9 rounded-full bg-white/95 backdrop-blur shadow-md flex items-center justify-center active:scale-90 transition-transform ${className}`}>
      {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Heart className={`w-[18px] h-[18px] ${saved ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />}
    </button>
  )
}
