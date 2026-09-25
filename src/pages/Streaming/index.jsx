import { useTranslation } from 'react-i18next'
import { Play, Pause, Loader2, Radio, Volume2, VolumeX, AlertTriangle, Signal } from 'lucide-react'
import { RADIO_CHANNELS, findChannel } from '@/data/radioChannels'
import { useRadioStore } from '@/store/radioStore'
import SEO from '@/components/SEO'

/**
 * Halaman streaming radio RRI.
 *
 * ArahInn menyiarkan ulang atas izin langsung dari RRI.
 *
 * Catatan yang menentukan bentuk halaman ini: aliran Icecast TIDAK memberi
 * judul lagu ke browser (metadata ICY tidak bisa dibaca lintas domain), dan
 * RRI tidak menyediakan artwork. Jadi tidak ada "sedang diputar" — memalsukan
 * itu lebih buruk daripada tidak menampilkannya. Sebagai gantinya tiap kanal
 * punya identitas warna sendiri supaya tetap terasa hidup dan bisa dibedakan
 * sekilas.
 */
export default function Streaming() {
  const { t } = useTranslation()
  const channelId = useRadioStore(s => s.channelId)
  const status    = useRadioStore(s => s.status)
  const volume    = useRadioStore(s => s.volume)
  const muted     = useRadioStore(s => s.muted)
  const toggle    = useRadioStore(s => s.toggle)
  const setVolume = useRadioStore(s => s.setVolume)
  const toggleMute = useRadioStore(s => s.toggleMute)

  const aktif = findChannel(channelId)
  const sedangJalan = status === 'playing' || status === 'buffering'

  return (
    <div className="min-h-screen bg-slate-950">
      <SEO url="/streaming" />

      {/* ── Panggung utama ───────────────────────────────────────────
          Latar mengambil warna kanal yang sedang diputar; saat diam,
          birunya ArahInn. Perpindahan warnanya dibuat lambat supaya terasa
          seperti panggung yang berganti lampu, bukan halaman yang berkedip. */}
      <div className="relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br transition-all duration-1000 ${
            aktif ? aktif.gradient : 'from-slate-900 via-slate-900 to-blue-950'
          }`}
        />
        <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[24rem] h-[24rem] rounded-full bg-black/20 blur-3xl" />

        <div className="container relative py-12 sm:py-16 lg:py-20">
          <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-[0.18em]">
            <Radio className="w-3.5 h-3.5" />
            {t('radio.eyebrow')}
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            {aktif ? aktif.name : t('radio.title')}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/75 max-w-xl leading-relaxed">
            {aktif ? t(aktif.taglineKey) : t('radio.subtitle')}
          </p>

          {aktif && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => toggle(aktif.id)}
                className="group flex items-center gap-3 pl-2 pr-6 py-2 rounded-full bg-white text-slate-900 font-bold shadow-xl shadow-black/20 hover:shadow-2xl active:scale-[0.98] transition-all"
              >
                <span className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: aktif.accent }}>
                  {status === 'buffering'
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : sedangJalan ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </span>
                {status === 'buffering' ? t('radio.connecting') : sedangJalan ? t('radio.pause') : t('radio.play')}
              </button>

              <Gelombang aktif={status === 'playing'} />

              {status === 'playing' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 ring-1 ring-white/25 text-white text-xs font-bold backdrop-blur">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  {t('radio.live')}
                </span>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="mt-5 flex items-start gap-2 max-w-lg rounded-2xl bg-red-950/50 ring-1 ring-red-400/30 px-4 py-3 text-sm text-red-100">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{t('radio.errorBody')}</span>
            </div>
          )}

          {/* Volume hanya muncul setelah ada kanal dipilih — kendali yang tidak
              mengendalikan apa pun hanya menambah kebisingan visual. */}
          {aktif && (
            <div className="mt-6 flex items-center gap-3 max-w-xs">
              <button onClick={toggleMute} aria-label={t(muted ? 'radio.unmute' : 'radio.mute')}
                className="w-9 h-9 rounded-full bg-white/10 ring-1 ring-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range" min={0} max={1} step={0.01}
                value={muted ? 0 : volume}
                onChange={e => setVolume(Number(e.target.value))}
                aria-label={t('radio.volume')}
                className="flex-1 h-1.5 accent-white cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Daftar kanal ─────────────────────────────────────────── */}
      <div className="container py-10 sm:py-12">
        <h2 className="text-white font-display text-lg sm:text-xl font-bold">{t('radio.channels')}</h2>
        <p className="text-sm text-slate-400 mt-1">{t('radio.channelsHint')}</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RADIO_CHANNELS.map(kanal => {
            const ini = channelId === kanal.id
            const jalan = ini && sedangJalan
            return (
              <button
                key={kanal.id}
                onClick={() => toggle(kanal.id)}
                className={`group relative overflow-hidden rounded-3xl p-5 text-left ring-1 transition-all duration-300 ${
                  ini ? 'ring-white/40 shadow-2xl shadow-black/40' : 'ring-white/10 hover:ring-white/25'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${kanal.gradient} ${ini ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'} transition-opacity duration-300`} />
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-extrabold text-lg leading-tight">{kanal.name}</p>
                    <p className="mt-1 text-xs text-white/75 leading-relaxed line-clamp-2">{t(kanal.taglineKey)}</p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-white/80">
                      <Signal className="w-3 h-3" />{kanal.freq}
                    </p>
                  </div>
                  <span className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all ${
                    jalan ? 'bg-white text-slate-900' : 'bg-white/20 text-white group-hover:bg-white/30'
                  }`}>
                    {ini && status === 'buffering'
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : jalan ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Kejujuran soal cakupan: tiga kanal ini yang izinnya sudah berjalan
            dan URL-nya terbukti. Pro 3 menyusul. */}
        <p className="mt-8 text-xs text-slate-500 leading-relaxed max-w-2xl">
          {t('radio.credit')}
        </p>
      </div>
    </div>
  )
}

/**
 * Batang gelombang — hiasan, BUKAN pembacaan amplitudo sungguhan.
 *
 * Server RRI ternyata mengirim `Access-Control-Allow-Origin: *`, jadi
 * visualiser sungguhan lewat Web Audio API secara teknis mungkin. Sengaja
 * tidak dipakai: `createMediaElementSource` mengalihkan seluruh keluaran audio
 * ke graf Web Audio, dan bila graf itu gagal di satu browser — iOS punya
 * riwayat panjang soal ini — siarannya ikut bisu tanpa gejala lain. Untuk
 * pemutar radio, bunyi jauh lebih penting daripada animasi.
 */
function Gelombang({ aktif }) {
  const tinggi = [10, 18, 26, 16, 22, 12, 20]
  return (
    <div className="flex items-end gap-[3px] h-7" aria-hidden="true">
      {tinggi.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-white/70 ${aktif ? 'animate-pulse' : ''}`}
          style={{
            height: aktif ? h : 4,
            transition: 'height 300ms ease',
            animationDelay: `${i * 90}ms`,
            animationDuration: '900ms',
          }}
        />
      ))}
    </div>
  )
}
