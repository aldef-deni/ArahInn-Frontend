import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { wilayahApi } from '@/services/wilayahApi'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import {
  Check, ChevronDown, ChevronRight, ChevronUp, Loader2, Clock,
  ArrowLeft, Send, Save, Plus, Info, Copy, AlertCircle, ImageIcon, X, Star, Upload,
} from 'lucide-react'
import { cn } from '@/utils'
import MapEmbed from '@/components/ui/MapEmbed'

// ── Constants ──────────────────────────────────────────────────────────────
const GUEST_TYPES = [
  { id: 'keluarga',  label: 'Keluarga',        emoji: '👨‍👩‍👧' },
  { id: 'solo',      label: 'Wisatawan Solo',   emoji: '🧳' },
  { id: 'grup',      label: 'Wisatawan Grup',   emoji: '👥' },
  { id: 'pasangan',  label: 'Pasangan',         emoji: '💑' },
]
const PROPERTY_TYPES = ['Hotel', 'Apartment', 'Kosan', 'Guest House', 'Villa', 'Resort', 'Glamping']
const CURRENCIES = [
  { code: 'IDR', label: 'IDR - Rupiah Indonesia' },
  { code: 'USD', label: 'USD - Dollar Amerika' },
  { code: 'SGD', label: 'SGD - Dollar Singapura' },
  { code: 'MYR', label: 'MYR - Ringgit Malaysia' },
]
const JABATAN = [
  'General Manager', 'Front Office Manager', 'Revenue Manager',
  'Sales Manager', 'Marketing Manager', 'Operations Manager',
  'Owner / Pemilik', 'Lainnya',
]
const COUNTRIES = [
  'Indonesia', 'Malaysia', 'Singapura', 'Thailand', 'Australia',
  'Amerika Serikat', 'Belanda', 'Jepang', 'Lainnya',
]

const AGREEMENT_CHECKS = [
  'Saya menyatakan bahwa ini adalah bisnis akomodasi yang sah, semua lisensi dan izin yang diperlukan dapat ditunjukkan berdasarkan permintaan ArahInn.',
  'Saya menjamin bahwa data yang saya masukkan ke dalam Extranet adalah benar dan dapat dipertanggung jawabkan, serta membebaskan ArahInn dari segala kerugian yang timbul dari kesalahan dalam memasukkan data tersebut.',
  'ArahInn berhak untuk melakukan verifikasi dan menyelidiki rincian yang diberikan dalam pendaftaran ini.',
  'Saya telah membaca, menerima dan menyetujui Syarat & Ketentuan serta Kebijakan Privasi dari ArahInn.',
]

const PLATFORMS = ['Airbnb', 'Tripadvisor', 'Booking.com', 'Agoda.com', 'Traveloka', 'Pegipegi', 'Lainnya']

const PHOTO_CATEGORIES = [
  'Eksterior', 'Lobby / Resepsionis', 'Kamar Tidur', 'Kamar Mandi',
  'Kolam Renang', 'Restoran / Dapur', 'Fasilitas Umum',
  'Area Parkir', 'Pemandangan', 'Lainnya',
]

const FACILITY_GROUPS = [
  {
    label: 'Populer',
    items: [
      'AC', 'Antar/Jemput Bandara (biaya tambahan)', 'Bebas rokok',
      'Fitness', 'Kolam Renang', 'Layanan kamar 24 jam',
      'Layanan laundry/dry cleaning', 'Lemari es', 'Lift',
      'NIB Terdaftar', 'Parkir (gratis)', 'Penitipan bagasi',
      'Resepsionis 24 jam', 'Restoran', 'Shower',
      'Televisi', 'WiFi Gratis',
    ],
  },
  {
    label: 'Kamar & Kenyamanan',
    items: [
      'Brankas', 'Hair dryer', 'Kamar mandi dalam', 'Kursi tamu',
      'Meja kerja', 'Pengering rambut', 'Sarapan tersedia',
      'Setrika', 'Sofa', 'Tempat tidur ekstra',
    ],
  },
  {
    label: 'Transportasi & Aksesibilitas',
    items: [
      'Akses kursi roda', 'Antar jemput stasiun', 'Area parkir luas',
      'Parkir berbayar', 'Shuttle bus', 'Valet parking',
    ],
  },
]

const STEPS = [
  { id: 1, label: 'Tipe Tamu',         subtitle: 'Tipe tamu & kategori properti' },
  { id: 2, label: 'Info Umum',          subtitle: 'Info properti & lokasi' },
  { id: 3, label: 'Detail Kontak',      subtitle: 'Kontak PIC & telepon' },
  { id: 4, label: 'Detail Perjanjian',  subtitle: 'Legalitas & kemitraan' },
  { id: 5, label: 'Platform Lain',      subtitle: 'Listing di platform lain' },
  { id: 6, label: 'Fasilitas Properti', subtitle: 'Pilih min. 3 fasilitas' },
  { id: 7, label: 'Foto Properti',      subtitle: 'Upload min. 4 foto' },
  { id: 8,  label: 'Kebijakan Umum',     subtitle: 'Aturan & kebijakan properti' },
  { id: 9,  label: 'Detail Kamar',          subtitle: 'Tipe, fasilitas & foto kamar' },
  { id: 10, label: 'Review Detail Kamar',  subtitle: 'Periksa & tambah kamar' },
  { id: 11, label: 'Detail Pembayaran',    subtitle: 'Rekening, pajak & pembatalan' },
  { id: 12, label: 'Review Registrasi',    subtitle: 'Periksa dan kirimkan' },
]

const INIT = {
  // Step 1
  guestTypes: [], category: '',
  // Step 2
  name: '', alias: '', star_rating: null, is_brand_chain: false, currency: '',
  address: '', postal_code: '', province: '', city: '',
  district: '', village: '', country: 'Indonesia', latitude: '', longitude: '',
  // Step 3
  position: '', phone: '', property_phone: '', fax: '',
  // Step 4
  company_name: '', company_address: '', company_country: 'Indonesia',
  agree_name: '', agree_position: '', agree_email: '', agree_phone: '',
  check1: false, check2: false, check3: false, check4: false,
  // Step 5
  platforms: {}, platform_none: true,
  // Step 6
  facilities: [],
  // Step 7
  photo_groups: [{ id: 1, category: '', files: [], mainIdx: null }],
  // Step 8
  gender_policy: null, marriage_book: null, deposit_required: null,
  all_ages_allowed: null, breakfast_available: null,
  breakfast_start_hour: '06', breakfast_start_minute: '00',
  breakfast_end_hour: '10',   breakfast_end_minute: '00',
  smoking_allowed: null, alcohol_allowed: null, pets_allowed: null,
  // Step 11
  payment_method: '',
  bank_name: '', bank_branch: '', bank_account_name: '', bank_account_number: '',
  vcc_accepted_types: [], vcc_email: '', vcc_account_name: '',
  npwp_type: null,
  npwp_number: '', npwp_name: '', npwp_doc: null,
  nitku_number: '', nitku_name: '', nitku_doc: null,
  npwp_support_doc: null,
  npwp_agree1: false, npwp_agree2: false,
  cancellation_policy: '',
  registration_source: '',
  // Step 9
  rooms: [{
    id: 1, room_type: '', room_name: '', smoking_policy: null,
    price_threshold: '1000000', max_occupancy: 0, has_bedrooms: null,
    bed_configs: [{ id: 1, bed_type: '', bed_count: '' }],
    room_facilities: [],
    photo_groups: [{ id: 1, category: '', files: [], mainIdx: null }],
  }],
}

// ── Reusable: Wilayah Select ───────────────────────────────────────────────
function WilayahSelect({ label, required, value, onChange, options, placeholder, disabled, loading }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled || loading || !options}
          className={cn(
            'w-full appearance-none px-4 py-2.5 pr-10 border rounded-xl text-sm bg-white transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400',
            (disabled || loading || !options)
              ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
              : 'border-slate-200 cursor-pointer hover:border-slate-300'
          )}
        >
          <option value="">
            {loading ? 'Memuat data...' : disabled ? `Pilih ${label.split(' ')[0]} dulu` : placeholder}
          </option>
          {options?.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {loading
            ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
    </div>
  )
}

// ── Reusable: Collapsible Section ──────────────────────────────────────────
function CollapsibleSection({ title, subtitle, open, onToggle, children }) {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between px-6 py-5 hover:bg-slate-50/60 transition-colors text-left"
      >
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {open
          ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
          : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 mt-1" />}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-1 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Reusable: Phone Input ──────────────────────────────────────────────────
function PhoneInput({ value, onChange, placeholder, readOnly }) {
  return (
    <div className="flex gap-2">
      <div className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium text-slate-600 shrink-0 select-none">
        <span>🇮🇩</span>
        <span>+62</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          'flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400',
          readOnly && 'bg-slate-50 text-slate-500 cursor-not-allowed'
        )}
      />
    </div>
  )
}

