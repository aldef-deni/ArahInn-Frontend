// Menurunkan PROVINSI dari nama produk PDAM (Rajabiller tak menyimpan field wilayah).
// 1) Cek singkatan provinsi dalam tanda kurung: "PDAM KOTA SURABAYA (JATIM)".
// 2) Kalau tak ada, cocokkan kata kunci kabupaten/kota → provinsi.
// 3) Fallback: "Lainnya".

const PROV_ABBR = {
  'JATIM': 'Jawa Timur', 'JAWA TIMUR': 'Jawa Timur',
  'JATENG': 'Jawa Tengah', 'JAWA TENGAH': 'Jawa Tengah',
  'JABAR': 'Jawa Barat', 'JAWA BARAT': 'Jawa Barat',
  'BALI': 'Bali', 'BANTEN': 'Banten', 'DIY': 'DI Yogyakarta',
  'KALSEL': 'Kalimantan Selatan', 'KALTIM': 'Kalimantan Timur',
  'KALBAR': 'Kalimantan Barat', 'KALTENG': 'Kalimantan Tengah', 'KALTARA': 'Kalimantan Utara',
  'NTB': 'Nusa Tenggara Barat', 'NTT': 'Nusa Tenggara Timur',
  'SUMSEL': 'Sumatera Selatan', 'SUMUT': 'Sumatera Utara', 'SUMBAR': 'Sumatera Barat',
  'SULSEL': 'Sulawesi Selatan', 'SULUT': 'Sulawesi Utara', 'SULTENG': 'Sulawesi Tengah',
  'SULTRA': 'Sulawesi Tenggara', 'SULBAR': 'Sulawesi Barat',
}

