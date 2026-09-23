import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Kewarganegaraan / negara domisili tamu, untuk properti mitra.
 *
 * Sebagian tarif hotel hanya boleh dijual kepada penduduk negara tertentu, jadi
 * supplier memerlukan kode negara untuk menentukan tarif mana yang boleh
 * ditampilkan. Nilainya WAJIB sama antara pencarian dan halaman detail: kalau
 * berbeda, tarif yang dipilih customer bisa lenyap saat prebook.
 *
 * Karena itu nilainya disimpan di satu tempat dan dibaca oleh kedua halaman,
 * bukan dititipkan lewat URL yang mudah tertinggal saat navigasi.
 *
 * Disimpan di localStorage supaya tidak perlu dipilih ulang tiap kunjungan.
 */
export const useResidencyStore = create(
  persist(
    (set) => ({
      // ISO 3166-1 alpha-2 huruf besar, mengikuti bentuk di src/data/countries.js.
      // Backend yang menurunkannya ke huruf kecil untuk ETG.
      residency: 'ID',
      setResidency: (code) => set({ residency: String(code || 'ID').toUpperCase() }),
    }),
    { name: 'arahinn-residency' },
  ),
)
