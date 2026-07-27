// Klasifikasi produk Multifinance ke 5 jenis (dari pola nama).
export const MF_GROUP_KEYS = [
  'Leasing',
  'Pinjaman Online / Multiguna',
  'BPR & BPRS',
  'Koperasi / KSP',
  'Bank & Lainnya',
]

// Kata kunci brand leasing / pembiayaan (otomotif + WOM Finance dll).
const AUTO_KW = [
  'BCA FINANCE', 'MANDIRI TUNAS', 'MANDIRI UTAMA', 'BUSSAN', '(BAF)', 'AUTO FINANCE',
  'FIF', 'MPM', 'MEGA AUTO', 'MEGA CENTRAL', 'MEGA FINANCE', 'OTO MULTI', 'OTO SUMMIT',
  'RADANA', 'SMART FINANCE', 'SUZUKI FINANCE', 'TOYOTA ASTRA', '(TAF)', 'KREDITPLUS', 'WOM',
]

// Kata kunci fintech / pinjaman online / multiguna.
const ONLINE_KW = [
  'KREDIVO', 'PINJAMANGO', 'PINJAMDUIT', 'KTA KILAT', 'HOME CREDIT', 'HCI', 'FAZZ',
  'ADA MODAL', 'MODAL NASIONAL',
]

export function multifinanceGroup(name) {
  const up = String(name || '').toUpperCase().trim()

  // 1) BPR / BPRS — selalu diawali "BPR"/"BPRS".
  if (/^BPRS?\b/.test(up)) return 'BPR & BPRS'

  // 2) Koperasi / KSP / KSPPS / Kopdit.
  if (up.includes('KOPERASI') || /\bKSP\b/.test(up) || up.includes('KSPPS') || up.includes('KOPDIT')) {
    return 'Koperasi / KSP'
  }

  // 3) Leasing / pembiayaan (otomotif + WOM dll).
  if (AUTO_KW.some(k => up.includes(k))) return 'Leasing'

  // 4) Pinjaman online / multiguna.
  if (ONLINE_KW.some(k => up.includes(k))) return 'Pinjaman Online / Multiguna'

  // 5) Sisanya: bank & lembaga lain.
  return 'Bank & Lainnya'
}

// Grup yang ADA isinya (urut sesuai MF_GROUP_KEYS).
export function multifinanceGroupsAvailable(products) {
  const present = new Set(products.map(p => multifinanceGroup(p.name)))
  return MF_GROUP_KEYS.filter(k => present.has(k))
}
