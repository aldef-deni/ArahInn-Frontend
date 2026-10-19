import { useMemo, useState, useEffect } from 'react'
import { formatRupiah } from '@/utils'
import { Smartphone, Wifi, AlertCircle, Loader2, ChevronDown, Check } from 'lucide-react'

/**
 * Layout khusus Pulsa & Paket Data:
 * - Input nomor HP dengan auto-detect operator dari prefix
 * - Tabs: Pulsa | Paket Data
 * - Card grid produk per operator, sorted by nominal
 *
 * Props:
 *   products            - array of products from API
 *   loadingProducts     - boolean
 *   customerNumber      - controlled value
 *   onCustomerChange    - setter
 *   selectedProduct
 *   onSelectProduct
 */

// Deteksi operator HIERARKIS: cek prefix 6 digit dulu (mengisolasi by.U dari blok 0851
// yang juga dipakai Telkomsel Kartu As lama), lalu fallback ke prefix 4 digit.
const BYU_PREFIX6 = ['085155','085156','085157','085158','085159']  // sub-blok by.U (bisa diperluas)

// Prefiks yang TIDAK bisa diputuskan dari angkanya saja.
//
// 0851 dipakai Telkomsel reguler DAN by.U, dan daftar sub-blok 6 digit di atas
// hanya menutup sebagian kecilnya — sumber publik pun saling bertentangan soal
// batas rentangnya. Sebelum ini, nomor 0851 di luar sub-blok itu diklaim
// "Telkomsel" dengan penuh percaya diri dan tanpa peringatan apa pun, sehingga
// pemilik kartu by.U membeli produk Telkomsel, membayarnya, lalu ditolak
// vendor. Re-hit mengirim kode produk yang sama, jadi kegagalannya abadi.
//
// Deteksinya tetap dipakai sebagai dugaan awal, tetapi pelanggan HARUS
// diberitahu bahwa dugaan itu bisa salah dan bisa ia ganti sendiri.
const AMBIGU_PREFIX4 = ['0851']
export function isAmbiguousPrefix(phone) {
  const n = String(phone || '').replace(/\D/g, '').replace(/^62/, '0')
  return n.length >= 4 && AMBIGU_PREFIX4.includes(n.substring(0, 4))
}
const OPERATOR_PREFIX4 = {
  '0811':'Telkomsel','0812':'Telkomsel','0813':'Telkomsel','0821':'Telkomsel','0822':'Telkomsel',
  '0823':'Telkomsel','0851':'Telkomsel','0852':'Telkomsel','0853':'Telkomsel',
  '0814':'Indosat','0815':'Indosat','0816':'Indosat','0855':'Indosat','0856':'Indosat','0857':'Indosat','0858':'Indosat',
  '0817':'XL','0818':'XL','0819':'XL','0859':'XL','0877':'XL','0878':'XL',
  '0831':'Axis','0832':'Axis','0833':'Axis','0838':'Axis',
  '0895':'Tri','0896':'Tri','0897':'Tri','0898':'Tri','0899':'Tri',
  '0881':'Smartfren','0882':'Smartfren','0883':'Smartfren','0884':'Smartfren','0885':'Smartfren',
  '0886':'Smartfren','0887':'Smartfren','0888':'Smartfren','0889':'Smartfren',
}

const OPERATOR_STYLES = {
  Telkomsel: { color: '#dc2626', bg: 'bg-red-500',     accent: 'text-red-600',     border: 'border-red-500' },
  byU:       { color: '#7c3aed', bg: 'bg-violet-600',  accent: 'text-violet-600',  border: 'border-violet-600' },
  Indosat:   { color: '#facc15', bg: 'bg-yellow-400',  accent: 'text-yellow-600',  border: 'border-yellow-400' },
  XL:        { color: '#0ea5e9', bg: 'bg-sky-500',     accent: 'text-sky-600',     border: 'border-sky-500' },
  Axis:      { color: '#6366f1', bg: 'bg-indigo-500',  accent: 'text-indigo-600',  border: 'border-indigo-500' },
  Tri:       { color: '#1e293b', bg: 'bg-slate-800',   accent: 'text-slate-800',   border: 'border-slate-800' },
  Smartfren: { color: '#dc2626', bg: 'bg-red-600',     accent: 'text-red-700',     border: 'border-red-600' },
  Fren:      { color: '#737373', bg: 'bg-neutral-500', accent: 'text-neutral-600', border: 'border-neutral-500' },
}

