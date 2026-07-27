// Klasifikasi produk Edukasi (~1350) ke 8 jenjang/jenis (dari pola nama).
export const EDU_GROUP_KEYS = [
  'TK & PAUD',
  'SD & MI',
  'SMP & MTs',
  'SMA/SMK & MA',
  'Perguruan Tinggi',
  'Pesantren',
  'Bimbel & Kursus',
  'Lainnya',
]

export function eduGroup(name) {
  const u = String(name || '').toUpperCase()
  const words = u.split(/[^A-Z]+/).filter(Boolean)      // token huruf saja
  const has = (kw) => u.includes(kw)
  const hasWord = (w) => words.includes(w)
  const inSet = (arr) => arr.some(w => words.includes(w))

  // 1) Perguruan Tinggi (paling khas — cek dulu)
  if (has('UNIVERSITAS') || has('INSTITUT') || has('POLITEKNIK') || has('POLTEK') ||
      has('AKADEMI') || has('AKPER') || has('AKBID') || has('SEKOLAH TINGGI') ||
      hasWord('UNIV') || hasWord('UIN') || hasWord('IAIN') || hasWord('STIE') ||
      hasWord('STMIK') || hasWord('STIKES') || hasWord('STT') || hasWord('STAI') ||
      hasWord('STAIN') || hasWord('STIBA') || hasWord('STIKOM') || hasWord('STISIP')) {
    return 'Perguruan Tinggi'
  }

  // 2) Pesantren
  if (has('PESANTREN') || has('PONPES') || has('PONDOK')) return 'Pesantren'

  // 3) Bimbel & Kursus / platform online
  if (has('BIMBEL') || has('KURSUS') || hasWord('LES') || has('ACADEMY') || has('LEARNING') ||
      has('RUANGGURU') || has('UDEMY') || has('PAHAMIFY') || has('SKILL') || has('KELAS PINTAR') ||
      has('SEKOLAHMU') || has('BAHASO') || has('CEREBRUM') || has('KITALULUS') || has('NIOMIC') ||
      has('VOSMED') || has('AYOBLAJAR') || has('PINTAR') || has('SKILL ACADEMY')) {
    return 'Bimbel & Kursus'
  }

  // 4) Jenjang sekolah (madrasah digabung sederajat)
  if (has('ALIYAH') || inSet(['SMA','SMAN','SMAS','SMK','SMKN','SMKS','SMKIT','MA','MAN','MAS','MAK','SMALB','SMAK'])) return 'SMA/SMK & MA'
  if (has('TSANAWIYAH') || inSet(['SMP','SMPN','SMPS','SMPIT','MTS','MTSN','MTSS'])) return 'SMP & MTs'
  if (has('IBTIDAIYAH') || inSet(['SD','SDN','SDS','SDIT','SDLB','MI','MIN','MIS'])) return 'SD & MI'
  if (inSet(['TK','TKN','TKS','TKIT','RA','RAUDHATUL','PAUD','KB','KOBER'])) return 'TK & PAUD'

  return 'Lainnya'
}

// Grup yang ADA isinya (urut sesuai EDU_GROUP_KEYS).
export function eduGroupsAvailable(products) {
  const present = new Set(products.map(p => eduGroup(p.name)))
  return EDU_GROUP_KEYS.filter(k => present.has(k))
}
