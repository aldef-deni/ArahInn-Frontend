import noImage from '@/assets/no-image.webp'

/**
 * Gambar pengganti untuk akomodasi yang tidak punya foto.
 *
 * Dipakai di SEMUA kartu akomodasi — milik ArahInn maupun properti mitra —
 * supaya keduanya terlihat sama. Sebelumnya kondisi ini ditampilkan sebagai
 * emoji di atas kotak abu, yang terbaca seperti gambar gagal dimuat.
 *
 * Kondisinya jauh dari langka: dari 742 hotel mitra yang tersinkron, 424
 * dikirim supplier tanpa satu pun gambar.
 *
 * Berkasnya 900×676 WebP ~30 KB (asalnya PNG 1,4 MB). Ukuran itu penting
 * karena gambar ini bisa muncul di puluhan kartu sekaligus dalam satu halaman
 * hasil pencarian.
 *
 * `alt` sengaja kosong dan `aria-hidden`: ini hiasan, bukan informasi. Nama
 * akomodasinya sudah ada sebagai teks tepat di sebelahnya, jadi pembaca layar
 * tidak perlu mendengar apa pun tentang gambar ini.
 */
export default function NoHotelImage({ className = '' }) {
  return (
    <img
      src={noImage}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`w-full h-full object-cover ${className}`}
    />
  )
}