const OPERATORS_LIST = ['Telkomsel', 'byU', 'Indosat', 'XL', 'Axis', 'Tri', 'Smartfren']

function normalizePhone(phone) {
  let n = String(phone || '').replace(/\D/g, '')
  if (n.startsWith('62')) n = '0' + n.slice(2)
  return n
}
function detectOperator(phone) {
  const n = normalizePhone(phone)
  if (n.length < 4) return null
  if (BYU_PREFIX6.includes(n.substring(0, 6))) return 'byU'   // isolasi by.U (6 digit)
  return OPERATOR_PREFIX4[n.substring(0, 4)] ?? null
}

// Prefix UMUM pascabayar → tak bisa beli pulsa/paket prabayar. Rajabiller tak sediakan HLR,
// jadi pakai prefix: Halo(0811), Matrix(0815/0816/0855), XL Prioritas(0817).
const POSTPAID_PREFIX4 = ['0811', '0815', '0816', '0855', '0817']
export function isPostpaidNumber(phone) {
  const n = normalizePhone(phone)
  return n.length >= 4 && POSTPAID_PREFIX4.includes(n.substring(0, 4))
}

// Produk byU (sub-brand Telkomsel) — dipisah ke grup operator "byU" tersendiri.
function isByUProduct(name) {
  return /\bBYU\b|BY\.?U\b/.test(name)
}

// Varian pulsa NON-REGULER (transfer, nelpon/SMS, perpanjang masa aktif) —
// disembunyikan dari tab Pulsa agar hanya isi ulang nominal standar yang tampil.
function isSpecialPulsa(name) {
  return /TRANSFER|NELPON|NELPUN|\bMENIT\b|TELEPON|\bSMS\b|MASA\s*AKTIF|TAMBAH\s*MASA/.test(name)
}

// Klasifikasi:
//   'data'  → produk paket data (keyword)
//   'other' → varian pulsa khusus (transfer/nelpon/masa aktif/byU) → DISEMBUNYIKAN
//   'pulsa' → pulsa reguler (isi ulang nominal) → tampil di tab Pulsa
function classifyType(p) {
  const name = (p.name || '').toUpperCase()
  if (/DATA|GB\b|MB\b|KUOTA|PAKET|FLASH|ORBIT|HOOQ|HOTROD|FREEDOM|YELLOW|XTRA|UNLIMIT|NETFLIX|XCS|VPN|ROAMING/.test(name)) {
    return 'data'
  }
  if (isSpecialPulsa(name)) return 'other'
  return 'pulsa'
}

// Nominal pulsa reguler yang ANDAL. Penamaan vendor tidak konsisten:
// "200RB"=200rb, "1000RB"=1jt, tapi "35000RB"=35rb (angka sudah rupiah).
// Solusi: ambil angka terakhir dari nama, lalu pilih interpretasi (rupiah vs ×1000)
// yang PALING DEKAT dengan harga jual — harga = sumber kebenaran.
function pulsaNominal(p) {
  const price = Number(p.priceSell ?? p.price_sell) || 0
  const groups = (p.name || '').match(/[\d][\d.]*/g)
  let n = groups ? parseInt(groups[groups.length - 1].replace(/\./g, ''), 10) : 0
  if (!n) return Number(p.nominal) || price
  const cands = [n, n * 1000]
  return cands.reduce((best, c) => (Math.abs(c - price) < Math.abs(best - price) ? c : best))
}

// Format nominal: 5000 → "5 Ribu", 200000 → "200 Ribu", 1000000 → "1 Juta".
function formatNominalLabel(n) {
  if (n >= 1000000) {
    const juta = n / 1000000
    return `${juta % 1 === 0 ? juta : juta.toFixed(1).replace('.', ',')} Juta`
  }
  const ribu = n / 1000
  return `${ribu % 1 === 0 ? ribu : ribu.toFixed(1).replace('.', ',')} Ribu`
}