// Urut: kata kunci compound/ambigu diletakkan LEBIH DULU (first-match menang).
const KEYWORD_PAIRS = [
  // ── Ambigu / compound (harus dulu) ──
  ['BONE BALANGO', 'Gorontalo'], ['BONE BOLANGO', 'Gorontalo'], ['GORONTALO', 'Gorontalo'], ['BOALEMO', 'Gorontalo'],
  ['SUMBAWA', 'Nusa Tenggara Barat'],           // sebelum "SUMBA"
  ['TANJUNG PINANG', 'Kepulauan Riau'], ['TANJUNGBALAI', 'Sumatera Utara'], ['TANJUNGBALAI', 'Sumatera Utara'],
  ['KOTAWARINGIN', 'Kalimantan Tengah'], ['PANGKALAN BUN', 'Kalimantan Tengah'],
  ['OGAN KOMERING', 'Sumatera Selatan'], ['OGAN ILIR', 'Sumatera Selatan'],
  ['HULU SUNGAI', 'Kalimantan Selatan'], ['INTAN BANJAR', 'Kalimantan Selatan'], ['BARABAI', 'Kalimantan Selatan'],
  ['LUWU', 'Sulawesi Selatan'], ['TORAJA', 'Sulawesi Selatan'], ['SIDENRENG', 'Sulawesi Selatan'], ['PANGKAJENE', 'Sulawesi Selatan'],
  ['MAMUJU', 'Sulawesi Barat'], ['POLEWALI', 'Sulawesi Barat'], ['MAJENE', 'Sulawesi Barat'],
  ['MALUKU BARAT DAYA', 'Maluku'], ['MALUKU TENGGARA', 'Maluku'], ['MALUKU TENGAH', 'Maluku'], ['TANIMBAR', 'Maluku'], ['AMBON', 'Maluku'],
  ['TIMOR TENGAH', 'Nusa Tenggara Timur'], ['MANGGARAI', 'Nusa Tenggara Timur'], ['SUMBA', 'Nusa Tenggara Timur'],
  ['BARITO KUALA', 'Kalimantan Selatan'], ['BARITO', 'Kalimantan Tengah'],
  ['KUTAI', 'Kalimantan Timur'], ['PENAJAM', 'Kalimantan Timur'], ['PASER', 'Kalimantan Timur'], ['BERAU', 'Kalimantan Timur'],
  ['BANGKA', 'Kepulauan Bangka Belitung'], ['BELITUNG', 'Kepulauan Bangka Belitung'], ['PANGKALPINANG', 'Kepulauan Bangka Belitung'],
  ['LAMPUNG', 'Lampung'], ['PESAWARAN', 'Lampung'], ['PRINGSEWU', 'Lampung'], ['TANGGAMUS', 'Lampung'], ['WAY GURUH', 'Lampung'],
  ['REJANG LEBONG', 'Bengkulu'], ['KEPAHIANG', 'Bengkulu'], ['LEBONG', 'Bengkulu'], ['BENGKULU', 'Bengkulu'],

  // ── Varian "BANJAR" (harus dulu, sebelum keyword BANJAR generik) ──
  ['BANJARNEGARA', 'Jawa Tengah'], ['BANJARMASIN', 'Kalimantan Selatan'], ['BANJARBARU', 'Kalimantan Selatan'],
  ['PEMKOT BANJAR', 'Jawa Barat'], ['KAB. BANJAR', 'Kalimantan Selatan'], ['KAB BANJAR', 'Kalimantan Selatan'],
  ['BARITO KUALA', 'Kalimantan Selatan'],           // sebelum "BARITO"
  ['PESISIR BARAT', 'Lampung'],                     // sebelum "PESISIR SELATAN"

  // ── Tambahan regency dari PBB ──
  ['ALOR', 'Nusa Tenggara Timur'], ['MALAKA', 'Nusa Tenggara Timur'], ['JEMBRANA', 'Bali'],
  ['BIMA', 'Nusa Tenggara Barat'], ['DOMPU', 'Nusa Tenggara Barat'],
  ['BINTAN', 'Kepulauan Riau'], ['ANAMBAS', 'Kepulauan Riau'], ['PANGKAL PINANG', 'Kepulauan Bangka Belitung'],
  ['MERANTI', 'Riau'], ['KUANTAN SINGINGI', 'Riau'], ['PELALAWAN', 'Riau'], ['ROKAN', 'Riau'], ['SIAK', 'Riau'],
  ['BULUKUMBA', 'Sulawesi Selatan'], ['JENEPONTO', 'Sulawesi Selatan'], ['SELAYAR', 'Sulawesi Selatan'], ['SOPPENG', 'Sulawesi Selatan'],
  ['BUTON', 'Sulawesi Tenggara'], ['KONAWE', 'Sulawesi Tenggara'], ['MUNA', 'Sulawesi Tenggara'], ['WAKATOBI', 'Sulawesi Tenggara'], ['BAUBAU', 'Sulawesi Tenggara'],
  ['MAMASA', 'Sulawesi Barat'], ['MAMUJU UTARA', 'Sulawesi Barat'],
  ['PARIGI MOUTONG', 'Sulawesi Tengah'],
  ['KAUR', 'Bengkulu'], ['SELUMA', 'Bengkulu'],
  ['MESUJI', 'Lampung'], ['TULANG BAWANG', 'Lampung'], ['WAY KANAN', 'Lampung'], ['METRO', 'Lampung'],
  ['LAMONGAN', 'Jawa Timur'], ['NAGAN RAYA', 'Aceh'],

  // ── Aceh ──
  ['ACEH', 'Aceh'], ['MEULABOH', 'Aceh'], ['GAYO LUES', 'Aceh'], ['PIDIE', 'Aceh'], ['LHOKSEUMAWE', 'Aceh'],
  ['SABANG', 'Aceh'], ['LANGSA', 'Aceh'], ['BENER MERIAH', 'Aceh'], ['BIREUEN', 'Aceh'], ['SIMEULUE', 'Aceh'], ['SINGKIL', 'Aceh'],

  // ── Sumatera Utara ──
  ['DELI SERDANG', 'Sumatera Utara'], ['MEDAN', 'Sumatera Utara'], ['BINJAI', 'Sumatera Utara'],
  ['PEMATANG SIANTAR', 'Sumatera Utara'], ['KISARAN', 'Sumatera Utara'], ['NIAS', 'Sumatera Utara'],
  ['MANDAILING', 'Sumatera Utara'], ['KARO', 'Sumatera Utara'], ['TAPANULI', 'Sumatera Utara'],
  ['SIBOLGA', 'Sumatera Utara'], ['TEBING TINGGI', 'Sumatera Utara'], ['DAIRI', 'Sumatera Utara'],
  ['LABUHAN BATU', 'Sumatera Utara'], ['BATUBARA', 'Sumatera Utara'], ['LANGKAT', 'Sumatera Utara'], ['SIMALUNGUN', 'Sumatera Utara'],

  // ── Sumatera Barat ──
  ['AGAM', 'Sumatera Barat'], ['BUKITTINGGI', 'Sumatera Barat'], ['LIMA PULUH KOTA', 'Sumatera Barat'],
  ['PADANG PARIAMAN', 'Sumatera Barat'], ['PADANG PANJANG', 'Sumatera Barat'], ['PAYAKUMBUH', 'Sumatera Barat'],
  ['SOLOK', 'Sumatera Barat'], ['SAWAHLUNTO', 'Sumatera Barat'], ['PASAMAN', 'Sumatera Barat'],
  ['TANAH DATAR', 'Sumatera Barat'], ['SIJUNJUNG', 'Sumatera Barat'], ['PESISIR SELATAN', 'Sumatera Barat'], ['PADANG', 'Sumatera Barat'],

  // ── Riau & Kepri ──
  ['DUMAI', 'Riau'], ['BENGKALIS', 'Riau'], ['KAMPAR', 'Riau'], ['INDRAGIRI', 'Riau'], ['PEKANBARU', 'Riau'],
  ['BATAM', 'Kepulauan Riau'], ['KARIMUN', 'Kepulauan Riau'], ['TIRTA KEPRI', 'Kepulauan Riau'], ['NATUNA', 'Kepulauan Riau'], ['LINGGA', 'Kepulauan Riau'],

  // ── Jambi ──
  ['MUARO JAMBI', 'Jambi'], ['KOTA JAMBI', 'Jambi'], ['MERANGIN', 'Jambi'], ['SAROLANGUN', 'Jambi'],
  ['TEBO', 'Jambi'], ['BATANGHARI', 'Jambi'], ['SUNGAI PENUH', 'Jambi'],

  // ── Sumatera Selatan ──
  ['PALEMBANG', 'Sumatera Selatan'], ['MUARA ENIM', 'Sumatera Selatan'], ['BANYUASIN', 'Sumatera Selatan'],
  ['LAHAT', 'Sumatera Selatan'], ['LUBUK LINGGAU', 'Sumatera Selatan'], ['PRABUMULIH', 'Sumatera Selatan'],

  // ── DKI Jakarta ──
  ['JAKARTA', 'DKI Jakarta'],

  // ── Jawa Barat ──
  ['BEKASI', 'Jawa Barat'], ['CIREBON', 'Jawa Barat'], ['INDRAMAYU', 'Jawa Barat'], ['KUNINGAN', 'Jawa Barat'],
  ['PANGANDARAN', 'Jawa Barat'], ['PURWAKARTA', 'Jawa Barat'], ['SUKABUMI', 'Jawa Barat'], ['BANDUNG', 'Jawa Barat'],
  ['BOGOR', 'Jawa Barat'], ['CIAMIS', 'Jawa Barat'], ['CIANJUR', 'Jawa Barat'], ['GARUT', 'Jawa Barat'],
  ['KARAWANG', 'Jawa Barat'], ['SUMEDANG', 'Jawa Barat'], ['SUBANG', 'Jawa Barat'], ['TASIKMALAYA', 'Jawa Barat'],
  ['BANJAR', 'Jawa Barat'], ['CIMAHI', 'Jawa Barat'], ['DEPOK', 'Jawa Barat'], ['MAJALENGKA', 'Jawa Barat'],

  // ── Jawa Tengah ──
  ['BANJARNEGARA', 'Jawa Tengah'], ['BANYUMAS', 'Jawa Tengah'], ['BATANG', 'Jawa Tengah'], ['BLORA', 'Jawa Tengah'],
  ['BOYOLALI', 'Jawa Tengah'], ['BREBES', 'Jawa Tengah'], ['CILACAP', 'Jawa Tengah'], ['DEMAK', 'Jawa Tengah'],
  ['GROBOGAN', 'Jawa Tengah'], ['JEPARA', 'Jawa Tengah'], ['KARANGANYAR', 'Jawa Tengah'], ['KEBUMEN', 'Jawa Tengah'],
  ['KENDAL', 'Jawa Tengah'], ['KLATEN', 'Jawa Tengah'], ['PEKALONGAN', 'Jawa Tengah'], ['PEMALANG', 'Jawa Tengah'],
  ['PURBALINGGA', 'Jawa Tengah'], ['PURWOREJO', 'Jawa Tengah'], ['REMBANG', 'Jawa Tengah'], ['SEMARANG', 'Jawa Tengah'],
  ['SRAGEN', 'Jawa Tengah'], ['SUKOHARJO', 'Jawa Tengah'], ['TEMANGGUNG', 'Jawa Tengah'], ['WONOGIRI', 'Jawa Tengah'],
  ['WONOSOBO', 'Jawa Tengah'], ['MAGELANG', 'Jawa Tengah'], ['SALATIGA', 'Jawa Tengah'], ['SURAKARTA', 'Jawa Tengah'],
  ['KOTA SOLO', 'Jawa Tengah'], ['KUDUS', 'Jawa Tengah'], ['TEGAL', 'Jawa Tengah'], ['PATI', 'Jawa Tengah'],

  // ── DI Yogyakarta ──
  ['BANTUL', 'DI Yogyakarta'], ['GUNUNG KIDUL', 'DI Yogyakarta'], ['KULON PROGO', 'DI Yogyakarta'], ['SLEMAN', 'DI Yogyakarta'],

  // ── Jawa Timur ──
  ['GRESIK', 'Jawa Timur'], ['BANGKALAN', 'Jawa Timur'], ['BANYUWANGI', 'Jawa Timur'], ['BLITAR', 'Jawa Timur'],
  ['BOJONEGORO', 'Jawa Timur'], ['BONDOWOSO', 'Jawa Timur'], ['JEMBER', 'Jawa Timur'], ['LUMAJANG', 'Jawa Timur'],
  ['MADIUN', 'Jawa Timur'], ['MAGETAN', 'Jawa Timur'], ['MALANG', 'Jawa Timur'], ['MOJOKERTO', 'Jawa Timur'],
  ['NGANJUK', 'Jawa Timur'], ['NGAWI', 'Jawa Timur'], ['PASURUAN', 'Jawa Timur'], ['PROBOLINGGO', 'Jawa Timur'],
  ['SAMPANG', 'Jawa Timur'], ['SIDOARJO', 'Jawa Timur'], ['SITUBONDO', 'Jawa Timur'], ['TRENGGALEK', 'Jawa Timur'],
  ['TUBAN', 'Jawa Timur'], ['TULUNGAGUNG', 'Jawa Timur'], ['KEDIRI', 'Jawa Timur'], ['SURABAYA', 'Jawa Timur'],
  ['PAMEKASAN', 'Jawa Timur'], ['SUMENEP', 'Jawa Timur'], ['PACITAN', 'Jawa Timur'], ['PONOROGO', 'Jawa Timur'],
  ['JOMBANG', 'Jawa Timur'], ['WISATA BATU', 'Jawa Timur'], ['KOTA BATU', 'Jawa Timur'], ['LAMONGAN', 'Jawa Timur'],

  // ── Banten ──
  ['TANGERANG', 'Banten'], ['TANGGERANG', 'Banten'], ['SERANG', 'Banten'], ['CILEGON', 'Banten'], ['LEBAK', 'Banten'], ['PANDEGLANG', 'Banten'],

  // ── Bali ──
  ['BADUNG', 'Bali'], ['GIANYAR', 'Bali'], ['BANGLI', 'Bali'], ['BULELENG', 'Bali'], ['KLUNGKUNG', 'Bali'],
  ['KARANGASEM', 'Bali'], ['DENPASAR', 'Bali'], ['TABANAN', 'Bali'],

  // ── NTB ──
  ['LOMBOK', 'Nusa Tenggara Barat'], ['MATARAM', 'Nusa Tenggara Barat'],

  // ── NTT ──
  ['BELU', 'Nusa Tenggara Timur'], ['KUPANG', 'Nusa Tenggara Timur'], ['FLORES', 'Nusa Tenggara Timur'],
  ['NGADA', 'Nusa Tenggara Timur'], ['LEMBATA', 'Nusa Tenggara Timur'], ['SIKKA', 'Nusa Tenggara Timur'],
  ['ROTE NDAO', 'Nusa Tenggara Timur'], ['ENDE', 'Nusa Tenggara Timur'],

  // ── Kalimantan Barat ──
  ['BENGKAYANG', 'Kalimantan Barat'], ['KUBU RAYA', 'Kalimantan Barat'], ['PONTIANAK', 'Kalimantan Barat'],
  ['SAMBAS', 'Kalimantan Barat'], ['SANGGAU', 'Kalimantan Barat'], ['SEKADAU', 'Kalimantan Barat'],
  ['SINTANG', 'Kalimantan Barat'], ['KAPUAS HULU', 'Kalimantan Barat'], ['KETAPANG', 'Kalimantan Barat'],
  ['LANDAK', 'Kalimantan Barat'], ['MEMPAWAH', 'Kalimantan Barat'], ['MELAWI', 'Kalimantan Barat'], ['SINGKAWANG', 'Kalimantan Barat'],

  // ── Kalimantan Tengah ──
  ['SERUYAN', 'Kalimantan Tengah'], ['SUKAMARA', 'Kalimantan Tengah'], ['GUNUNG MAS', 'Kalimantan Tengah'], ['PALANGKARAYA', 'Kalimantan Tengah'],

  // ── Kalimantan Selatan ──
  ['BALANGAN', 'Kalimantan Selatan'], ['BANJARMASIN', 'Kalimantan Selatan'], ['TABALONG', 'Kalimantan Selatan'],
  ['TANAH LAUT', 'Kalimantan Selatan'], ['TAPIN', 'Kalimantan Selatan'], ['TANAH BUMBU', 'Kalimantan Selatan'], ['KOTABARU', 'Kalimantan Selatan'],

  // ── Kalimantan Timur ──
  ['BALIKPAPAN', 'Kalimantan Timur'], ['SAMARINDA', 'Kalimantan Timur'], ['BONTANG', 'Kalimantan Timur'],

  // ── Kalimantan Utara ──
  ['BULUNGAN', 'Kalimantan Utara'], ['TANA TIDUNG', 'Kalimantan Utara'], ['TARAKAN', 'Kalimantan Utara'], ['NUNUKAN', 'Kalimantan Utara'],

  // ── Sulawesi Utara ──
  ['BOLAANG MONGONDOW', 'Sulawesi Utara'], ['SANGIHE', 'Sulawesi Utara'], ['BITUNG', 'Sulawesi Utara'],
  ['TOMOHON', 'Sulawesi Utara'], ['MINAHASA', 'Sulawesi Utara'], ['MANADO', 'Sulawesi Utara'],

  // ── Sulawesi Tengah ──
  ['DONGGALA', 'Sulawesi Tengah'], ['POSO', 'Sulawesi Tengah'], ['PALU', 'Sulawesi Tengah'],
  ['TOJO UNA', 'Sulawesi Tengah'], ['BANGGAI', 'Sulawesi Tengah'],

  // ── Sulawesi Selatan ──
  ['ENREKANG', 'Sulawesi Selatan'], ['BANTAENG', 'Sulawesi Selatan'], ['BARRU', 'Sulawesi Selatan'], ['BONE', 'Sulawesi Selatan'],
  ['GOWA', 'Sulawesi Selatan'], ['MAROS', 'Sulawesi Selatan'], ['SINJAI', 'Sulawesi Selatan'], ['TAKALAR', 'Sulawesi Selatan'],
  ['MAKASSAR', 'Sulawesi Selatan'], ['PALOPO', 'Sulawesi Selatan'], ['PAREPARE', 'Sulawesi Selatan'], ['PINRANG', 'Sulawesi Selatan'], ['WAJO', 'Sulawesi Selatan'],

  // ── Sulawesi Tenggara ──
  ['BOMBANA', 'Sulawesi Tenggara'], ['KENDARI', 'Sulawesi Tenggara'], ['KOLAKA', 'Sulawesi Tenggara'],

  // ── Maluku Utara ──
  ['HALMAHERA', 'Maluku Utara'], ['KEPULAUAN SULA', 'Maluku Utara'], ['TERNATE', 'Maluku Utara'],

  // ── Papua ──
  ['JAYAPURA', 'Papua'], ['SORONG', 'Papua Barat Daya'],
]

