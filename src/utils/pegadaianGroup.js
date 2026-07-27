// Klasifikasi produk Pegadaian ke 3 jenis (dari pola nama).
export const PEGADAIAN_GROUP_KEYS = ['Cicilan Mikro', 'Gadai Ulang', 'Tebus']

export function pegadaianGroup(name) {
  // ⚠️ Buang kata "PEGADAIAN" dulu — mengandung "GADAI" yang bisa salah trigger Gadai Ulang.
  const up = String(name || '').toUpperCase().replace(/PEGADAIAN/g, '')
  if (up.includes('TEBUS')) return 'Tebus'
  if (up.includes('GADAI')) return 'Gadai Ulang'
  if (up.includes('CICILAN') || up.includes('MIKRO')) return 'Cicilan Mikro'
  return 'Cicilan Mikro'
}

// Grup yang ADA isinya (urut sesuai PEGADAIAN_GROUP_KEYS).
export function pegadaianGroupsAvailable(products) {
  const present = new Set(products.map(p => pegadaianGroup(p.name)))
  return PEGADAIAN_GROUP_KEYS.filter(k => present.has(k))
}