// Area/region paket data (banyak paket data bersifat regional). Terdeteksi dari NAMA
// produk; tanpa kata kunci area → 'nasional' (selalu ditampilkan). Urutan = urutan tampil.
const DATA_REGIONS = {
  jabodetabek: { label: 'Jabodetabek',      kw: /JABODETABEK|JADETABEK|JABOTABEK|BODETABEK|\bDKI\b|\bJAKARTA\b|\bBEKASI\b|\bDEPOK\b|TANGERANG|\bBOGOR\b/ },
  jabar:       { label: 'Jawa Barat',        kw: /\bJABAR\b|JAWA\s*BARAT|WEST\s*JAVA|\bBANDUNG\b|CIREBON|PRIANGAN|TASIKMALAYA|SUKABUMI/ },
  jateng:      { label: 'Jawa Tengah & DIY', kw: /\bJATENG\b|JAWA\s*TENGAH|CENTRAL\s*JAVA|\bDIY\b|YOGYA|JOGJA|SEMARANG|\bSOLO\b|PURWOKERTO|MAGELANG/ },
  jatim:       { label: 'Jawa Timur',        kw: /\bJATIM\b|JAWA\s*TIMUR|EAST\s*JAVA|SURABAYA|\bMALANG\b|MADURA|\bKEDIRI\b|JEMBER/ },
  balinusra:   { label: 'Bali & Nusra',      kw: /\bBALI\b|NUSRA|NUSA\s*TENGGARA|\bNTB\b|\bNTT\b|LOMBOK|DENPASAR|MATARAM|KUPANG/ },
  sumatera:    { label: 'Sumatera',          kw: /SUMATERA|SUMATRA|SUMBAGUT|SUMBAGTENG|SUMBAGSEL|\bSUMUT\b|\bSUMSEL\b|\bSUMBAR\b|\bACEH\b|\bMEDAN\b|PALEMBANG|LAMPUNG|\bRIAU\b|\bPADANG\b|\bJAMBI\b|BENGKULU|\bBATAM\b|PEKANBARU/ },
  kalimantan:  { label: 'Kalimantan',        kw: /KALIMANTAN|\bKALBAR\b|\bKALTIM\b|\bKALSEL\b|\bKALTENG\b|KALTARA|BALIKPAPAN|PONTIANAK|BANJARMASIN|SAMARINDA/ },
  sulawesipua: { label: 'Sulawesi & Indonesia Timur', kw: /SULAWESI|\bSULSEL\b|\bSULUT\b|SULTENG|\bSULBAR\b|SULTRA|MAKASSAR|MANADO|\bPAPUA\b|\bMALUKU\b|\bAMBON\b|JAYAPURA|\bPUMA\b|SULMAPA|GORONTALO|TERNATE/ },
}

function detectDataRegion(name) {
  const up = (name || '').toUpperCase()
  for (const [key, r] of Object.entries(DATA_REGIONS)) {
    if (r.kw.test(up)) return key
  }
  return 'nasional'
}

// Seragamkan penyebutan operator pada nama produk (vendor tak konsisten:
// "TSEL" vs "TELKOMSEL", dst). Dipakai untuk nama paket data yang ditampilkan apa adanya.
function normalizeOperatorName(name) {
  return (name || '')
    .replace(/\bTSEL\b/gi, 'TELKOMSEL')
    .replace(/\bISAT\b/gi, 'INDOSAT')
    .replace(/\bSF\b/gi, 'SMARTFREN')
}