// Nama provinsi lengkap yang bisa muncul di nama produk (mis. PBB level provinsi).
const PROV_FULL = {
  'SUMATRA UTARA': 'Sumatera Utara', 'SUMATERA UTARA': 'Sumatera Utara',
  'SUMATRA BARAT': 'Sumatera Barat', 'SUMATERA BARAT': 'Sumatera Barat',
  'SUMATRA SELATAN': 'Sumatera Selatan', 'SUMATERA SELATAN': 'Sumatera Selatan',
}

export function pdamRegion(name) {
  const up = String(name || '').toUpperCase()
  // 1) singkatan provinsi dalam kurung
  const parens = up.match(/\(([^)]+)\)/g) || []
  for (const p of parens) {
    const inner = p.replace(/[()]/g, '').trim()
    if (PROV_ABBR[inner]) return PROV_ABBR[inner]
  }
  // 2) kata kunci kabupaten/kota
  for (const [kw, prov] of KEYWORD_PAIRS) {
    if (up.includes(kw)) return prov
  }
  // 3) nama/singkatan PROVINSI di mana saja (mis. "PROPINSI JATENG", "PROVINSI SUMATRA UTARA")
  for (const [full, prov] of Object.entries(PROV_FULL)) {
    if (up.includes(full)) return prov
  }
  for (const [abbr, prov] of Object.entries(PROV_ABBR)) {
    if (up.includes(` ${abbr}`) || up.endsWith(abbr)) return prov
  }
  return 'Lainnya'
}

// Daftar provinsi unik (terurut) dari sekumpulan produk, dgn "Lainnya" di akhir.
export function pdamProvinces(products) {
  const set = new Set(products.map(p => pdamRegion(p.name)))
  const list = [...set].filter(x => x !== 'Lainnya').sort((a, b) => a.localeCompare(b, 'id'))
  if (set.has('Lainnya')) list.push('Lainnya')
  return list
}
