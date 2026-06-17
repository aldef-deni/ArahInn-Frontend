import { createContext, useContext } from 'react'

/**
 * Menyimpan moda transaksi travel aktif (mis. 'pesawat') agar footer di UserLayout
 * bisa menampilkan varian khusus pada halaman pembayaran (/tiket/bayar/:id yang
 * dipakai bersama semua moda). Nilai context = fungsi setter moda.
 */
export const TravelFooterContext = createContext(() => {})
export const useSetTravelModa = () => useContext(TravelFooterContext)
