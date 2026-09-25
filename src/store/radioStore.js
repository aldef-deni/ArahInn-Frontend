import { create } from 'zustand'
import { findChannel } from '@/data/radioChannels'

/**
 * Pemutar radio RRI.
 *
 * Elemen <audio> sengaja dibuat di LUAR pohon React dan disimpan di modul ini.
 * Kalau ia dirender sebagai komponen, berpindah halaman akan melepasnya dari
 * DOM dan siarannya terputus di tengah — persis hal yang membuat pemutar radio
 * terasa murahan. Dengan cara ini, satu elemen hidup sepanjang sesi.
 *
 * Volume disimpan di localStorage; selera volume orang tidak berubah tiap
 * kunjungan. Kanal yang sedang diputar TIDAK disimpan: siaran langsung yang
 * menyala sendiri saat halaman dibuka akan mengagetkan, dan browser memang
 * memblokir autoplay bersuara.
 */

const KUNCI_VOLUME = 'arahinn-radio-volume'

const bacaVolume = () => {
  try {
    const v = Number(localStorage.getItem(KUNCI_VOLUME))
    return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.8
  } catch {
    // Mode penyamaran / penyimpanan diblokir — jangan sampai menjatuhkan halaman.
    return 0.8
  }
}

let audio = null

/** Dibuat saat pertama dibutuhkan, bukan saat modul dimuat: membuat elemen
 *  audio saat impor akan gagal di lingkungan tanpa DOM (mis. build SSR). */
function ambilAudio() {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'none'
  audio.crossOrigin = 'anonymous'
  audio.volume = bacaVolume()

  const set = () => useRadioStore.setState
  audio.addEventListener('playing', () => set()({ status: 'playing' }))
  audio.addEventListener('waiting', () => set()({ status: 'buffering' }))
  audio.addEventListener('pause',   () => set()({ status: 'paused' }))
  audio.addEventListener('error',   () => set()({ status: 'error' }))
  return audio
}

export const useRadioStore = create((set, get) => ({
  channelId: null,
  status   : 'idle', // idle | buffering | playing | paused | error
  volume   : bacaVolume(),
  muted    : false,

  play: async (channelId) => {
    const kanal = findChannel(channelId)
    if (!kanal) return

    const el = ambilAudio()
    const gantiKanal = get().channelId !== channelId

    if (gantiKanal) {
      // Penanda waktu memaksa browser mengambil aliran BARU, bukan memutar
      // ulang potongan yang tersimpan di cache. Untuk siaran langsung, memutar
      // potongan lama berarti mendengar masa lalu.
      el.src = `${kanal.url}${kanal.url.includes('?') ? '&' : '?'}_t=${Date.now()}`
      set({ channelId, status: 'buffering' })
    } else {
      set({ status: 'buffering' })
    }

    try {
      await el.play()
    } catch {
      // Umumnya karena autoplay diblokir sampai ada interaksi pengguna.
      set({ status: 'error' })
    }
  },

  pause: () => {
    if (audio) audio.pause()
    set({ status: 'paused' })
  },

  toggle: (channelId) => {
    const { channelId: aktif, status, play, pause } = get()
    if (aktif === channelId && (status === 'playing' || status === 'buffering')) pause()
    else play(channelId)
  },

  stop: () => {
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load() }
    set({ channelId: null, status: 'idle' })
  },

  setVolume: (v) => {
    const nilai = Math.min(1, Math.max(0, v))
    if (audio) { audio.volume = nilai; audio.muted = false }
    try { localStorage.setItem(KUNCI_VOLUME, String(nilai)) } catch { /* diabaikan */ }
    set({ volume: nilai, muted: false })
  },

  toggleMute: () => {
    const baru = !get().muted
    if (audio) audio.muted = baru
    set({ muted: baru })
  },
}))
