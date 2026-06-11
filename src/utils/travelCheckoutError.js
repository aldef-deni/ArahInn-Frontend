import i18n from '@/i18n'

// Ubah error checkout travel jadi pesan yang JELAS & ramah untuk customer (mengikuti bahasa aktif).
// - 422 dari validasi Laravel (punya `errors`) → tunjuk field bermasalah
// - error bisnis (promo/vendor, punya `message`) → tampilkan apa adanya (dari server)
const FIELD_KEYS = {
  name: 'f_name', first_name: 'f_firstName', last_name: 'f_lastName',
  birthdate: 'f_birthdate', birth_date: 'f_birthdate',
  id_number: 'f_idNumber', identity_number: 'f_idNumber',
  phone: 'f_phone', email: 'f_email', gender: 'f_gender',
  title: 'f_title',
  price: 'f_price', price_adult: 'f_price', harga_dewasa: 'f_price',
  flights: 'f_flights', airline: 'f_airline', departure: 'f_departure',
  arrival: 'f_arrival', departure_date: 'f_departureDate',
  origin: 'f_origin', destination: 'f_destination', date: 'f_date', train_number: 'f_trainNumber',
  ship_number: 'f_shipNumber', sub_class: 'f_subClass', class: 'f_class',
  adults: 'f_adults',
}

export function travelCheckoutError(e) {
  const t    = (k, o) => i18n.t(`travel.${k}`, o)
  const res  = e?.response
  const data = res?.data

  if (res?.status === 422 && data?.errors && typeof data.errors === 'object') {
    const firstKey = Object.keys(data.errors)[0] || ''
    const leaf     = firstKey.split('.').pop()
    const labelKey = FIELD_KEYS[leaf] || FIELD_KEYS[firstKey]
    const label    = labelKey ? t(labelKey) : t('errFieldDefault')
    return t('errIncomplete', { label })
  }

  // Error bisnis (mis. kode promo, kuota, booking vendor gagal) — biasanya sudah jelas dari server
  if (data?.message) return data.message

  return t('errGeneric')
}
