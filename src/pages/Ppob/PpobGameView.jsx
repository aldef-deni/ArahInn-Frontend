import { useMemo, useState, useEffect } from 'react'
import { formatRupiah } from '@/utils'
import { Gamepad2, AlertCircle, Loader2, Check } from 'lucide-react'

/**
 * Layout khusus Top Up Game Online:
 * - Card pilih game (Mobile Legends, Free Fire, PUBG, Genshin, dst) — diklasifikasi dari nama produk
 * - Input User ID (+ Server/Zone untuk game yang butuh, mis. Mobile Legends & Genshin)
 * - Grid nominal voucher (fixed price per produk)
 *
 * Props:
 *   products, loadingProducts, customerNumber (User ID), onCustomerChange,
 *   selectedProduct, onSelectProduct, onExtraChange (→ { server })
 */

// Keyword → judul game. Nama vendor pola: "MOBILE LEGENDS 86 DIAMOND", "PUBG MOBILE 60 UC", dst.
// needsServer → tampilkan kolom Server/Zone (wajib) sebelum bisa lanjut.
const GAME_BRANDS = [
  { id: 'ML',       label: 'Mobile Legends',   match: /MOBILE\s*LEGEND|MLBB/,                 needsServer: true,  serverLabel: 'Zone ID', serverPlaceholder: 'Contoh: 2325',                 color: 'bg-blue-600',   soft: 'bg-blue-50',   accent: 'text-blue-700',   border: 'border-blue-600' },
  { id: 'FF',       label: 'Free Fire',        match: /FREE\s*FIRE|GARENA\s*FF/,              needsServer: false, color: 'bg-orange-500', soft: 'bg-orange-50', accent: 'text-orange-700', border: 'border-orange-500' },
  { id: 'PUBG',     label: 'PUBG Mobile',      match: /PUBG/,                                 needsServer: false, color: 'bg-amber-600',  soft: 'bg-amber-50',  accent: 'text-amber-700',  border: 'border-amber-600' },
  { id: 'GENSHIN',  label: 'Genshin Impact',   match: /GENSHIN/,                              needsServer: true,  serverLabel: 'Server', serverPlaceholder: 'Asia / America / Europe / TW-HK-MO', color: 'bg-cyan-600',   soft: 'bg-cyan-50',   accent: 'text-cyan-700',   border: 'border-cyan-600' },
  { id: 'HSR',      label: 'Honkai: Star Rail',match: /HONKAI\s*STAR|STAR\s*RAIL/,            needsServer: true,  serverLabel: 'Server', serverPlaceholder: 'Asia / America / Europe / TW-HK-MO', color: 'bg-violet-600', soft: 'bg-violet-50', accent: 'text-violet-700', border: 'border-violet-600' },
  { id: 'HI',       label: 'Honkai Impact 3',  match: /HONKAI\s*IMPACT/,                      needsServer: true,  serverLabel: 'Server', serverPlaceholder: 'Asia / America / Europe / TW-HK-MO', color: 'bg-fuchsia-600',soft: 'bg-fuchsia-50',accent: 'text-fuchsia-700',border: 'border-fuchsia-600' },
  { id: 'VALORANT', label: 'Valorant',         match: /VALORANT/,                             needsServer: false, color: 'bg-rose-600',   soft: 'bg-rose-50',   accent: 'text-rose-700',   border: 'border-rose-600' },
  { id: 'CODM',     label: 'COD Mobile',       match: /CALL\s*OF\s*DUTY|COD\s*MOBILE|\bCODM\b/,needsServer: false, color: 'bg-slate-700',  soft: 'bg-slate-100', accent: 'text-slate-700',  border: 'border-slate-700' },
  { id: 'AOV',      label: 'Arena of Valor',   match: /ARENA\s*OF\s*VALOR|\bAOV\b/,           needsServer: false, color: 'bg-indigo-600', soft: 'bg-indigo-50', accent: 'text-indigo-700', border: 'border-indigo-600' },
  { id: 'PB',       label: 'Point Blank',      match: /POINT\s*BLANK/,                        needsServer: false, color: 'bg-red-700',    soft: 'bg-red-50',    accent: 'text-red-700',    border: 'border-red-700' },
  { id: 'SM',       label: 'Sausage Man',      match: /SAUSAGE\s*MAN/,                        needsServer: false, color: 'bg-pink-500',   soft: 'bg-pink-50',   accent: 'text-pink-700',   border: 'border-pink-500' },
  { id: 'AER',      label: 'Undawn / Lainnya', match: /UNDAWN/,                               needsServer: false, color: 'bg-teal-600',   soft: 'bg-teal-50',   accent: 'text-teal-700',   border: 'border-teal-600' },
]

const OTHER_GAME = { id: 'OTHER', label: 'Game Lainnya', needsServer: false, color: 'bg-slate-600', soft: 'bg-slate-50', accent: 'text-slate-700', border: 'border-slate-600' }

function classifyGame(name) {
  const n = (name || '').toUpperCase()
  for (const g of GAME_BRANDS) {
    if (g.match.test(n)) return g.id
  }
  return 'OTHER'
}

// Buang judul game dari nama voucher → tampil ringkas ("86 DIAMOND").
function voucherLabel(name, brand) {
  if (!brand?.match) return name
  const cleaned = (name || '').replace(brand.match, '').replace(/\s{2,}/g, ' ').trim()
  return cleaned || name
}