// ── Step Sidebar ───────────────────────────────────────────────────────────
function StepSidebar({ current }) {
  return (
    <aside className="w-52 shrink-0 hidden lg:block">
      <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Registrasi Properti</p>
        </div>
        <div className="px-4 py-4">
          <div className="relative">
            <div className="absolute left-[15px] top-7 bottom-7 w-px bg-slate-200" />
            <div className="space-y-0">
              {STEPS.map(step => {
                const done   = current > step.id
                const active = current === step.id
                return (
                  <div key={step.id} className={cn(
                    'relative flex items-start gap-3 px-3 py-3 rounded-xl transition-colors',
                    active && 'bg-blue-50'
                  )}>
                    <div className={cn(
                      'relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                      done   ? 'bg-blue-600 border-blue-600 text-white' :
                      active ? 'bg-white border-blue-600 text-blue-600 shadow-sm' :
                               'bg-white border-slate-200 text-slate-400'
                    )}>
                      {done ? <Check className="w-3.5 h-3.5" /> : step.id}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className={cn(
                        'text-sm font-semibold leading-tight',
                        active ? 'text-blue-700' : done ? 'text-slate-700' : 'text-slate-400'
                      )}>{step.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{step.subtitle}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Step 1: Tipe Tamu & Properti ───────────────────────────────────────────
function Step1({ form, setForm }) {
  const toggleGuest = (id) => {
    setForm(p => {
      const cur = p.guestTypes || []
      if (cur.includes(id)) return { ...p, guestTypes: cur.filter(x => x !== id) }
      if (cur.length >= 2)  return p
      return { ...p, guestTypes: [...cur, id] }
    })
  }
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1.5">Pilih Tipe Tamu</h3>
        <p className="text-sm text-slate-500 mb-5">
          Pilih tipe tamu yang direkomendasikan untuk menginap di properti Anda. Bisa klik maksimal 2 pilihan.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GUEST_TYPES.map(gt => {
            const checked = form.guestTypes?.includes(gt.id)
            return (
              <button key={gt.id} type="button" onClick={() => toggleGuest(gt.id)}
                className={cn(
                  'flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer',
                  checked ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                )}>
                <span className="text-3xl">{gt.emoji}</span>
                <span className={cn('text-sm font-medium', checked ? 'text-blue-700' : 'text-slate-600')}>{gt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="border-t border-slate-100" />
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1.5">Pilih Tipe Properti</h3>
        <p className="text-sm text-slate-500 mb-5">
          Pilih tipe properti untuk memudahkan tamu menemukan propertimu lewat filter pencarian.
        </p>
        <div className="relative max-w-md">
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="w-full appearance-none px-4 py-3 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer">
            <option value="">Pilih Tipe Properti</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Info Umum + Lokasi ─────────────────────────────────────────────
function Step2({ form, setForm, wilayah }) {
  const [infoOpen, setInfoOpen]     = useState(true)
  const [lokasiOpen, setLokasiOpen] = useState(true)
  const { provId, setProvId, kotaId, setKotaId, kecId, setKecId,
          provinces, regencies, districts, villages,
          provLoading, regLoading, distLoading, vilLoading } = wilayah

  const handleProvince = (id) => {
    const name = provinces?.find(p => p.id === id)?.name || ''
    setProvId(id); setKotaId(''); setKecId('')
    setForm(p => ({ ...p, province: name, city: '', district: '', village: '' }))
  }
  const handleKota = (id) => {
    const name = regencies?.find(r => r.id === id)?.name || ''
    setKotaId(id); setKecId('')
    setForm(p => ({ ...p, city: name, district: '', village: '' }))
  }
  const handleKecamatan = (id) => {
    const name = districts?.find(d => d.id === id)?.name || ''
    setKecId(id)
    setForm(p => ({ ...p, district: name, village: '' }))
  }
  const handleKelurahan = (id) => {
    const name = villages?.find(v => v.id === id)?.name || ''
    setForm(p => ({ ...p, village: name }))
  }
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Lengkapi Info Umum" subtitle="Beritahu kami tentang propertimu." open={infoOpen} onToggle={() => setInfoOpen(o => !o)}>
        <div className="space-y-5 pt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Properti <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={f('name')} placeholder="Contoh: ABC 2BR Apartment Near Shopping Malls"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Alias <span className="text-slate-400 font-normal">(opsional)</span></label>
            <input value={form.alias} onChange={f('alias')} placeholder="Contoh: Cozy Apartment with City View"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Bintang</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setForm(p => ({ ...p, star_rating: 0 }))}
                className={cn('px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                  form.star_rating === 0 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300')}>
                No Star
              </button>
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setForm(p => ({ ...p, star_rating: s }))}
                  className={cn('px-4 py-2 rounded-xl text-sm border-2 transition-all',
                    form.star_rating === s ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/40 text-slate-600')}>
                  {'★'.repeat(s)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Apakah properti Anda merupakan bagian dari brand atau chain tertentu?</label>
            <div className="flex items-center gap-6">
              {[{value: true, label:'Ya'},{value: false, label:'Tidak'}].map(opt => (
                <label key={String(opt.value)} className="flex items-center gap-2.5 cursor-pointer">
                  <div onClick={() => setForm(p => ({...p, is_brand_chain: opt.value}))}
                    className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer',
                      form.is_brand_chain === opt.value ? 'border-blue-600 bg-blue-600' : 'border-slate-300')}>
                    {form.is_brand_chain === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mata Uang</label>
            <p className="text-xs text-blue-600 mb-2">Pilih mata uang yang tepat. Kamu tidak bisa mengubahnya setelah registrasi properti diajukan.</p>
            <div className="relative max-w-xs">
              <select value={form.currency} onChange={f('currency')}
                className="w-full appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer">
                <option value="">Pilih Mata Uang</option>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Infokan Lokasi Properti" subtitle="Lengkapi detail di bawah ini dengan benar untuk memudahkan tamu menemukan propertimu." open={lokasiOpen} onToggle={() => setLokasiOpen(o => !o)}>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <WilayahSelect label="Provinsi" required value={provId} onChange={handleProvince} options={provinces} placeholder="-- Pilih Provinsi --" loading={provLoading} />
            <WilayahSelect label="Kota / Kabupaten" required value={kotaId} onChange={handleKota} options={regencies} placeholder="-- Pilih Kota/Kab --" loading={regLoading} disabled={!provId} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <WilayahSelect label="Kecamatan" value={kecId} onChange={handleKecamatan} options={districts} placeholder="-- Pilih Kecamatan --" loading={distLoading} disabled={!kotaId} />
            <WilayahSelect label="Kelurahan / Desa" value={villages?.find(v => v.name === form.village)?.id || ''} onChange={handleKelurahan} options={villages} placeholder="-- Pilih Kelurahan/Desa --" loading={vilLoading} disabled={!kecId} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Alamat <span className="text-red-500">*</span></label>
            <input value={form.address} onChange={f('address')} placeholder="Contoh: ABC Tower, 10 Sudirman Street, Central Jakarta"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kode Pos</label>
            <input value={form.postal_code} onChange={f('postal_code')} placeholder="Contoh: 11440" maxLength={10}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          {(form.city || form.province) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Google Map</label>
              <MapEmbed
                query={[form.address, form.village, form.district, form.city, form.province, 'Indonesia'].filter(Boolean).join(', ')}
                height={280}
                onCoords={(lat, lng) => setForm(p => ({ ...p, latitude: lat, longitude: lng }))}
              />
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  )
}

// ── Step 3: Detail Kontak ──────────────────────────────────────────────────
function Step3Kontak({ form, setForm, user }) {
  const [extraEmails, setExtraEmails] = useState([])
  const [extraPhones, setExtraPhones] = useState([])
  const [extraPropPh, setExtraPropPh] = useState([])
  const [extraFaxes,  setExtraFaxes]  = useState([])
  const f = k => v => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">Kontak ini akan otomatis memiliki peran Administrator.</p>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Penanggung Jawab (PIC)</label>
        <input value={user?.name || ''} readOnly
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
        <p className="text-xs text-slate-400 mt-1.5">Nama Penanggung Jawab dapat diubah di menu Pengaturan Pengguna</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Jabatan</label>
        <div className="relative max-w-sm">
          <select value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
            className="w-full appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer">
            <option value="">Pilih jabatan</option>
            {JABATAN.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Alamat Email</label>
        <input value={user?.email || ''} readOnly
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
        <p className="text-xs text-slate-400 mt-1.5">Alamat email ini tidak dapat diubah. Untuk menambahkan alamat email lain, silakan buat pengguna baru.</p>
        {extraEmails.map((val, i) => (
          <div key={i} className="mt-2">
            <input value={val} onChange={e => setExtraEmails(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
              placeholder="Email tambahan"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
        ))}
        <button type="button" onClick={() => setExtraEmails(p => [...p, ''])}
          className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="w-3.5 h-3.5" /> Tambah email lain
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Telepon</label>
        <PhoneInput value={form.phone} onChange={f('phone')} placeholder="85188136009" />
        <div className="mt-2 flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="text-xs text-blue-700">Nomor telepon harus terhubung ke WhatsApp</p>
        </div>
        {extraPhones.map((val, i) => (
          <div key={i} className="mt-2">
            <PhoneInput value={val} onChange={v => setExtraPhones(prev => prev.map((x, idx) => idx === i ? v : x))} placeholder="Nomor telepon lain" />
          </div>
        ))}
        <button type="button" onClick={() => setExtraPhones(p => [...p, ''])}
          className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="w-3.5 h-3.5" /> Tambah nomor telepon lain
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Telepon Properti</label>
        <PhoneInput value={form.property_phone} onChange={f('property_phone')} placeholder="Nomor Telepon Properti" />
        {extraPropPh.map((val, i) => (
          <div key={i} className="mt-2">
            <PhoneInput value={val} onChange={v => setExtraPropPh(prev => prev.map((x, idx) => idx === i ? v : x))} placeholder="Nomor telepon properti lain" />
          </div>
        ))}
        <button type="button" onClick={() => setExtraPropPh(p => [...p, ''])}
          className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="w-3.5 h-3.5" /> Tambah nomor telepon lain
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nomor Fax <span className="text-slate-400 font-normal">(opsional)</span>
        </label>
        <PhoneInput value={form.fax} onChange={f('fax')} placeholder="Cth: 8132888908" />
        {extraFaxes.map((val, i) => (
          <div key={i} className="mt-2">
            <PhoneInput value={val} onChange={v => setExtraFaxes(prev => prev.map((x, idx) => idx === i ? v : x))} placeholder="Nomor fax lain" />
          </div>
        ))}
        <button type="button" onClick={() => setExtraFaxes(p => [...p, ''])}
          className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="w-3.5 h-3.5" /> Tambah nomor fax lain
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Detail Perjanjian ──────────────────────────────────────────────
function Step4Perjanjian({ form, setForm, user }) {
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const allChecked = form.check1 && form.check2 && form.check3 && form.check4

  const copyFromMain = () => {
    setForm(p => ({
      ...p,
      agree_name: user?.name || '',
      agree_position: p.position || '',
      agree_email: user?.email || '',
      agree_phone: p.phone || '',
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Perjanjian Kemitraan</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Lengkapi informasi legal properti Anda serta baca syarat dan ketentuan kemitraan di bawah ini.
        </p>
      </div>

      {/* Nama Perusahaan */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nama Perusahaan (Badan Usaha) <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-400 mb-2">
          Nama perusahaan akan ditampilkan di dokumen perjanjian kemitraan dan bisa berbentuk <strong>CV</strong> atau <strong>PT</strong>. Untuk properti milik perorangan, Anda cukup memasukkan nama properti.
        </p>
        <input value={form.company_name} onChange={f('company_name')} placeholder="Contoh: PT Indah Pesona"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
      </div>

      {/* Alamat Badan Usaha */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Alamat (Badan Usaha)</label>
        <input value={form.company_address} onChange={f('company_address')} placeholder="Contoh: Jalan Sudirman Raya kavling A12, Jakarta..."
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
      </div>

      {/* Negara */}
      <div className="max-w-xs">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Negara <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select value={form.company_country} onChange={f('company_country')}
            className="w-full appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer">
            <option value="">Pilih negara</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {!form.company_country && (
          <p className="text-xs text-red-500 mt-1.5">Negara belum diisi.</p>
        )}
      </div>

      {/* Info Umum (readonly summary) */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Info Umum</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Nama Properti</span>
          <span className="text-sm font-semibold text-slate-800">{form.name || '–'}</span>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Detail Kontak untuk Dokumen Perjanjian */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Detail Kontak untuk Dokumen Perjanjian</h4>
            <p className="text-xs text-slate-500 mt-0.5">Detail ini hanya akan digunakan pada Dokumen Perjanjian Kemitraan.</p>
          </div>
          <button type="button" onClick={copyFromMain}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shrink-0">
            <Copy className="w-3.5 h-3.5" /> Copy dari Kontak Utama
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama</label>
            <input value={form.agree_name} onChange={f('agree_name')} placeholder="Contoh: Sandra Jean"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jabatan</label>
            <div className="relative max-w-sm">
              <select value={form.agree_position} onChange={f('agree_position')}
                className="w-full appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer">
                <option value="">Pilih jabatan</option>
                {JABATAN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Alamat Email</label>
            <input value={form.agree_email} onChange={f('agree_email')} placeholder="Contoh: sandrajean@gmail.com" type="email"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Telepon</label>
            <PhoneInput value={form.agree_phone} onChange={v => setForm(p => ({ ...p, agree_phone: v }))} placeholder="Contoh: 215678901" />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Komisi Platform */}
      <div className="space-y-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl">
          <h4 className="text-sm font-bold text-slate-900 mb-2">Komisi Platform</h4>
          <p className="text-sm text-slate-600 mb-3">
            Komisi platform akan diberlakukan untuk semua pesanan yang terjadi. Anda akan menerima pembayaran bersih yang sudah dipotong komisi.
          </p>
          <p className="text-sm text-slate-600 mb-2">Komisi ini akan digunakan untuk memudahkan Anda:</p>
          <ul className="space-y-1.5">
            {[
              'Anda memiliki Market Manager yang selalu siap membantu dan menganalisis pertumbuhan properti Anda.',
              'Kami akan mengurus pembayaran dari pelanggan.',
              'Tersedia banyak fitur yang bisa Anda gunakan untuk mengelola properti.',
              'Kami akan memaksimalkan marketing untuk membantu properti Anda berkembang.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl">
          <h4 className="text-sm font-bold text-slate-900 mb-2">Exclusive Private Deals</h4>
          <p className="text-sm text-slate-600">
            Diskon eksklusif berlaku untuk pemesanan properti Anda melalui website dan aplikasi ArahInn, serta platform partner kami. Program ini akan berlaku untuk properti Anda secara otomatis.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Agreement checkboxes */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          Tinggal beberapa langkah lagi untuk mendaftarkan properti Anda!
        </h4>
        <p className="text-sm text-slate-500 mb-4">
          Untuk menyelesaikan pendaftaran Anda, silakan centang kotak di bawah ini:
        </p>
        <div className="space-y-3">
          {AGREEMENT_CHECKS.map((text, i) => {
            const key = `check${i + 1}`
            const checked = form[key]
            return (
              <label key={i} onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
                  checked ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                )}>
                <div className={cn(
                  'mt-0.5 w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                  checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                )} style={{ width: 18, height: 18 }}>
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-slate-700 leading-relaxed">{text}</span>
              </label>
            )
          })}
        </div>

        {!allChecked && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Centang semua pernyataan di atas untuk melanjutkan.
          </div>
        )}

        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          Jika diperlukan, ArahInn dapat memfasilitasi komunikasi antara Mitra Akomodasi dan Pelanggan.
          Komunikasi ini dikelola sepenuhnya oleh ArahInn dan sesuai dengan{' '}
          <span className="text-blue-600 font-medium cursor-pointer hover:underline">Pernyataan Privasi ArahInn</span>{' '}
          dan{' '}
          <span className="text-blue-600 font-medium cursor-pointer hover:underline">Syarat & Ketentuan</span>.
        </p>
      </div>
    </div>
  )
}

// ── Step 5: Platform Lain ──────────────────────────────────────────────────
function Step5PlatformLain({ form, setForm }) {
  const isChecked = (name) => Object.prototype.hasOwnProperty.call(form.platforms, name)

  const togglePlatform = (name) => {
    setForm(p => {
      const cur = { ...p.platforms }
      if (isChecked(name)) {
        delete cur[name]
      } else {
        cur[name] = ''
      }
      return { ...p, platforms: cur, platform_none: Object.keys(cur).length === 0 }
    })
  }

  const setUrl = (name, url) => {
    setForm(p => ({ ...p, platforms: { ...p.platforms, [name]: url } }))
  }

  const toggleNone = () => {
    setForm(p => ({ ...p, platforms: {}, platform_none: true }))
  }

  return (
    <div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5">Pilih Platform Lain</h3>
      <p className="text-sm text-slate-500 mb-6">
        Jika propertimu terdaftar di platform lain, klik pilihan di bawah ini dan masukkan link yang valid untuk memudahkan proses verifikasi.
      </p>

      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
        {PLATFORMS.map(name => {
          const checked = isChecked(name)
          return (
            <div key={name} className={cn('transition-colors', checked ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50')}>
              <label
                className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                onClick={() => togglePlatform(name)}
              >
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                  checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                )}>
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={cn('text-sm font-medium', checked ? 'text-blue-700' : 'text-slate-700')}>
                  {name}
                </span>
              </label>
              {checked && (
                <div className="px-14 pb-4">
                  <input
                    value={form.platforms[name]}
                    onChange={e => setUrl(name, e.target.value)}
                    placeholder={`Masukkan link properti Anda di ${name}`}
                    className="w-full px-4 py-2.5 border border-blue-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* None option */}
        <label
          className={cn(
            'flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors',
            form.platform_none ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
          )}
          onClick={toggleNone}
        >
          <div className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
            form.platform_none ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
          )}>
            {form.platform_none && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className={cn('text-sm font-medium', form.platform_none ? 'text-blue-700' : 'text-slate-700')}>
            Properti saya belum terdaftar di platform lain
          </span>
        </label>
      </div>
    </div>
  )
}

// ── Step 6: Fasilitas Properti ─────────────────────────────────────────────
function Step6Fasilitas({ form, setForm }) {
  const [openGroups, setOpenGroups] = useState({ Populer: true })
  const selectedCount = form.facilities?.length || 0
  const MIN = 3

  const toggle = (item) => {
    setForm(p => {
      const cur = p.facilities || []
      return {
        ...p,
        facilities: cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item],
      }
    })
  }

  const toggleGroup = (label) => {
    setOpenGroups(p => ({ ...p, [label]: !p[label] }))
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <h3 className="text-base font-bold text-slate-900">Fasilitas Properti</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Pilih minimum {MIN} fasilitas yang tersedia di properti. Apabila Anda mempunyai lebih dari {MIN} fasilitas, silakan pilih lebih banyak.
          </p>
        </div>
        {selectedCount > 0 && (
          <span className="shrink-0 ml-4 mt-1 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {selectedCount} dipilih
          </span>
        )}
      </div>

      {selectedCount < MIN && selectedCount > 0 && (
        <div className="mt-3 mb-4 flex items-center gap-2 text-xs text-amber-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Pilih minimal {MIN} fasilitas ({selectedCount}/{MIN} dipilih)
        </div>
      )}

      <div className="mt-5 space-y-3">
        {FACILITY_GROUPS.map(group => {
          const isOpen = openGroups[group.label] !== false
          return (
            <div key={group.label} className="border border-slate-200 rounded-2xl overflow-hidden">
              {/* Group header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-bold text-slate-800">{group.label}</span>
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Grid */}
              {isOpen && (
                <div className="border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3">
                    {group.items.map((item, idx) => {
                      const checked = form.facilities?.includes(item)
                      const cols    = 3
                      const isLastInRow = (idx + 1) % cols === 0
                      const isLastRow   = idx >= group.items.length - (group.items.length % cols || cols)
                      return (
                        <label
                          key={item}
                          onClick={() => toggle(item)}
                          className={cn(
                            'flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors',
                            'border-b border-slate-100',
                            !isLastInRow && 'sm:border-r',
                            isLastRow && 'sm:border-b-0',
                            checked ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                          )}
                        >
                          <div className={cn(
                            'mt-0.5 w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 transition-all',
                            checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                          )}>
                            {checked && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className={cn(
                            'text-sm leading-snug select-none',
                            checked ? 'text-blue-700 font-medium' : 'text-slate-700'
                          )}>
                            {item}
                          </span>
                        </label>
                      )
                    })}
                    {/* Pad empty cells so last row has full border */}
                    {Array.from({ length: (3 - (group.items.length % 3)) % 3 }).map((_, i) => (
                      <div key={`pad-${i}`} className="hidden sm:block border-l border-slate-100" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Photo Thumb ────────────────────────────────────────────────────────────
function PhotoThumb({ file, isMain, onSetMain, onRemove }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  return (
    <div className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200">
      <img src={url} alt="" className="w-full h-full object-cover" />
      {/* Main badge */}
      {isMain && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
          <Star className="w-2.5 h-2.5" /> Utama
        </div>
      )}
      {/* Hover actions */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {!isMain && (
          <button type="button" onClick={onSetMain}
            className="p-1.5 bg-amber-400 text-white rounded-full hover:bg-amber-500 transition-colors" title="Jadikan foto utama">
            <Star className="w-3.5 h-3.5" />
          </button>
        )}
        <button type="button" onClick={onRemove}
          className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors" title="Hapus foto">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Step 7: Foto Properti ──────────────────────────────────────────────────
function Step7Foto({ form, setForm }) {
  const MIN_PHOTOS = 4
  const totalPhotos = (form.photo_groups || []).reduce((s, g) => s + (g.files?.length || 0), 0)

  const addGroup = () => {
    setForm(p => ({
      ...p,
      photo_groups: [...(p.photo_groups || []), { id: Date.now(), category: '', files: [], mainIdx: null }],
    }))
  }

  const updateCategory = (id, category) => {
    setForm(p => ({
      ...p,
      photo_groups: p.photo_groups.map(g => g.id === id ? { ...g, category } : g),
    }))
  }

  const addFiles = (id, newFiles) => {
    setForm(p => ({
      ...p,
      photo_groups: p.photo_groups.map(g =>
        g.id === id ? { ...g, files: [...(g.files || []), ...Array.from(newFiles)] } : g
      ),
    }))
  }

  const removeFile = (groupId, fileIdx) => {
    setForm(p => ({
      ...p,
      photo_groups: p.photo_groups.map(g => {
        if (g.id !== groupId) return g
        const files = g.files.filter((_, i) => i !== fileIdx)
        const mainIdx = g.mainIdx === fileIdx ? null
                      : g.mainIdx > fileIdx    ? g.mainIdx - 1
                      : g.mainIdx
        return { ...g, files, mainIdx }
      }),
    }))
  }

  const setMain = (groupId, fileIdx) => {
    setForm(p => ({
      ...p,
      photo_groups: p.photo_groups.map(g =>
        g.id === groupId ? { ...g, mainIdx: fileIdx } : g
      ),
    }))
  }

  const removeGroup = (id) => {
    setForm(p => ({
      ...p,
      photo_groups: p.photo_groups.filter(g => g.id !== id),
    }))
  }

  return (
    <div>
      <h3 className="text-base font-bold text-slate-900 mb-3">Upload Foto Properti</h3>
      <ul className="space-y-1.5 mb-6">
        {[
          `Upload minimal ${MIN_PHOTOS} foto`,
          'Pilih 1 foto sebagai foto utama',
          'Klik ikon bintang pada foto untuk mengatur foto utama.',
          'Untuk proses upload yang lebih cepat, tambahkan lebih dari 1 foto dalam sekali upload.',
        ].map((txt, i) => (
          <li key={i} className={cn('flex items-start gap-2 text-sm', i < 2 ? 'text-blue-600 font-medium' : 'text-slate-500')}>
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
            {txt}
          </li>
        ))}
      </ul>

      {totalPhotos < MIN_PHOTOS && totalPhotos > 0 && (
        <div className="mb-4 flex items-center gap-2 text-xs text-amber-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Upload minimal {MIN_PHOTOS} foto ({totalPhotos}/{MIN_PHOTOS} foto ditambahkan)
        </div>
      )}

      <div className="space-y-6">
        {(form.photo_groups || []).map((group, gIdx) => (
          <div key={group.id} className="border border-slate-200 rounded-2xl p-5 space-y-4">
            {/* Category row */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
                <div className="relative">
                  <select
                    value={group.category}
                    onChange={e => updateCategory(group.id, e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                  >
                    <option value="">Pilih kategori</option>
                    {PHOTO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              {gIdx > 0 && (
                <button type="button" onClick={() => removeGroup(group.id)}
                  className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {(group.files || []).map((file, idx) => (
                <PhotoThumb
                  key={idx}
                  file={file}
                  isMain={group.mainIdx === idx}
                  onSetMain={() => setMain(group.id, idx)}
                  onRemove={() => removeFile(group.id, idx)}
                />
              ))}

              {/* Add photo button */}
              <label className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
                <ImageIcon className="w-7 h-7 text-slate-300" />
                <span className="text-xs text-slate-400 font-medium text-center leading-tight">+ Tambah foto</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e => { if (e.target.files?.length) addFiles(group.id, e.target.files) }}
                />
              </label>
            </div>

            {group.files?.length > 0 && group.mainIdx === null && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5">
                <Star className="w-3 h-3 shrink-0" />
                Klik ikon bintang pada foto untuk menjadikannya foto utama.
              </p>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={addGroup}
        className="mt-4 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
        <Plus className="w-3.5 h-3.5" /> Tambah kategori lain
      </button>
    </div>
  )
}

// ── Step 8: Kebijakan Umum ─────────────────────────────────────────────────
const KEBIJAKAN_QUESTIONS = [
  {
    key: 'gender_policy',
    label: 'Apakah kamu hanya menerima jenis kelamin tertentu?',
    options: [
      { value: 'hanya_wanita', label: 'Hanya Wanita' },
      { value: 'hanya_pria',   label: 'Hanya Pria' },
      { value: 'keduanya',     label: 'Keduanya' },
    ],
  },
  { key: 'marriage_book',       label: 'Apakah kamu mewajibkan buku nikah untuk tamu berpasangan?' },
  { key: 'deposit_required',    label: 'Apakah tamu perlu membayar deposit?' },
  { key: 'all_ages_allowed',    label: 'Apakah Anda mengizinkan semua umur?' },
  { key: 'breakfast_available', label: 'Apakah sarapan tersedia?' },
  { key: 'smoking_allowed',     label: 'Apakah tamu diperbolehkan merokok di properti?' },
  { key: 'alcohol_allowed',     label: 'Apakah kamu memperbolehkan minuman beralkohol?' },
  { key: 'pets_allowed',        label: 'Apakah tamu boleh membawa hewan peliharaan?' },
]

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

function TimeSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-20 px-3 py-2 pr-7 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  )
}

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-6">
      {options.map(opt => {
        const checked = value === opt.value
        return (
          <label key={String(opt.value)} className="flex items-center gap-2.5 cursor-pointer group">
            <span className={cn(
              'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
              checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
            )}>
              {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <input type="radio" className="sr-only" name={name} checked={checked} onChange={() => onChange(opt.value)} />
            <span className={cn('text-sm transition-colors', checked ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-slate-800')}>
              {opt.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function Step8Kebijakan({ form, setForm }) {
  const set = (key, value) => setForm(p => ({ ...p, [key]: value }))
  const YES_NO = [{ value: true, label: 'Ya' }, { value: false, label: 'Tidak' }]

  return (
    <div>
      <p className="text-sm text-slate-500 mb-6">
        Kebijakan ini akan muncul di halaman Tentang Properti.
      </p>
      <div className="divide-y divide-slate-100">
        {KEBIJAKAN_QUESTIONS.map(q => (
          <div key={q.key} className="py-5">
            <p className="text-sm font-medium text-slate-800 mb-3">{q.label}</p>
            <RadioGroup
              name={q.key}
              value={form[q.key]}
              onChange={v => set(q.key, v)}
              options={q.options ?? YES_NO}
            />

            {/* Breakfast time range */}
            {q.key === 'breakfast_available' && form.breakfast_available === true && (
              <div className="mt-4 flex flex-wrap gap-8">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Mulai</p>
                  <div className="flex items-center gap-2">
                    <TimeSelect value={form.breakfast_start_hour}   onChange={v => set('breakfast_start_hour', v)}   options={HOURS} />
                    <TimeSelect value={form.breakfast_start_minute} onChange={v => set('breakfast_start_minute', v)} options={MINUTES} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Selesai</p>
                  <div className="flex items-center gap-2">
                    <TimeSelect value={form.breakfast_end_hour}   onChange={v => set('breakfast_end_hour', v)}   options={HOURS} />
                    <TimeSelect value={form.breakfast_end_minute} onChange={v => set('breakfast_end_minute', v)} options={MINUTES} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step 9: Detail Kamar ───────────────────────────────────────────────────
const ROOM_TYPES = [
  'Standard Room', 'Superior Room', 'Deluxe Room', 'Junior Suite',
  'Suite', 'Family Room', 'Executive Room', 'Connecting Room', 'Dormitory', 'Lainnya',
]
const BED_TYPES  = ['Single Bed', 'Twin Bed', 'Double Bed', 'Queen Bed', 'King Bed', 'Sofa Bed', 'Bunk Bed']
const BED_COUNTS = ['1', '2', '3', '4', '5']

const ROOM_FACILITY_GROUPS = [
  {
    label: 'Populer',
    items: [
      'AC', 'Air minum kemasan gratis', 'Balkon', 'Bebas rokok',
      'Dapur lengkap', 'Fasilitas membuat kopi/teh', 'Kamar mandi privat',
      'Ketel Listrik', 'Layanan pembersihan kamar', 'Lemari es',
      'Pengering rambut', 'Peralatan mandi gratis', 'Shower', 'Televisi', 'WiFi Gratis',
    ],
  },
  {
    label: 'Kamar & Kenyamanan',
    items: [
      'Bantal ekstra', 'Brankas', 'Cermin', 'Gantungan baju',
      'Jam weker', 'Karpet', 'Kursi kerja', 'Lampu baca', 'Meja rias', 'Sandal',
    ],
  },
]

const ROOM_PHOTO_CATS = ['Kamar Tidur', 'Kamar Mandi', 'Dapur', 'Ruang Tamu', 'Pemandangan', 'Lainnya']

function RoomForm({ room, onChange, onRemove, index, showErrors }) {
  const [openTambah,    setOpenTambah]    = useState(true)
  const [openFasilitas, setOpenFasilitas] = useState(false)
  const [openFoto,      setOpenFoto]      = useState(false)
  const [fasOpen,       setFasOpen]       = useState({})

  const set = (key, value) => onChange({ ...room, [key]: value })

  const addBedConfig = () => onChange({
    ...room,
    bed_configs: [...(room.bed_configs || []), { id: Date.now(), bed_type: '', bed_count: '' }],
  })
  const updateBed = (bedId, key, value) => onChange({
    ...room,
    bed_configs: room.bed_configs.map(b => b.id === bedId ? { ...b, [key]: value } : b),
  })
  const removeBed = (bedId) => onChange({
    ...room,
    bed_configs: room.bed_configs.filter(b => b.id !== bedId),
  })
  const toggleFacility = (item) => {
    const fac = room.room_facilities || []
    onChange({ ...room, room_facilities: fac.includes(item) ? fac.filter(f => f !== item) : [...fac, item] })
  }
  const addPhotoGroup = () => onChange({
    ...room,
    photo_groups: [...(room.photo_groups || []), { id: Date.now(), category: '', files: [], mainIdx: null }],
  })
  const updatePhotoCategory = (pgId, category) => onChange({
    ...room, photo_groups: room.photo_groups.map(g => g.id === pgId ? { ...g, category } : g),
  })
  const addPhotos = (pgId, newFiles) => onChange({
    ...room,
    photo_groups: room.photo_groups.map(g =>
      g.id === pgId ? { ...g, files: [...(g.files || []), ...Array.from(newFiles)] } : g
    ),
  })
  const removePhoto = (pgId, fileIdx) => onChange({
    ...room,
    photo_groups: room.photo_groups.map(g => {
      if (g.id !== pgId) return g
      const files   = g.files.filter((_, i) => i !== fileIdx)
      const mainIdx = g.mainIdx === fileIdx ? null : g.mainIdx > fileIdx ? g.mainIdx - 1 : g.mainIdx
      return { ...g, files, mainIdx }
    }),
  })
  const setPhotoMain = (pgId, fileIdx) => onChange({
    ...room, photo_groups: room.photo_groups.map(g => g.id === pgId ? { ...g, mainIdx: fileIdx } : g),
  })
  const removePhotoGroup = (pgId) => onChange({
    ...room, photo_groups: room.photo_groups.filter(g => g.id !== pgId),
  })

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      {/* Room header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
        <p className="text-sm font-bold text-slate-800">
          Kamar {index + 1}{room.room_name ? ` — ${room.room_name}` : ''}
        </p>
        {index > 0 && (
          <button type="button" onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Hapus
          </button>
        )}
      </div>

      {/* Section 1: Tambah Kamar */}
      <CollapsibleSection
        title="Tambah Kamar"
        subtitle="Kamar adalah seluruh tempat yang akan dipesan oleh tamu, tanpa harus berbagi dengan tamu lain."
        open={openTambah}
        onToggle={() => setOpenTambah(o => !o)}
      >
        <div className="space-y-5 pt-4">
          {/* Tipe Kamar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipe Kamar</label>
            <div className="relative">
              <select
                value={room.room_type}
                onChange={e => set('room_type', e.target.value)}
                className={cn("w-full appearance-none px-4 py-2.5 pr-10 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer",
                  showErrors && !room.room_type ? 'border-red-400 bg-red-50' : 'border-slate-200')}
              >
                <option value="">Pilih tipe kamar</option>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {showErrors && !room.room_type && <p className="text-xs text-red-500 mt-1">Tipe kamar harus dipilih.</p>}
          </div>

          {/* Nama Kamar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Kamar</label>
            <div className="relative">
              <input
                type="text"
                value={room.room_name}
                onChange={e => set('room_name', e.target.value)}
                placeholder="Contoh: Superior Room with Garden View"
                className={cn("w-full px-4 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400",
                  showErrors && !room.room_name.trim() ? 'border-red-400 bg-red-50' : 'border-slate-200')}
              />
              <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            </div>
            {showErrors && !room.room_name.trim() && <p className="text-xs text-red-500 mt-1">Nama kamar harus diisi.</p>}
          </div>

          {/* Kebijakan Merokok */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Kebijakan Merokok</p>
            <div className="flex gap-8">
              {[{ value: 'allowed', label: 'Diperbolehkan' }, { value: 'not_allowed', label: 'Tidak diperbolehkan' }].map(opt => {
                const checked = room.smoking_policy === opt.value
                return (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <span className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                    )}>
                      {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <input type="radio" className="sr-only" checked={checked} onChange={() => set('smoking_policy', opt.value)} />
                    <span className={cn('text-sm', checked ? 'text-slate-900 font-medium' : 'text-slate-600')}>{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Price Threshold */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-0.5">Price Threshold / Harga Minimal</p>
            <p className="text-xs text-slate-400 mb-2">
              Atur harga minimal kamar. Saat Anda mengatur rate plan, itu harus sama dengan lebih besar dari Price Threshold.
            </p>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden w-fit">
              <span className="px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-sm text-slate-500 font-medium">IDR</span>
              <input
                type="number" min="0"
                value={room.price_threshold}
                onChange={e => set('price_threshold', e.target.value)}
                className="px-3 py-2.5 text-sm focus:outline-none w-40"
              />
            </div>
          </div>

          {/* Maksimum Okupansi */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-0.5">Maksimum Okupansi</p>
            <p className="text-xs text-slate-400 mb-3">
              Atur jumlah maksimum tamu yang boleh menginap di kamar ini. Pastikan Anda mengisinya dengan akurat,
              karena detail ini akan tampil di halaman properti Anda dan dilihat oleh calon tamu.
            </p>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => set('max_occupancy', Math.max(0, (room.max_occupancy || 0) - 1))}
                className="w-8 h-8 rounded-full border-2 border-blue-600 text-blue-600 flex items-center justify-center text-lg font-bold hover:bg-blue-50 transition-colors">
                −
              </button>
              <span className={cn("w-10 text-center text-sm font-semibold", showErrors && !(room.max_occupancy > 0) ? 'text-red-500' : 'text-slate-800')}>{room.max_occupancy || 0}</span>
              <button type="button"
                onClick={() => set('max_occupancy', (room.max_occupancy || 0) + 1)}
                className="w-8 h-8 rounded-full border-2 border-blue-600 text-blue-600 flex items-center justify-center text-lg font-bold hover:bg-blue-50 transition-colors">
                +
              </button>
            </div>
            {showErrors && !(room.max_occupancy > 0) && <p className="text-xs text-red-500 mt-1">Maksimum tamu harus lebih dari 0.</p>}
          </div>

          {/* Apakah punya beberapa kamar tidur */}
          <div>
            <p className="text-sm font-medium text-slate-800 mb-0.5">Apakah kamar ini punya beberapa kamar tidur?</p>
            <p className="text-xs text-slate-400 mb-3">Tamu akan melihat kamar tidur di bawah ini dalam 1 kamar.</p>
            <RadioGroup
              name={`has_bedrooms_${room.id}`}
              value={room.has_bedrooms}
              onChange={v => set('has_bedrooms', v)}
              options={[{ value: true, label: 'Ya' }, { value: false, label: 'Tidak' }]}
            />
          </div>

          {/* Konfigurasi Ranjang */}
          {room.has_bedrooms !== null && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Konfigurasi Ranjang</p>
              <div className="space-y-3">
                {(room.bed_configs || []).map((bed, bIdx) => (
                  <div key={bed.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 shrink-0 w-24">Kamar tidur {bIdx + 1}</span>
                    <div className="relative flex-1">
                      <select
                        value={bed.bed_type}
                        onChange={e => updateBed(bed.id, 'bed_type', e.target.value)}
                        className="w-full appearance-none px-3 py-2 pr-8 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                      >
                        <option value="">Tipe ranjang</option>
                        {BED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative w-36">
                      <select
                        value={bed.bed_count}
                        onChange={e => updateBed(bed.id, 'bed_count', e.target.value)}
                        className="w-full appearance-none px-3 py-2 pr-8 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                      >
                        <option value="">Jumlah ranjang</option>
                        {BED_COUNTS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    {bIdx > 0 && (
                      <button type="button" onClick={() => removeBed(bed.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addBedConfig}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Tambah tipe ranjang lain
                </button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Section 2: Fasilitas Kamar */}
      <CollapsibleSection
        title="Pilih Fasilitas Kamar"
        subtitle="Kamu bisa pilih minimal 3 fasilitas. Sebaiknya sediakan lebih banyak fasilitas untuk menarik tamu."
        open={openFasilitas}
        onToggle={() => setOpenFasilitas(o => !o)}
      >
        <div className="pt-4 space-y-4">
          {ROOM_FACILITY_GROUPS.map(group => {
            const isOpen = fasOpen[group.label] !== false
            const padded = [...group.items]
            while (padded.length % 3 !== 0) padded.push(null)
            return (
              <div key={group.label} className="border border-slate-200 rounded-xl overflow-hidden">
                <button type="button"
                  onClick={() => setFasOpen(p => ({ ...p, [group.label]: !isOpen }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {group.label}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="grid grid-cols-3 divide-x divide-y divide-slate-100 border-t border-slate-100">
                    {padded.map((item, idx) => (
                      <div key={idx} className="px-3 py-2.5">
                        {item && (
                          <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={(room.room_facilities || []).includes(item)}
                              onChange={() => toggleFacility(item)}
                              className="w-4 h-4 accent-blue-600 shrink-0"
                            />
                            <span className="text-xs text-slate-700 group-hover:text-slate-900 transition-colors">{item}</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {(room.room_facilities?.length || 0) > 0 && (
            <p className="text-xs text-blue-600 font-medium">{room.room_facilities.length} fasilitas dipilih</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Section 3: Foto Kamar */}
      <CollapsibleSection
        title="Foto Kamar"
        subtitle="Upload minimal 1 foto. Pilih 1 foto sebagai foto utama."
        open={openFoto}
        onToggle={() => setOpenFoto(o => !o)}
      >
        <div className="pt-3">
          <ul className="space-y-1 mb-5">
            {['Upload minimal 1 foto', 'Pilih 1 foto sebagai foto utama',
              'Geser dan letakkan foto untuk mengatur urutannya.',
              'Untuk proses upload yang lebih cepat, kami sarankan untuk menambah lebih dari 1 foto dalam sekali upload.',
            ].map((txt, i) => (
              <li key={i} className={cn('flex items-start gap-2 text-sm', i < 2 ? 'text-blue-600 font-medium' : 'text-slate-500')}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                {txt}
              </li>
            ))}
          </ul>
          <div className="space-y-5">
            {(room.photo_groups || []).map((pg, pgIdx) => (
              <div key={pg.id}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
                    <div className="relative">
                      <select
                        value={pg.category}
                        onChange={e => updatePhotoCategory(pg.id, e.target.value)}
                        className="w-full appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                      >
                        <option value="">Pilih kategori</option>
                        {ROOM_PHOTO_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  {pgIdx > 0 && (
                    <button type="button" onClick={() => removePhotoGroup(pg.id)}
                      className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {(pg.files || []).map((file, idx) => (
                    <PhotoThumb key={idx} file={file} isMain={pg.mainIdx === idx}
                      onSetMain={() => setPhotoMain(pg.id, idx)}
                      onRemove={() => removePhoto(pg.id, idx)}
                    />
                  ))}
                  <label className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
                    <ImageIcon className="w-7 h-7 text-slate-300" />
                    <span className="text-xs text-slate-400 font-medium">+ Tambah foto</span>
                    <input type="file" multiple accept="image/*" className="hidden"
                      onChange={e => { if (e.target.files?.length) addPhotos(pg.id, e.target.files) }} />
                  </label>
                </div>
                {pg.files?.length > 0 && pg.mainIdx === null && (
                  <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5">
                    <Star className="w-3 h-3 shrink-0" /> Klik ikon bintang untuk jadikan foto utama.
                  </p>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addPhotoGroup}
            className="mt-4 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Plus className="w-3.5 h-3.5" /> Tambah kategori lain
          </button>
        </div>
      </CollapsibleSection>
    </div>
  )
}

function Step9DetailKamar({ form, setForm, showErrors }) {
  const updateRoom = (id, updated) => setForm(p => ({
    ...p, rooms: p.rooms.map(r => r.id === id ? updated : r),
  }))
  const addRoom = () => setForm(p => ({
    ...p,
    rooms: [...(p.rooms || []), {
      id: Date.now(), room_type: '', room_name: '', smoking_policy: null,
      price_threshold: '1000000', max_occupancy: 0, has_bedrooms: null,
      bed_configs: [{ id: Date.now(), bed_type: '', bed_count: '' }],
      room_facilities: [],
      photo_groups: [{ id: Date.now(), category: '', files: [], mainIdx: null }],
    }],
  }))
  const removeRoom = (id) => setForm(p => ({ ...p, rooms: p.rooms.filter(r => r.id !== id) }))

  return (
    <div className="space-y-5">
      {(form.rooms || []).map((room, idx) => (
        <RoomForm
          key={room.id}
          room={room}
          index={idx}
          onChange={updated => updateRoom(room.id, updated)}
          onRemove={() => removeRoom(room.id)}
          showErrors={showErrors}
        />
      ))}
      <button type="button" onClick={addRoom}
        className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-2xl text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors w-full justify-center">
        <Plus className="w-4 h-4" /> Tambah Kamar Lain
      </button>
    </div>
  )
}

// ── Step 10: Review Detail Kamar ───────────────────────────────────────────
function Step10ReviewKamar({ form, setForm }) {
  const [expandedId, setExpandedId] = useState(null)

  const copyRoom = (room) => {
    const newId = Date.now()
    setForm(p => ({
      ...p,
      rooms: [...p.rooms, {
        ...room,
        id: newId,
        room_name: room.room_name ? `${room.room_name} (Copy)` : '',
        bed_configs: (room.bed_configs || []).map(b => ({ ...b, id: Date.now() + Math.random() })),
        photo_groups: (room.photo_groups || []).map(g => ({ ...g, id: Date.now() + Math.random(), files: [] })),
      }],
    }))
    setExpandedId(newId)
  }

  const addRoom = () => {
    const newId = Date.now()
    setForm(p => ({
      ...p,
      rooms: [...(p.rooms || []), {
        id: newId, room_type: '', room_name: '', smoking_policy: null,
        price_threshold: '1000000', max_occupancy: 0, has_bedrooms: null,
        bed_configs: [{ id: Date.now() + 1, bed_type: '', bed_count: '' }],
        room_facilities: [],
        photo_groups: [{ id: Date.now() + 2, category: '', files: [], mainIdx: null }],
      }],
    }))
    setExpandedId(newId)
  }

  const removeRoom = (id) => {
    setForm(p => ({ ...p, rooms: p.rooms.filter(r => r.id !== id) }))
    if (expandedId === id) setExpandedId(null)
  }

  const updateRoom = (id, updated) => setForm(p => ({
    ...p, rooms: p.rooms.map(r => r.id === id ? updated : r),
  }))

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <p className="text-sm text-slate-500 mb-6">Pastikan semua detail sudah benar.</p>

      <div className="space-y-3 mb-6">
        {(form.rooms || []).map((room, idx) => (
          <div key={room.id} className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Room row */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50">
              <p className="font-semibold text-slate-800">
                {room.room_name || `Kamar ${idx + 1}`}
              </p>
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => copyRoom(room)}
                  className="text-sm text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                >
                  Copy Kamar
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === room.id ? null : room.id)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  Edit Detail
                  <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', expandedId === room.id && 'rotate-180')} />
                </button>
              </div>
            </div>

            {/* Inline edit form */}
            {expandedId === room.id && (
              <div className="border-t border-slate-100">
                <RoomForm
                  room={room}
                  index={idx}
                  onChange={updated => updateRoom(room.id, updated)}
                  onRemove={() => removeRoom(room.id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRoom}
        className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors text-sm tracking-widest shadow-sm"
      >
        TAMBAH KAMAR BARU
      </button>
    </div>
  )
}

// ── Step 11: Detail Pembayaran ─────────────────────────────────────────────
const BANKS = [
  'Bank BCA', 'Bank BNI', 'Bank BRI', 'Bank Mandiri', 'Bank BTN',
  'Bank CIMB Niaga', 'Bank Danamon', 'Bank Permata', 'Bank Syariah Indonesia (BSI)',
  'Bank Mega', 'Bank Panin', 'Bank OCBC NISP', 'Bank Maybank', 'Lainnya',
]

const CANCELLATION_POLICIES = [
  { value: 'free_cancel_24h',  label: 'Bebas Batalkan — Gratis pembatalan hingga 24 jam sebelum check-in' },
  { value: 'free_cancel_48h',  label: 'Bebas Batalkan — Gratis pembatalan hingga 48 jam sebelum check-in' },
  { value: 'free_cancel_72h',  label: 'Bebas Batalkan — Gratis pembatalan hingga 72 jam sebelum check-in' },
  { value: 'non_refundable',   label: 'Tidak Dapat Dibatalkan — Pembayaran tidak dikembalikan' },
  { value: 'partial_refund',   label: 'Refund Sebagian — Potongan 50% jika dibatalkan < 24 jam check-in' },
]

const VCC_CARD_TYPES = ['Visa', 'Mastercard', 'American Express', 'JCB', 'UnionPay']

function UploadDocButton({ label, file, onChange }) {
  return (
    <div>
      <label className="flex items-center justify-between px-4 py-3 border border-blue-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
        <span className="text-sm text-blue-600 font-medium">{label}</span>
        <Upload className="w-4 h-4 text-blue-400 shrink-0" />
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={e => onChange(e.target.files?.[0] || null)} />
      </label>
      {file && <p className="mt-1 text-xs text-slate-500 truncate">{file.name}</p>}
      <p className="mt-1 text-xs text-slate-400">File must be in .JPG, .JPEG, .PNG, or .PDF</p>
      <p className="text-xs text-slate-400">Maximum file size: 5 MB</p>
    </div>
  )
}

function NpwpAgreements({ form, set }) {
  return (
    <div className="space-y-3 pt-4 border-t border-slate-100">
      {[
        { key: 'npwp_agree1', text: 'Saya telah mengisi NPWP/NIK dan NITKU sesuai data yang terdaftar dan memahami bahwa ArahInn tidak bertanggung jawab atas keterangan data yang salah.' },
        { key: 'npwp_agree2', text: 'Saya telah membaca dan menyetujui Syarat dan Ketentuan.' },
      ].map(({ key, text }) => (
        <label key={key} className="flex items-start gap-3 cursor-pointer group">
          <span className={cn(
            'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
            form[key] ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
          )}>
            {form[key] && <Check className="w-2.5 h-2.5 text-white" />}
          </span>
          <input type="checkbox" className="sr-only" checked={form[key]} onChange={() => set(key, !form[key])} />
          <span className="text-sm text-slate-600 leading-relaxed">{text}</span>
        </label>
      ))}
    </div>
  )
}

function Step11Pembayaran({ form, setForm }) {
  const [openPembayaran, setOpenPembayaran] = useState(true)
  const [openPajak,      setOpenPajak]      = useState(false)
  const [openBatalkan,   setOpenBatalkan]   = useState(false)

  const set = (key, value) => setForm(p => ({ ...p, [key]: value }))

  const toggleVccType = (type) => {
    const cur = form.vcc_accepted_types || []
    set('vcc_accepted_types', cur.includes(type) ? cur.filter(t => t !== type) : [...cur, type])
  }

  const PAYMENT_METHODS = [
    {
      value: 'transfer',
      label: 'Transfer Bank',
      desc: 'Pencairan langsung ke rekening bank Anda',
      icon: '🏦',
    },
    {
      value: 'vcc',
      label: 'Kartu Kredit Virtual',
      desc: 'ArahInn membayar menggunakan Virtual Credit Card (VCC)',
      icon: '💳',
    },
  ]

  return (
    <div className="space-y-4">

      {/* ── Metode Pembayaran ── */}
      <CollapsibleSection
        title="Metode Pembayaran Pencairan Dana"
        subtitle="Pilih cara ArahInn mentransfer hasil pemesanan kepada Anda."
        open={openPembayaran}
        onToggle={() => setOpenPembayaran(o => !o)}
      >
        <div className="space-y-4 pt-4">
          {/* Method selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map(m => {
              const checked = form.payment_method === m.value
              return (
                <label
                  key={m.value}
                  className={cn(
                    'flex items-start gap-3 px-4 py-4 rounded-xl border-2 cursor-pointer transition-all',
                    checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span className={cn(
                    'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  )}>
                    {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <input type="radio" className="sr-only" checked={checked} onChange={() => set('payment_method', m.value)} />
                  <div>
                    <p className="text-xl mb-1">{m.icon}</p>
                    <p className={cn('text-sm font-semibold', checked ? 'text-blue-700' : 'text-slate-700')}>{m.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                  </div>
                </label>
              )
            })}
          </div>

          {/* ── Transfer Bank fields ── */}
          {form.payment_method === 'transfer' && (
            <div className="space-y-4 pt-2 border-t border-slate-100 mt-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Bank <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.bank_name}
                    onChange={e => set('bank_name', e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
                  >
                    <option value="">Pilih bank</option>
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Pemilik Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.bank_account_name}
                  onChange={e => set('bank_account_name', e.target.value)}
                  placeholder="Sesuai buku tabungan / kartu ATM"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nomor Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.bank_account_number}
                  onChange={e => set('bank_account_number', e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 1234567890"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cabang Bank</label>
                <input
                  type="text"
                  value={form.bank_branch}
                  onChange={e => set('bank_branch', e.target.value)}
                  placeholder="Contoh: KCP Jakarta Selatan (opsional)"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* ── Virtual Credit Card fields ── */}
          {form.payment_method === 'vcc' && (
            <div className="space-y-5 pt-2 border-t border-slate-100 mt-2">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700">
                  ArahInn akan mengirimkan pembayaran melalui Virtual Credit Card (VCC) untuk setiap pemesanan yang telah selesai. Pastikan Anda memiliki fasilitas untuk memproses kartu kredit.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Jenis Kartu Kredit yang Dapat Diproses <span className="text-red-500">*</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {VCC_CARD_TYPES.map(type => {
                    const checked = (form.vcc_accepted_types || []).includes(type)
                    return (
                      <label
                        key={type}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium',
                          checked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        )}
                      >
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleVccType(type)} />
                        <span className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                          checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        )}>
                          {checked && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        {type}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Penerima Pembayaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.vcc_account_name}
                  onChange={e => set('vcc_account_name', e.target.value)}
                  placeholder="Nama yang tertera pada terminal POS"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Notifikasi VCC <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.vcc_email}
                  onChange={e => set('vcc_email', e.target.value)}
                  placeholder="Email untuk menerima informasi VCC"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ── NPWP ── */}
      <CollapsibleSection
        title="Tipe Nomor Pokok Wajib Pajak (NPWP)"
        subtitle="NPWP diperlukan untuk mengaktifkan properti. Anda bisa menambahkannya sekarang atau nanti."
        open={openPajak}
        onToggle={() => setOpenPajak(o => !o)}
      >
        <div className="space-y-5 pt-4">
          {/* Tipe selector */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Pilih tipe NPWP:</p>
            <p className="text-xs text-slate-600 mb-0.5">
              <span className="font-semibold">NPWP Perusahaan:</span> Untuk properti yang terdaftar atas nama Perseroan Terbatas (PT).
            </p>
            <p className="text-xs text-slate-600 mb-4">
              <span className="font-semibold">NPWP Pribadi/NIK:</span> Untuk properti pribadi tanpa NPWP, masukkan Nomor KTP (NIK) pemilik.
            </p>
            <div className="flex flex-wrap gap-5">
              {[
                { value: 'perusahaan', label: 'NPWP Perusahaan' },
                { value: 'pribadi',    label: 'NPWP Pribadi/NIK' },
                { value: 'nanti',      label: 'Saya akan mengisinya nanti' },
              ].map(opt => {
                const checked = form.npwp_type === opt.value
                return (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <span className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                    )}>
                      {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <input type="radio" className="sr-only" checked={checked} onChange={() => {
                      set('npwp_type', opt.value)
                      setForm(p => ({ ...p, npwp_number: '', npwp_name: '', npwp_doc: null, nitku_number: '', nitku_name: '', nitku_doc: null, npwp_support_doc: null, npwp_agree1: false, npwp_agree2: false, npwp_type: opt.value }))
                    }} />
                    <span className={cn('text-sm transition-colors', checked ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-slate-800')}>{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* ── NPWP Perusahaan ── */}
          {form.npwp_type === 'perusahaan' && (
            <div className="space-y-5 pt-2 border-t border-slate-100">
              {/* NPWP Badan */}
              <div>
                <p className="text-sm font-bold text-slate-800 mb-3">Nomor Pokok Wajib Pajak (NPWP) Badan</p>
                <div className="space-y-3">
                  <input type="text" value={form.npwp_number} onChange={e => set('npwp_number', e.target.value)}
                    placeholder="Nomor Pokok Wajib Pajak (NPWP)"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400" />
                  <input type="text" value={form.npwp_name} onChange={e => set('npwp_name', e.target.value)}
                    placeholder="Nama yang terdaftar"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400" />
                  <UploadDocButton label="Upload dokumen NPWP" file={form.npwp_doc} onChange={f => set('npwp_doc', f)} />
                </div>
              </div>

              {/* NITKU Opsional */}
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm font-bold text-slate-800 mb-0.5">Nomor Identitas Tempat Kegiatan Usaha (NITKU) <span className="font-normal text-slate-400">— Opsional</span></p>
                <p className="text-xs text-slate-400 mb-3">Masukkan NITKU jika ada. Jika tidak, biarkan kolom ini kosong.</p>
                <div className="space-y-3">
                  <input type="text" value={form.nitku_number} onChange={e => set('nitku_number', e.target.value)}
                    placeholder="Nomor Identitas Tempat Kegiatan Usaha (NITKU)"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400" />
                  <input type="text" value={form.nitku_name} onChange={e => set('nitku_name', e.target.value)}
                    placeholder="Nama yang terdaftar"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400" />
                  <UploadDocButton label="Upload dokumen NITKU" file={form.nitku_doc} onChange={f => set('nitku_doc', f)} />
                </div>
              </div>

              {/* Dokumen Pendukung */}
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm font-bold text-slate-800 mb-0.5">Dokumen Pendukung</p>
                <p className="text-xs text-slate-400 mb-3">
                  Untuk keperluan verifikasi, upload surat tanda registrasi atau bukti potongan pajak jika nama di NPWP dan NITKU berbeda.
                </p>
                <UploadDocButton label="Upload dokumen pendukung" file={form.npwp_support_doc} onChange={f => set('npwp_support_doc', f)} />
              </div>

              <NpwpAgreements form={form} set={set} />
            </div>
          )}

          {/* ── NPWP Pribadi/NIK ── */}
          {form.npwp_type === 'pribadi' && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-800">NPWP Pribadi/NIK</p>
              <input type="text" value={form.npwp_number} onChange={e => set('npwp_number', e.target.value)}
                placeholder="Nomor Pokok Wajib Pajak (NPWP)/NIK"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400" />
              <input type="text" value={form.npwp_name} onChange={e => set('npwp_name', e.target.value)}
                placeholder="Nama yang terdaftar"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400" />
              <UploadDocButton label="Upload dokumen NPWP/NIK" file={form.npwp_doc} onChange={f => set('npwp_doc', f)} />
              <NpwpAgreements form={form} set={set} />
            </div>
          )}

          {/* ── Nanti ── */}
          {form.npwp_type === 'nanti' && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Setelah registrasi, silakan isi NPWP agar registrasi disetujui dan properti Anda bisa aktif di <strong>ArahInn</strong>.
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ── Kebijakan Pembatalan ── */}
      <CollapsibleSection
        title="Kebijakan Pembatalan"
        subtitle="Kebijakan ini akan ditampilkan kepada tamu saat melakukan pemesanan."
        open={openBatalkan}
        onToggle={() => setOpenBatalkan(o => !o)}
      >
        <div className="space-y-2.5 pt-4">
          {CANCELLATION_POLICIES.map(policy => {
            const checked = form.cancellation_policy === policy.value
            return (
              <label
                key={policy.value}
                className={cn(
                  'flex items-start gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-colors',
                  checked ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                )}
              >
                <span className={cn(
                  'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                )}>
                  {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <input type="radio" className="sr-only" checked={checked} onChange={() => set('cancellation_policy', policy.value)} />
                <span className={cn('text-sm leading-relaxed', checked ? 'text-slate-900 font-medium' : 'text-slate-600')}>
                  {policy.label}
                </span>
              </label>
            )
          })}
        </div>
      </CollapsibleSection>
    </div>
  )
}

const REGISTRATION_SOURCES = [
  'Market Manager arahinn.com',
  'Iklan media sosial (Facebook, Instagram)',
  'Postingan media sosial (Facebook, Instagram)',
  'Aplikasi arahinn.com',
  'Website arahinn.com',
  'Rekomendasi teman / kolega',
  'Email / Newsletter arahinn.com',
  'Event / Pameran Properti',
  'Lainnya',
]

// ── Step 12: Review Registrasi ─────────────────────────────────────────────
function Step6Review({ form, setForm, user, setStep }) {
  const [expanded, setExpanded] = useState({})
  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }))

  const guestMap  = Object.fromEntries(GUEST_TYPES.map(g => [g.id, g.label]))
  const starLabel = form.star_rating === 0 ? 'No Star'
                  : form.star_rating ? `${'★'.repeat(form.star_rating)} (${form.star_rating} Bintang)` : '–'

  const REVIEW_SECTIONS = [
    {
      key: 'tipe_tamu', label: 'Tipe Tamu', editable: false, stepNum: 1,
      rows: [
        { label: 'Tipe Tamu',     value: form.guestTypes?.length ? form.guestTypes.map(id => guestMap[id]).join(', ') : '–' },
        { label: 'Tipe Properti', value: form.category || '–' },
      ],
    },
    {
      key: 'info_umum', label: 'Info Umum', editable: false, stepNum: 2,
      rows: [
        { label: 'Nama Properti', value: form.name || '–' },
        { label: 'Alias',         value: form.alias || '–' },
        { label: 'Bintang',       value: starLabel },
        { label: 'Brand / Chain', value: form.is_brand_chain ? 'Ya' : 'Tidak' },
        { label: 'Mata Uang',     value: form.currency || '–' },
        { label: 'Provinsi',      value: form.province || '–' },
        { label: 'Kota/Kab',      value: form.city || '–' },
        { label: 'Alamat',        value: form.address || '–', wrap: true },
      ],
    },
    {
      key: 'detail_kontak', label: 'Detail Kontak', editable: false, stepNum: 3,
      rows: [
        { label: 'PIC',               value: user?.name || '–' },
        { label: 'Jabatan',           value: form.position || '–' },
        { label: 'Email',             value: user?.email || '–' },
        { label: 'No. Telepon',       value: form.phone ? `+62 ${form.phone}` : '–' },
        { label: 'No. Tel. Properti', value: form.property_phone ? `+62 ${form.property_phone}` : '–' },
      ],
    },
    {
      key: 'detail_perjanjian', label: 'Detail Perjanjian', editable: false, stepNum: 4,
      rows: [
        { label: 'Nama Perusahaan',      value: form.company_name || '–' },
        { label: 'Alamat Usaha',         value: form.company_address || '–', wrap: true },
        { label: 'Negara',               value: form.company_country || '–' },
        { label: 'Nama PIC Perjanjian',  value: form.agree_name || '–' },
        { label: 'Jabatan',              value: form.agree_position || '–' },
      ],
    },
    {
      key: 'platform_lain', label: 'Platform Lain', editable: true, stepNum: 5,
      rows: form.platform_none
        ? [{ label: 'Status', value: 'Belum terdaftar di platform lain' }]
        : Object.entries(form.platforms || {}).map(([name, url]) => ({ label: name, value: url || '(link belum diisi)' })),
    },
    {
      key: 'fasilitas', label: 'Fasilitas Properti', editable: true, stepNum: 6,
      rows: form.facilities?.length
        ? [{ label: 'Dipilih', value: form.facilities.join(', '), wrap: true }]
        : [{ label: 'Fasilitas', value: '–' }],
    },
    {
      key: 'foto_properti', label: 'Foto Properti', editable: true, stepNum: 7,
      rows: [{ label: 'Total Foto', value: `${(form.photo_groups || []).reduce((s, g) => s + (g.files?.length || 0), 0)} foto` }],
    },
    {
      key: 'kebijakan_umum', label: 'Kebijakan Umum', editable: true, stepNum: 8,
      rows: [
        { label: 'Jenis kelamin',     value: form.gender_policy === 'hanya_wanita' ? 'Hanya Wanita' : form.gender_policy === 'hanya_pria' ? 'Hanya Pria' : form.gender_policy === 'keduanya' ? 'Keduanya' : '–' },
        { label: 'Sarapan',           value: form.breakfast_available === true ? `Ya (${form.breakfast_start_hour}:${form.breakfast_start_minute} – ${form.breakfast_end_hour}:${form.breakfast_end_minute})` : form.breakfast_available === false ? 'Tidak' : '–' },
        { label: 'Merokok',           value: form.smoking_allowed === true ? 'Ya' : form.smoking_allowed === false ? 'Tidak' : '–' },
        { label: 'Hewan peliharaan',  value: form.pets_allowed === true ? 'Ya' : form.pets_allowed === false ? 'Tidak' : '–' },
      ],
    },
    {
      key: 'detail_kamar', label: 'Detail Kamar', editable: true, stepNum: 9,
      rows: (form.rooms || []).map(r => ({
        label: r.room_name || 'Kamar',
        value: `${r.room_type || '–'} · Maks. ${r.max_occupancy || 0} tamu · IDR ${Number(r.price_threshold || 0).toLocaleString('id-ID')}`,
      })),
    },
    {
      key: 'detail_pembayaran', label: 'Detail Pembayaran', editable: true, stepNum: 11,
      rows: [
        { label: 'Metode',  value: form.payment_method === 'transfer' ? 'Transfer Bank' : form.payment_method === 'vcc' ? 'Kartu Kredit Virtual' : '–' },
        ...(form.payment_method === 'transfer' ? [
          { label: 'Bank',         value: form.bank_name || '–' },
          { label: 'No. Rekening', value: form.bank_account_number || '–' },
        ] : form.payment_method === 'vcc' ? [
          { label: 'Kartu', value: (form.vcc_accepted_types || []).join(', ') || '–' },
        ] : []),
        { label: 'NPWP', value: form.npwp_type === 'nanti' ? 'Diisi setelah registrasi' : form.npwp_type === 'perusahaan' ? `Perusahaan: ${form.npwp_number || '–'}` : form.npwp_type === 'pribadi' ? `Pribadi/NIK: ${form.npwp_number || '–'}` : '–' },
        { label: 'Kebijakan Batal', value: CANCELLATION_POLICIES.find(p => p.value === form.cancellation_policy)?.label || '–', wrap: true },
      ],
    },
  ]

  return (
    <div>
      <p className="text-sm text-slate-500 mb-5">
        Pastikan semua detail sudah benar. Anda tidak bisa mengubahnya setelah registrasi diajukan.
      </p>

      <div className="space-y-2">
        {REVIEW_SECTIONS.map(sec => (
          <div key={sec.key} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            {/* Row header */}
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-sm font-semibold text-slate-800">{sec.label}</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => sec.editable ? setStep(sec.stepNum) : toggle(sec.key)}
                  className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  {sec.editable ? 'Edit Detail' : 'Lihat Detail'}
                </button>
                <button type="button" onClick={() => toggle(sec.key)}>
                  <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-200', expanded[sec.key] && 'rotate-180')} />
                </button>
              </div>
            </div>

            {/* Expanded rows */}
            {expanded[sec.key] && (
              <div className="border-t border-slate-100 bg-slate-50 divide-y divide-slate-100">
                {sec.rows.map((row, i) => (
                  <div key={i} className={cn('px-5 py-2.5 flex', row.wrap ? 'flex-col gap-0.5' : 'items-start justify-between gap-4')}>
                    <span className="text-xs text-slate-500 shrink-0">{row.label}</span>
                    <span className={cn('text-sm text-slate-800 font-medium', !row.wrap && 'text-right')}>{row.value}</span>
                  </div>
                ))}
                {sec.editable && (
                  <div className="px-5 py-3">
                    <button type="button" onClick={() => setStep(sec.stepNum)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                      ← Kembali ke {sec.label}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dari mana kamu tahu */}
      <div className="mt-4 border border-slate-200 rounded-xl p-5 bg-white">
        <p className="text-sm font-medium text-blue-600 mb-3">
          Dari mana kamu tahu tentang pendaftaran properti di ArahInn?
        </p>
        <div className="relative">
          <select
            value={form.registration_source}
            onChange={e => setForm(p => ({ ...p, registration_source: e.target.value }))}
            className="w-full appearance-none px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
          >
            <option value="">Pilih salah satu opsi</option>
            {REGISTRATION_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

// ── Draft helpers ──────────────────────────────────────────────────────────
const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000  // 7 hari

function sanitizeForStorage(form) {
  return {
    ...form,
    npwp_doc: null, nitku_doc: null, npwp_support_doc: null,
    photo_groups: (form.photo_groups || []).map(g => ({ ...g, files: [] })),
    rooms: (form.rooms || []).map(r => ({
      ...r,
      photo_groups: (r.photo_groups || []).map(g => ({ ...g, files: [] })),
    })),
  }
}

function calcTimeLeft(savedAt) {
  const msLeft = (savedAt + DRAFT_TTL) - Date.now()
  if (msLeft <= 0) return null
  const d = Math.floor(msLeft / (24 * 60 * 60 * 1000))
  const h = Math.floor((msLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const m = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000))
  if (d > 0) return `${d} hari ${h} jam`
  if (h > 0) return `${h} jam ${m} menit`
  return `${m} menit`
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function DaftarHotel() {
  const { toast }  = useToast()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const qc         = useQueryClient()
  const [step, setStep]       = useState(1)
  const [success, setSuccess]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [roomErrors, setRoomErrors]   = useState(false)
  const [form, setForm]       = useState(INIT)
  const [provId, setProvId]   = useState('')
  const [kotaId, setKotaId]   = useState('')
  const [kecId, setKecId]     = useState('')

  // ── Draft: state ──
  const draftKey = user?.id ? `arahin_hotel_draft_${user.id}` : null
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftMeta, setDraftMeta]           = useState(null)

  const clearDraft = () => {
    if (draftKey) try { localStorage.removeItem(draftKey) } catch {}
  }

  // Cek draft on mount
  useEffect(() => {
    if (!draftKey) return
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (!saved?.savedAt || !saved?.form) return
      const elapsed = Date.now() - saved.savedAt
      if (elapsed >= DRAFT_TTL) { localStorage.removeItem(draftKey); return }
      setDraftMeta({ step: saved.step || 1, timeLeft: calcTimeLeft(saved.savedAt), raw: saved })
      setShowDraftModal(true)
    } catch {}
  }, []) // eslint-disable-line

  // Auto-save draft (debounced 800ms)
  useEffect(() => {
    if (!draftKey || success) return
    if (step === 1 && !form.category) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          form: sanitizeForStorage(form),
          step,
          savedAt: Date.now(),
        }))
      } catch {}
    }, 800)
    return () => clearTimeout(timer)
  }, [form, step, success]) // eslint-disable-line

  const { data: provinces, isLoading: provLoading } = useQuery({
    queryKey: ['wilayah-provinces'],
    queryFn: wilayahApi.provinces,
    staleTime: 24 * 60 * 60 * 1000,
  })
  const { data: regencies, isLoading: regLoading } = useQuery({
    queryKey: ['wilayah-regencies', provId],
    queryFn: () => wilayahApi.regencies(provId),
    enabled: !!provId,
    staleTime: 24 * 60 * 60 * 1000,
  })
  const { data: districts, isLoading: distLoading } = useQuery({
    queryKey: ['wilayah-districts', kotaId],
    queryFn: () => wilayahApi.districts(kotaId),
    enabled: !!kotaId,
    staleTime: 24 * 60 * 60 * 1000,
  })
  const { data: villages, isLoading: vilLoading } = useQuery({
    queryKey: ['wilayah-villages', kecId],
    queryFn: () => wilayahApi.villages(kecId),
    enabled: !!kecId,
    staleTime: 24 * 60 * 60 * 1000,
  })

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()

      // ── String / scalar fields ──
      const scalarFields = [
        'category','name','alias','description','currency','star_rating',
        'is_brand_chain','address','city','district','village','province',
        'country','postal_code','latitude','longitude',
        'position','phone','property_phone','fax',
        'company_name','company_address','company_country',
        'agree_name','agree_position','agree_email','agree_phone',
        'cancellation_policy','payment_method',
        'bank_name','bank_branch','bank_account_name','bank_account_number',
        'vcc_email','vcc_account_name',
        'npwp_type','npwp_number','npwp_name',
        'nitku_number','nitku_name',
        'registration_source',
        // kebijakan step 8
        'gender_policy','marriage_book','deposit_required','all_ages_allowed',
        'breakfast_available',
        'breakfast_start_hour','breakfast_start_minute',
        'breakfast_end_hour','breakfast_end_minute',
        'smoking_allowed','alcohol_allowed','pets_allowed',
      ]
      scalarFields.forEach(k => {
        if (form[k] !== '' && form[k] != null) fd.append(k, form[k])
      })

      // ── JSON fields ──
      fd.append('guest_types',       JSON.stringify(form.guestTypes || []))
      fd.append('facilities',        JSON.stringify(form.facilities || []))
      fd.append('platforms',         JSON.stringify(form.platforms || {}))
      fd.append('vcc_accepted_types',JSON.stringify(form.vcc_accepted_types || []))

      // ── Hotel photos ──
      ;(form.photo_groups || []).forEach((group, gi) => {
        fd.append(`photo_categories[${gi}]`, group.category || '')
        ;(group.files || []).forEach(file => {
          if (file instanceof File) fd.append(`hotel_photos[${gi}][]`, file)
        })
      })

      // ── NPWP / NITKU docs ──
      if (form.npwp_doc instanceof File)        fd.append('npwp_doc',         form.npwp_doc)
      if (form.nitku_doc instanceof File)       fd.append('nitku_doc',        form.nitku_doc)
      if (form.npwp_support_doc instanceof File)fd.append('npwp_support_doc', form.npwp_support_doc)

      // ── Rooms meta (JSON) + room photos ──
      const roomsMeta = (form.rooms || []).map(r => ({
        room_type:       r.room_type,
        room_name:       r.room_name,
        smoking_policy:  r.smoking_policy,
        price_threshold: r.price_threshold,
        max_occupancy:   r.max_occupancy,
        has_bedrooms:    r.has_bedrooms,
        bed_configs:     r.bed_configs || [],
        room_facilities: r.room_facilities || [],
      }))
      fd.append('rooms_meta', JSON.stringify(roomsMeta))

      ;(form.rooms || []).forEach((room, ri) => {
        ;(room.photo_groups || []).forEach((group, gi) => {
          fd.append(`room_photos_category[${ri}][${gi}]`, group.category || '')
          ;(group.files || []).forEach(file => {
            if (file instanceof File) fd.append(`room_photos[${ri}][${gi}][]`, file)
          })
        })
      })

      return hotelApi.create(fd)
    },
    onSuccess: () => { clearDraft(); qc.invalidateQueries({ queryKey: ['owner-my-hotels'] }); setSuccess(true) },
    onError: (e) => toast({
      title: 'Gagal mendaftarkan hotel',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant: 'destructive',
    }),
  })

  const canNext = () => {
    if (step === 1) return !!form.category
    if (step === 2) return !!form.name.trim() && !!form.address.trim() && !!form.province && !!form.city
    if (step === 3) return true
    if (step === 4) return !!form.company_name.trim() && !!form.company_country &&
                           form.check1 && form.check2 && form.check3 && form.check4
    if (step === 5) return true
    if (step === 6) return (form.facilities?.length || 0) >= 3
    if (step === 7) {
      const totalPhotos = (form.photo_groups || []).reduce((s, g) => s + (g.files?.length || 0), 0)
      return totalPhotos >= 4
    }
    if (step === 8) {
      return KEBIJAKAN_QUESTIONS.every(q => form[q.key] !== null && form[q.key] !== undefined)
    }
    if (step === 9 || step === 10) {
      return (form.rooms || []).length > 0 &&
        (form.rooms || []).every(r => !!r.room_type && !!r.room_name.trim() && r.max_occupancy > 0)
    }
    if (step === 11) {
      if (!form.payment_method || !form.cancellation_policy || !form.npwp_type) return false
      if (form.payment_method === 'transfer' &&
          (!form.bank_name || !form.bank_account_name.trim() || !form.bank_account_number.trim())) return false
      if (form.payment_method === 'vcc' &&
          ((form.vcc_accepted_types || []).length === 0 || !form.vcc_account_name.trim() || !form.vcc_email.trim())) return false
      if (form.npwp_type !== 'nanti') {
        if (!form.npwp_number.trim() || !form.npwp_name.trim()) return false
        if (!form.npwp_agree1 || !form.npwp_agree2) return false
      }
      return true
    }
    return true
  }

  const handleNext = () => {
    if (!canNext()) {
      if (step === 9 || step === 10) setRoomErrors(true)
      const msg =
        step === 1 ? 'Pilih tipe properti terlebih dahulu.' :
        step === 2 && !form.name.trim() ? 'Nama properti harus diisi.' :
        step === 2 ? 'Provinsi, kota, dan alamat harus diisi.' :
        step === 4 && !form.company_name.trim() ? 'Nama perusahaan/badan usaha harus diisi.' :
        step === 4 && !form.company_country ? 'Pilih negara terlebih dahulu.' :
        step === 4 ? 'Centang semua pernyataan perjanjian untuk melanjutkan.' :
        step === 7 ? `Upload minimal 4 foto (saat ini ${(form.photo_groups || []).reduce((s, g) => s + (g.files?.length || 0), 0)} foto).` :
        step === 8 ? 'Jawab semua pertanyaan kebijakan terlebih dahulu.' :
        (step === 9 || step === 10) ? 'Lengkapi tipe kamar, nama kamar, dan maksimum tamu untuk setiap kamar.' :
        step === 11 ? 'Lengkapi informasi bank, kepemilikan NPWP, dan kebijakan pembatalan.' :
        `Pilih minimal 3 fasilitas (saat ini ${form.facilities?.length || 0} dipilih).`
      toast({ title: 'Lengkapi data', description: msg, variant: 'destructive' })
      return
    }
    if (step === 9 || step === 10) setRoomErrors(false)
    if (step < STEPS.length) {
      setStep(s => s + 1)
    } else {
      setShowConfirm(true)
    }
  }

  const resetAll = () => {
    clearDraft()
    setStep(1); setForm(INIT); setSuccess(false)
    setProvId(''); setKotaId(''); setKecId('')
  }

  if (success) return (
    <div className="max-w-lg mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Pendaftaran Terkirim!</h2>
        <p className="text-sm text-slate-500 mb-1">
          Hotel <span className="font-semibold text-slate-800">{form.name}</span> berhasil didaftarkan.
        </p>
        <p className="text-sm text-slate-400 mb-8">
          Status saat ini <span className="font-semibold text-amber-600">Menunggu Persetujuan</span>.<br />
          Pihak Manajemen ArahInn akan meninjau dan menginformasikan status properti Anda.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={resetAll} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Daftarkan Hotel Lain
          </button>
          <button onClick={() => navigate('/owner')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  )

  const wilayah = {
    provId, setProvId, kotaId, setKotaId, kecId, setKecId,
    provinces, regencies, districts, villages,
    provLoading, regLoading, distLoading, vilLoading,
  }

  return (
    <>

    {/* ── Draft Resume Modal ── */}
    {showDraftModal && draftMeta && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 text-white">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Save className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold">Lanjutkan Pengisian?</h2>
            </div>
            <p className="text-blue-100 text-sm pl-12">
              Anda memiliki draft pengisian properti yang belum selesai.
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Step info */}
            <div className="flex items-center gap-3 p-3.5 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {draftMeta.step}
              </div>
              <div>
                <p className="text-xs text-blue-500 font-medium">Terakhir di</p>
                <p className="text-sm font-semibold text-blue-900">
                  Langkah {draftMeta.step} dari {STEPS.length} &mdash; {STEPS[draftMeta.step - 1]?.label}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Progress pengisian</span>
                <span>{Math.round((draftMeta.step / STEPS.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.round((draftMeta.step / STEPS.length) * 100)}%` }}
                />
              </div>
            </div>

            {/* Expiry warning */}
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Draft akan <strong>otomatis dihapus</strong> dalam{' '}
                <span className="font-bold text-amber-800">{draftMeta.timeLeft}</span>.
                Setelah itu form akan kembali kosong.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                clearDraft()
                setShowDraftModal(false)
              }}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Mulai Baru
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  const { form: savedForm, step: savedStep } = draftMeta.raw
                  setForm(f => ({ ...INIT, ...savedForm }))
                  setStep(savedStep || 1)
                } catch {}
                setShowDraftModal(false)
              }}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="flex gap-6 items-start">
      <StepSidebar current={step} />

      <div className="flex-1 min-w-0 space-y-5">
        {/* Mobile progress */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">{STEPS[step - 1].label}</p>
            <p className="text-xs text-slate-400">Langkah {step} dari {STEPS.length}</p>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* Step header */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{STEPS[step - 1].label}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{STEPS[step - 1].subtitle}</p>
        </div>

        {/* Content */}
        {step === 1 && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><Step1 form={form} setForm={setForm} /></div>}
        {step === 2 && <Step2 form={form} setForm={setForm} wilayah={wilayah} />}
        {step === 3 && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><Step3Kontak form={form} setForm={setForm} user={user} /></div>}
        {step === 4 && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><Step4Perjanjian form={form} setForm={setForm} user={user} /></div>}
        {step === 5 && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><Step5PlatformLain form={form} setForm={setForm} /></div>}
        {step === 6 && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><Step6Fasilitas form={form} setForm={setForm} /></div>}
        {step === 7 && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><Step7Foto form={form} setForm={setForm} /></div>}
        {step === 8  && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><Step8Kebijakan form={form} setForm={setForm} /></div>}
        {step === 9  && <Step9DetailKamar form={form} setForm={setForm} showErrors={roomErrors} />}
        {step === 10 && <Step10ReviewKamar form={form} setForm={setForm} />}
        {step === 11 && <Step11Pembayaran form={form} setForm={setForm} />}
        {step === 12 && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-0.5">
            Review Registrasi{form.category ? ` (${form.category})` : ''}
          </h2>
          <Step6Review form={form} setForm={setForm} user={user} setStep={setStep} />
        </div>}

        {/* Action bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
          <button type="button" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/owner')}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? 'Kembali' : 'Batal'}
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => toast({ title: 'Draft tersimpan.' })}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Save className="w-4 h-4" /> Simpan Draft
            </button>
            <button type="button" onClick={handleNext} disabled={mutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
              {step === STEPS.length ? (
                <>
                  {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {mutation.isPending ? 'Mengirim...' : 'SUBMIT'}
                </>
              ) : (
                <>Lanjutkan <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ── Confirm Submit Modal ── */}
    {showConfirm && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Ajukan registrasi properti?</h2>
            <button type="button" onClick={() => setShowConfirm(false)}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors -mt-1 -mr-1">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-7">
            Pastikan semua detail sudah benar, ya. Kamu tidak bisa mengubahnya setelah registrasi diajukan.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowConfirm(false)}
              className="flex-1 py-2.5 border border-slate-200 rounded-full text-sm font-semibold text-blue-600 hover:bg-slate-50 transition-colors">
              CEK LAGI
            </button>
            <button type="button"
              onClick={() => { setShowConfirm(false); mutation.mutate() }}
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
              {mutation.isPending ? 'Mengirim...' : 'YA, SUBMIT'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
