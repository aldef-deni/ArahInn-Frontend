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

const VOLUME_AWAL = 0.8

const bacaVolume = () => {
  try {
    const mentah = localStorage.getItem(KUNCI_VOLUME)
    // Nilai yang belum pernah disimpan harus dibedakan dari nilai 0 yang memang
    // disimpan. `Number(null)` bernilai 0 dan LOLOS pemeriksaan rentang, sehingga
    // setiap pengunjung pertama mendapat volume nol — radio menyala tapi bisu.
    if (mentah === null || mentah === '') return VOLUME_AWAL
    const v = Number(mentah)
    return Number.isFinite(v) && v >= 0 && v <= 1 ? v : VOLUME_AWAL
  } catch {
    // Mode penyamaran / penyimpanan diblokir — jangan sampai menjatuhkan halaman.
    return VOLUME_AWAL
  }
}

let audio = null

/** Dibuat saat pertama dibutuhkan, bukan saat modul dimuat: membuat elemen
 *  audio saat impor akan gagal di lingkungan tanpa DOM (mis. build SSR). */
function ambilAudio() {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'none'
  // crossOrigin SENGAJA TIDAK diset. Server RRI mengirim header
  // `Access-Control-Allow-Origin: *` DUA KALI; menurut spesifikasi header itu
  // hanya boleh muncul sekali, dan browser menolak responsnya begitu diminta
  // dalam mode CORS — yang persis terjadi bila crossOrigin diisi. Akibatnya
  // seluruh kanal gagal diputar.
  //
  // Mode no-cors (bawaan) mengabaikan header ganda itu dan memutar normal.
  // Kita memang tidak butuh CORS: audionya hanya diputar, tidak dianalisis
  // Web Audio API.
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
