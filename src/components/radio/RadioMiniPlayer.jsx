import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Play, Pause, Loader2, X, Radio } from 'lucide-react'
import { findChannel } from '@/data/radioChannels'
import { useRadioStore } from '@/store/radioStore'

/**
 * Bar pemutar kecil yang mengikuti pengguna ke halaman lain.
 *
 * Ada karena siarannya memang tidak berhenti saat berpindah halaman — elemen
 * audio hidup di luar pohon React. Tanpa bar ini, radio akan berbunyi tanpa
 * kendali yang terlihat, dan satu-satunya cara menghentikannya adalah menutup
 * tab. Itu perilaku yang membuat orang marah.
 *
 * Disembunyikan di halaman /streaming sendiri, karena di sana sudah ada
 * kendali yang jauh lebih lengkap.
 */
export default function RadioMiniPlayer() {
  const { t } = useTranslation()
  const location = useLocation()

  const channelId = useRadioStore(s => s.channelId)
  const status    = useRadioStore(s => s.status)
  const toggle    = useRadioStore(s => s.toggle)
  const stop      = useRadioStore(s => s.stop)

  const kanal = findChannel(channelId)
  if (!kanal) return null
  if (location.pathname.startsWith('/streaming')) return null

  const sedangJalan = status === 'playing' || status === 'buffering'

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[60] w-[calc(100%-2rem)] max-w-md">
      <div className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${kanal.gradient} p-2 pr-3 shadow-2xl shadow-black/30 ring-1 ring-white/20 backdrop-blur`}>
        <button
          onClick={() => toggle(kanal.id)}
          aria-label={t(sedangJalan ? 'radio.pause' : 'radio.play')}
          className="w-10 h-10 shrink-0 rounded-xl bg-white/90 text-slate-900 flex items-center justify-center hover:bg-white transition-colors"
        >
          {status === 'buffering'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : sedangJalan ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <Link to="/streaming" className="min-w-0 flex-1 group">
          <p className="text-white font-bold text-sm truncate group-hover:underline">{kanal.name}</p>
          <p className="text-white/75 text-[11px] truncate flex items-center gap-1">
            <Radio className="w-3 h-3 shrink-0" />
            {status === 'buffering' ? t('radio.connecting') : t('radio.live')}
          </p>
        </Link>

        <button
          onClick={stop}
          aria-label={t('radio.stop')}
          className="w-8 h-8 shrink-0 rounded-lg bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