export default function PpobPulsaDataView({
  products,
  loadingProducts,
  customerNumber,
  onCustomerChange,
  selectedProduct,
  onSelectProduct,
}) {
  const [activeTab, setActiveTab]     = useState('pulsa')
  const [overrideOp, setOverrideOp]   = useState(null) // user manual pick
  const [showOpPicker, setShowOpPicker] = useState(false)
  const [dataArea, setDataArea]       = useState('nasional') // area paket data terpilih

  const detectedOp = detectOperator(customerNumber)
  const activeOp   = overrideOp || detectedOp

  // Reset override saat user ketik ulang nomor dengan prefix berbeda
  useEffect(() => {
    if (detectedOp && overrideOp && detectedOp !== overrideOp) setOverrideOp(null)
  }, [detectedOp]) // eslint-disable-line

  // Reset pilihan area saat ganti operator
  useEffect(() => { setDataArea('nasional') }, [activeOp])

  // Group products by operator + type
  const grouped = useMemo(() => {
    const out = {}
    OPERATORS_LIST.forEach(op => out[op] = { pulsa: [], data: [] })
    for (const p of products) {
      const name = (p.name || '').toUpperCase()
      // byU dipisah ke grup "byU"; produk Telkomsel byU TIDAK muncul di grup Telkomsel.
      const op = isByUProduct(name) ? 'byU' : (OPERATORS_LIST.includes(p.operator) ? p.operator : null)
      if (!op || op === 'Fren') continue
      const type = classifyType(p)
      if (type === 'other') continue   // sembunyikan varian khusus (transfer/nelpon/masa aktif)
      if (type === 'pulsa') {
        // Nama bersih: "{Operator} {Nominal} Ribu/Juta" (buang "SIMPATI / AS" dll).
        const nominal = pulsaNominal(p)
        out[op].pulsa.push({ ...p, _nominal: nominal, _display: `${op} ${formatNominalLabel(nominal)}` })
      } else {
        // Data: tandai area/region + seragamkan nama operator (TSEL → TELKOMSEL).
        out[op].data.push({ ...p, _region: detectDataRegion(name), _display: normalizeOperatorName(p.name) })
      }
    }
    // Sort ascending by nominal (pulsa) / harga (data)
    OPERATORS_LIST.forEach(op => {
      out[op].pulsa.sort((a, b) => (a._nominal || 0) - (b._nominal || 0))
      out[op].data.sort((a, b) => (a.priceSell || 0) - (b.priceSell || 0))
    })
    return out
  }, [products])

  const availableOps = OPERATORS_LIST.filter(op => grouped[op].pulsa.length + grouped[op].data.length > 0)
  const opProducts   = activeOp ? grouped[activeOp]?.[activeTab] || [] : []

  // Area yang tersedia pada paket data operator aktif (selain nasional), sesuai urutan DATA_REGIONS.
  const availableAreas = useMemo(() => {
    const set = new Set((grouped[activeOp]?.data || []).map(p => p._region))
    return Object.keys(DATA_REGIONS).filter(k => set.has(k))
  }, [grouped, activeOp])

  // Paket data disaring per area: tampilkan area terpilih + Nasional, sisanya hide.
  const shownProducts = activeTab === 'data'
    ? opProducts.filter(p => p._region === 'nasional' || p._region === dataArea)
    : opProducts

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Phone input with operator badge */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">Nomor HP</p>
        <div className="relative">
          <input
            type="tel"
            inputMode="numeric"
            value={customerNumber}
            onChange={e => onCustomerChange(e.target.value.replace(/\D/g, ''))}
            placeholder="081234567890"
            className="w-full px-4 py-3 pr-32 sm:pr-36 border border-slate-200 rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
          {customerNumber.length >= 4 && (
            <button
              onClick={() => setShowOpPicker(s => !s)}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold ${
                activeOp
                  ? `${OPERATOR_STYLES[activeOp].bg} text-white`
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {activeOp ? activeOp : 'Pilih operator'}
              <ChevronDown className="w-3 h-3" />
            </button>
          )}

          {/* Operator picker dropdown */}
          {showOpPicker && (
            <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-slate-200 rounded-xl shadow-lg w-56 overflow-hidden">
              <p className="text-[10px] uppercase font-bold text-slate-400 px-3 pt-2.5 pb-1">Pilih operator</p>
              {OPERATORS_LIST.map(op => {
                const styles = OPERATOR_STYLES[op]
                const isAvailable = grouped[op].pulsa.length + grouped[op].data.length > 0
                return (
                  <button
                    key={op}
                    onClick={() => { setOverrideOp(op); setShowOpPicker(false) }}
                    disabled={!isAvailable}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      activeOp === op ? 'bg-brand/5' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${styles.bg}`} />
                      {op}
                    </span>
                    {activeOp === op && <Check className="w-4 h-4 text-brand" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {!activeOp && customerNumber.length >= 4 && (
          <p className="mt-2 text-[11px] sm:text-xs text-amber-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Prefix tidak dikenali. Pilih operator manual.
          </p>
        )}
        {activeOp && detectedOp && overrideOp && detectedOp !== overrideOp && (
          <p className="mt-2 text-[11px] sm:text-xs text-amber-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Prefix {customerNumber.substring(0, 4)} biasanya {detectedOp}, tapi Anda pilih {overrideOp}.
          </p>
        )}
        {isAmbiguousPrefix(customerNumber) && !isPostpaidNumber(customerNumber) && (
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs font-semibold text-amber-800 leading-snug">
                Nomor <b>0851</b> bisa <b>Telkomsel</b> biasa ATAU <b>by.U</b>. Pastikan pilihan di bawah
                sesuai kartu Anda — salah pilih membuat transaksi <b>GAGAL</b>.
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              {['Telkomsel', 'byU'].map(op => (
                <button
                  key={op}
                  onClick={() => setOverrideOp(op)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-colors ${
                    activeOp === op
                      ? `${OPERATOR_STYLES[op].bg} text-white border-transparent`
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        )}
        {isPostpaidNumber(customerNumber) && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs font-semibold text-red-700 leading-snug">
              Nomor ini terdeteksi <b>PASCABAYAR</b> — tidak bisa membeli pulsa/paket data prabayar. Gunakan menu <b>Pascabayar / Bayar Tagihan</b> untuk membayar tagihannya.
            </p>
          </div>
        )}
      </div>

      {/* Tabs Pulsa | Paket Data — disembunyikan bila nomor pascabayar */}
      {activeOp && !isPostpaidNumber(customerNumber) && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
          <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1 gap-1 mb-4">
            {[
              { id: 'pulsa', label: 'Pulsa',      Icon: Smartphone, count: grouped[activeOp].pulsa.length },
              { id: 'data',  label: 'Paket Data', Icon: Wifi,       count: grouped[activeOp].data.length  },
            ].map(tab => {
              const TabIcon = tab.Icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); onSelectProduct(null) }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? 'bg-white text-brand shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    active ? 'bg-brand/10 text-brand' : 'bg-slate-200 text-slate-500'
                  }`}>{tab.count}</span>
                </button>
              )
            })}
          </div>

          {/* Pilih area (paket data regional) — area terpilih + Nasional yang tampil */}
          {activeTab === 'data' && availableAreas.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5">Area kartu</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {['nasional', ...availableAreas].map(area => {
                  const label = area === 'nasional' ? 'Nasional' : DATA_REGIONS[area].label
                  const on = dataArea === area
                  return (
                    <button
                      key={area}
                      onClick={() => { setDataArea(area); onSelectProduct(null) }}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        on ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-[10px] sm:text-[11px] text-slate-400 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                Area tidak bisa dideteksi dari nomor — pilih sesuai kartu. Paket Nasional selalu tampil.
              </p>
            </div>
          )}

          {/* Product grid */}
          {loadingProducts && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat produk...
            </div>
          )}
          {!loadingProducts && shownProducts.length === 0 && (
            <div className="text-center py-10">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">
                Belum ada {activeTab === 'pulsa' ? 'pulsa' : 'paket data'} untuk {activeOp}
                {activeTab === 'data' && dataArea !== 'nasional' ? ` area ${DATA_REGIONS[dataArea]?.label}` : ''}.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Coba operator/area lain atau cek lagi nanti.</p>
            </div>
          )}
          {!loadingProducts && shownProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {shownProducts.map(p => {
                const active = selectedProduct?.id === p.id
                const styles = OPERATOR_STYLES[activeOp]
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className={`group relative p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.97] overflow-hidden ${
                      active
                        ? `${styles.border} bg-brand/5 shadow-sm`
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
                    }`}
                  >
                    {/* Operator accent corner */}
                    <div className={`absolute top-0 right-0 w-8 h-8 ${styles.bg} opacity-10 rounded-bl-3xl`} />

                    <p className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight line-clamp-2 min-h-[28px] sm:min-h-[32px] relative">
                      {p._display || p.name}
                    </p>
                    <div className="mt-2 flex items-baseline gap-1 relative">
                      <span className="text-sm sm:text-base font-bold text-brand">{formatRupiah(p.priceSell)}</span>
                    </div>
                    {active && (
                      <div className="absolute -top-px -right-px w-5 h-5 bg-brand rounded-bl-lg rounded-tr-xl flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Pilih operator placeholder */}
      {!activeOp && customerNumber.length < 4 && (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-8 text-center">
          <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Masukkan nomor HP untuk lihat pilihan</p>
          <p className="text-[11px] text-slate-400 mt-1">Operator akan dideteksi otomatis</p>
        </div>
      )}
    </div>
  )
}
