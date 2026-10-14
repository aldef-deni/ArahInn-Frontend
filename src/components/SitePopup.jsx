import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, X, Volume2, VolumeX } from 'lucide-react'
import { popupApi } from '@/services/index'
import { getImageUrl } from '@/utils/index'

/**
 * Popup situs dinamis — isinya dikelola superadmin di kelola.arahinn.com
 * (menu Popup). Endpoint yang sama juga dipakai aplikasi ArahInn mobile.
 * Tampil setiap kali halaman dimuat, dan dilewati saat alur pembayaran.
 */
const SKIP_PATHS = ['/payment', '/checkout', '/tiket/bayar']

export default function SitePopup() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const skip = SKIP_PATHS.some(p => pathname.startsWith(p))

  const { data: popups = [] } = useQuery({
    queryKey : ['site-popups', pathname],
    queryFn  : () => popupApi.active({ path: pathname, platform: 'web' }).then(r => r.data?.data ?? []),
    enabled  : !skip,
    staleTime: 5 * 60_000,
    retry    : false,
  })

  // Popup pertama sesuai urutan dari server. Sengaja TIDAK disimpan ke
  // localStorage: popup harus muncul lagi setiap halaman dimuat ulang.
  const candidate = useMemo(
    () => (skip ? null : popups[0] ?? null),
    [popups, skip],
  )

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!candidate) { setOpen(false); return }
    setActive(candidate)
    const t = setTimeout(() => setOpen(true), 800)   // beri jeda agar halaman render dulu
    return () => clearTimeout(t)
  }, [candidate])

  // Menutup popup hanya berlaku untuk tampilan saat ini — saat halaman
  // dimuat ulang, popup akan muncul kembali.
  const dismiss = useCallback(() => setOpen(false), [])

  const goTo = useCallback(() => {
    const url = active?.url
    dismiss()
    if (!url) return
    if (/^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener,noreferrer')
    else navigate(url.startsWith('/') ? url : `/${url}`)
  }, [active, dismiss, navigate])

  // Esc menutup + kunci scroll latar
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, dismiss])

  // Suara video.
  //
  // Dimulai BISU dengan sengaja: browser memblokir autoplay bersuara, sehingga
  // video yang langsung bersuara tidak akan diputar sama sekali — bukan
  // "diputar tanpa suara", melainkan diam total dengan bingkai beku. Sentuhan
  // pengguna pada tombol suara sekaligus menjadi izin yang dituntut browser.
  const [bisu, setBisu] = useState(true)
  const videoRef = useRef(null)

  const nyalakanSuara = useCallback(() => {
    const el = videoRef.current
    setBisu((v) => !v)
    if (!el) return
    // Melepas bisu kadang membuat browser menjeda pemutaran. Dimainkan ulang
    // di sini supaya tombolnya tidak terasa seperti menghentikan videonya.
    el.muted = !el.muted
    if (!el.muted) el.play?.().catch(() => {})
  }, [])

  if (!open || !active) return null

  const image = getImageUrl(active.image)
  const video = getImageUrl(active.video)
  const hasMedia = !!(image || video)
  const hasText  = !!(active.description || (!hasMedia && active.title))
  const ctaLabel = active.buttonText || 'Lihat Selengkapnya'

  return (
    <div
      role="dialog" aria-modal="true" aria-label={active.title || 'Pengumuman'}
      onClick={dismiss}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[430px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-black/50 animate-slide-up-checkout"
      >
        {/* Tombol tutup */}
        <button
          type="button" onClick={dismiss} aria-label="Tutup"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-slate-900/55 text-white backdrop-blur-sm flex items-center justify-center hover:bg-slate-900/75 transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* Media — klik menuju tautan bila ada */}
        {hasMedia && (
          <div
            className={active.url ? 'cursor-pointer' : ''}
            onClick={active.url ? goTo : undefined}
          >
            {video ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={video} className="w-full h-auto block rounded-t-3xl bg-slate-900"
                  autoPlay muted={bisu} loop playsInline controls
                />

                {/* Tombol suara.
                    Video TETAP dimulai dalam keadaan bisu, dan itu bukan
                    pilihan gaya: browser memblokir autoplay bersuara, jadi
                    video yang langsung bersuara tidak akan diputar sama
                    sekali — bukan "diputar tanpa suara", melainkan diam total.
                    Suara dinyalakan setelah ada sentuhan pengguna, yang juga
                    menjadi izin yang dituntut browser.
                    `loop` membuat audio ikut berulang bersama gambarnya; tidak
                    ada yang perlu disamakan terpisah. */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); nyalakanSuara() }}
                  aria-label={bisu ? 'Nyalakan suara' : 'Matikan suara'}
                  title={bisu ? 'Nyalakan suara' : 'Matikan suara'}
                  className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/55 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur transition-colors"
                >
                  {bisu ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <img
                src={image} alt={active.title || 'Popup'}
                className="w-full h-auto block select-none rounded-t-3xl"
                draggable={false}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>
        )}

        {/* Teks + CTA */}
        <div className={`px-5 ${hasMedia ? 'pt-4' : 'pt-12'} pb-5`}>
          {(active.title && (hasText || !hasMedia)) && (
            <h2 className="text-lg font-extrabold text-slate-900 leading-snug">{active.title}</h2>
          )}
          {active.description && (
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed whitespace-pre-line">
              {active.description}
            </p>
          )}

          {active.url && (
            <button
              type="button" onClick={goTo}
              className="group relative mt-4 w-full overflow-hidden rounded-2xl py-3.5 text-[15px] font-extrabold tracking-tight text-amber-950 ring-1 ring-amber-200/70 shadow-[0_10px_28px_-8px_rgba(245,158,11,0.65)] bg-[linear-gradient(110deg,#fbbf24,35%,#fff7cd,50%,#fbbf24,65%,#f59e0b)] bg-[length:200%_100%] animate-shimmer transition-all hover:brightness-105 active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {ctaLabel}
                <ChevronRight className="w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={3} />
              </span>
            </button>
          )}

          <button
            type="button" onClick={dismiss}
            className="mt-2.5 w-full text-center text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  )
}