export default function PpobGameView({
  products,
  loadingProducts,
  customerNumber,
  onCustomerChange,
  selectedProduct,
  onSelectProduct,
  onExtraChange,
}) {
  const [selectedGame, setSelectedGame] = useState(null)
  const [server, setServer]             = useState('')

  // Group products by game
  const grouped = useMemo(() => {
    const out = {}
    for (const p of products) {
      const id = classifyGame(p.name)
      if (!out[id]) out[id] = []
      out[id].push(p)
    }
    for (const id of Object.keys(out)) {
      out[id].sort((a, b) => (a.priceSell || 0) - (b.priceSell || 0))
    }
    return out
  }, [products])

  // Daftar game yang ada produknya
  const availableGames = useMemo(() => {
    const list = []
    for (const g of GAME_BRANDS) {
      if (grouped[g.id]?.length > 0) list.push(g)
    }
    if (grouped['OTHER']?.length > 0) list.push(OTHER_GAME)
    return list
  }, [grouped])

  const gameProducts = selectedGame ? (grouped[selectedGame.id] || []) : []
  const needsServer   = !!selectedGame?.needsServer
  const serverReady   = !needsServer || server.trim().length > 0

  // Reset saat ganti game
  useEffect(() => {
    setServer('')
    onSelectProduct(null)
    onExtraChange?.({})
  }, [selectedGame]) // eslint-disable-line

  // Server → extra (untuk game yang butuh)
  useEffect(() => {
    onExtraChange?.(needsServer && server.trim() ? { server: server.trim() } : {})
    // kalau server jadi kosong padahal wajib, batalkan pilihan produk agar CTA disabled
    if (needsServer && !server.trim() && selectedProduct) onSelectProduct(null)
  }, [server, needsServer]) // eslint-disable-line

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Step 1: Pilih Game */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">1. Pilih Game</p>

        {loadingProducts && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat game...
          </div>
        )}

        {!loadingProducts && availableGames.length === 0 && (
          <div className="text-center py-8">
            <Gamepad2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">Belum ada game tersedia.</p>
            <p className="text-[11px] text-slate-400 mt-1">Tim sedang request akses ke vendor.</p>
          </div>
        )}

        {!loadingProducts && availableGames.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {availableGames.map(g => {
              const active = selectedGame?.id === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGame(g)}
                  className={`relative aspect-square sm:aspect-auto sm:p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-[0.96] overflow-hidden p-2 ${
                    active ? `${g.border} ${g.soft} shadow-sm` : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center ${g.color}`}>
                    <Gamepad2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className={`text-[10px] sm:text-xs font-bold text-center leading-tight ${active ? g.accent : 'text-slate-800'}`}>
                    {g.label}
                  </p>
                  {active && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Check className={`w-3 h-3 ${g.accent}`} strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Step 2: User ID (+ Server/Zone) */}
      {selectedGame && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">
            2. Data Akun {selectedGame.label}
          </p>
          <div className={`grid gap-2.5 ${needsServer ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
            <input
              type="tel"
              inputMode="numeric"
              value={customerNumber}
              onChange={e => onCustomerChange(e.target.value.replace(/\D/g, ''))}
              placeholder="User ID"
              className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ${needsServer ? 'sm:col-span-2' : ''}`}
            />
            {needsServer && (
              <input
                type="text"
                value={server}
                onChange={e => setServer(e.target.value)}
                placeholder={selectedGame.serverPlaceholder || selectedGame.serverLabel}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            {needsServer
              ? `Isi User ID dan ${selectedGame.serverLabel}. Pastikan benar — top up tidak bisa dibatalkan.`
              : 'Pastikan User ID benar. Top up tidak bisa dibatalkan setelah diproses.'}
          </p>
        </div>
      )}

      {/* Step 3: Pilih Nominal */}
      {selectedGame && customerNumber.length >= 4 && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">
            3. Pilih Nominal
          </p>

          {needsServer && !serverReady && (
            <p className="mb-3 text-[11px] sm:text-xs text-amber-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Isi {selectedGame.serverLabel} dulu di atas.
            </p>
          )}

          {gameProducts.length === 0 && (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Belum ada nominal {selectedGame.label} tersedia.</p>
            </div>
          )}

          {gameProducts.length > 0 && (
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 ${!serverReady ? 'opacity-50 pointer-events-none' : ''}`}>
              {gameProducts.map(p => {
                const active = selectedProduct?.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className={`relative p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.97] overflow-hidden ${
                      active ? `${selectedGame.border} ${selectedGame.soft} shadow-sm` : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-8 h-8 ${selectedGame.color} opacity-10 rounded-bl-3xl`} />
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight line-clamp-2 min-h-[28px] sm:min-h-[32px] relative">
                      {voucherLabel(p.name, selectedGame)}
                    </p>
                    <p className="mt-2 text-sm sm:text-base font-bold text-brand relative">{formatRupiah(p.priceSell)}</p>
                    {active && (
                      <div className={`absolute -top-px -right-px w-5 h-5 ${selectedGame.color} rounded-bl-lg rounded-tr-xl flex items-center justify-center`}>
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
    </div>
  )
}
