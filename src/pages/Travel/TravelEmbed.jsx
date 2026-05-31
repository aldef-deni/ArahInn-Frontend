import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { xasApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import SEO from '@/components/SEO'

const PAGE_META = {
  pesawat: { title: 'Tiket Pesawat',     accent: 'bg-sky-500' },
  kereta:  { title: 'Tiket Kereta Api',  accent: 'bg-orange-500' },
  dlu:     { title: 'Tiket Bus',         accent: 'bg-emerald-500' },
  pelni:   { title: 'Tiket Kapal Laut',  accent: 'bg-cyan-500' },
}

export default function TravelEmbed() {
  const { page } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  const [embedUrl, setEmbedUrl] = useState(null)
  const meta = PAGE_META[page]

  const credentialMutation = useMutation({
    mutationFn: () => xasApi.createCredential({
      page,
      phone: user?.phone || undefined,
    }).then(r => r.data),
    onSuccess: (data) => {
      if (!data.success || !data.data?.embedFeUrl) {
        toast({
          title: 'Gagal load webview',
          description: data.message || 'Coba lagi nanti.',
          variant: 'destructive',
        })
        return
      }
      setEmbedUrl(data.data.embedFeUrl)
    },
    onError: (e) => {
      toast({
        title: 'Gagal load webview',
        description: e?.response?.data?.message || 'Koneksi vendor bermasalah.',
        variant: 'destructive',
      })
    },
  })

  // Auto request credential saat page load (kalau user login)
  useEffect(() => {
    if (!token) return
    if (!meta) return
    credentialMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, token])

  if (!meta) {
    return (
      <div className="container py-16 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold">Jenis tiket tidak dikenal.</p>
        <button onClick={() => navigate('/tiket')}
          className="mt-4 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold">
          Kembali ke Pilihan Tiket
        </button>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="container py-16 text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold">Login dulu untuk pesan tiket.</p>
        <p className="text-sm text-slate-500 mt-1 mb-5">Login supaya riwayat tiket Anda tersimpan.</p>
        <button onClick={() => navigate('/login')}
          className="px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold">
          Masuk Sekarang
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-50 flex flex-col">
      <SEO title={meta.title} description={`Pesan ${meta.title} di ArahInn.`} />

      {/* Header */}
      <header className="shrink-0 bg-white border-b border-slate-200 z-10">
        <div className="container py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/tiket')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-all"
            aria-label="Kembali"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">ArahInn Travel</p>
            <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">{meta.title}</h1>
          </div>
          {embedUrl && (
            <a href={embedUrl} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
              title="Buka di tab baru">
              <ExternalLink className="w-4 h-4" />
              Tab baru
            </a>
          )}
        </div>
      </header>

      {/* Body — iframe or loading */}
      <div className="flex-1 relative bg-white">
        {credentialMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
              <p className="font-semibold text-slate-700">Menyiapkan halaman {meta.title.toLowerCase()}...</p>
              <p className="text-xs text-slate-500 mt-1">Sebentar ya.</p>
            </div>
          </div>
        )}

        {!credentialMutation.isPending && !embedUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center max-w-sm px-6">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-800">Gagal memuat halaman</p>
              <p className="text-sm text-slate-500 mt-1 mb-5">
                Layanan tiket sedang tidak tersedia. Coba lagi nanti.
              </p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => navigate('/tiket')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Kembali
                </button>
                <button onClick={() => credentialMutation.mutate()}
                  className="px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-700">
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {embedUrl && (
          <iframe
            src={embedUrl}
            title={meta.title}
            className="w-full h-full border-0"
            allow="payment; clipboard-write; clipboard-read; geolocation"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          />
        )}
      </div>
    </div>
  )
}
