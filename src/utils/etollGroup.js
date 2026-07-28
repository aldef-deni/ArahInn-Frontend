// Klasifikasi produk E-Toll / uang elektronik ke bank penerbit (dari pola nama).
export const ETOLL_GROUP_KEYS = ['Brizzi (BRI)', 'e-Money (Mandiri)', 'TapCash (BNI)', 'Flazz (BCA)', 'Lainnya']

export function etollGroup(name) {
  const u = String(name || '').toUpperCase()
  if (u.includes('BRIZZI')) return 'Brizzi (BRI)'
  if (u.includes('FLAZZ')) return 'Flazz (BCA)'
  if (u.includes('TAPCASH') || u.includes('BNI')) return 'TapCash (BNI)'
  if (u.includes('MANDIRI') || u.includes('E-MONEY') || u.includes('EMONEY')) return 'e-Money (Mandiri)'
  return 'Lainnya'
}

export function etollGroupsAvailable(products) {
  const present = new Set(products.map(p => etollGroup(p.name)))
  return ETOLL_GROUP_KEYS.filter(k => present.has(k))
}
