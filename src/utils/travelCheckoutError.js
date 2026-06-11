// Ubah error checkout travel jadi pesan yang JELAS & ramah untuk customer.
// - 422 dari validasi Laravel (punya `errors`) → tunjuk field bermasalah dlm Bahasa Indonesia
// - error bisnis (promo/vendor, punya `message`) → tampilkan apa adanya (sudah Indonesia)
const FIELD_LABELS = {
  name: 'Nama penumpang', first_name: 'Nama depan penumpang', last_name: 'Nama belakang penumpang',
  birthdate: 'Tanggal lahir penumpang', birth_date: 'Tanggal lahir penumpang',
  id_number: 'No. identitas (KTP/Paspor) penumpang', identity_number: 'No. identitas (KTP/Paspor) penumpang',
  phone: 'No. HP', email: 'Email', gender: 'Jenis kelamin penumpang',
  title: 'Sapaan (Tn/Ny) penumpang',
  price: 'Harga tiket', price_adult: 'Harga tiket', harga_dewasa: 'Harga tiket dewasa',
  flights: 'Data penerbangan', airline: 'Maskapai', departure: 'Bandara keberangkatan',
  arrival: 'Bandara tujuan', departure_date: 'Tanggal keberangkatan',
  origin: 'Asal', destination: 'Tujuan', date: 'Tanggal', train_number: 'Nomor kereta',
  ship_number: 'Nomor kapal', sub_class: 'Kelas kabin', class: 'Kelas',
  adults: 'Data penumpang dewasa',
}

export function travelCheckoutError(e) {
  const res  = e?.response
  const data = res?.data

  if (res?.status === 422 && data?.errors && typeof data.errors === 'object') {
    const firstKey = Object.keys(data.errors)[0] || ''
    const leaf     = firstKey.split('.').pop()
    const label    = FIELD_LABELS[leaf] || FIELD_LABELS[firstKey] || 'Data pemesanan'
    return `${label} belum lengkap atau tidak sesuai. Mohon periksa kembali sebelum melanjutkan ke pembayaran.`
  }

  // Error bisnis (mis. kode promo, kuota, booking vendor gagal) — biasanya sudah jelas
  if (data?.message) return data.message

  return 'Maaf, pesanan gagal diproses. Mohon periksa kembali data Anda dan coba lagi.'
}
