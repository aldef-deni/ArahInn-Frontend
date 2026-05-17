import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { ChevronUp, Info, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/utils'
import PriceInput from '@/components/ui/PriceInput'

/* ─── Collapsible section ─── */
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
      >
        <h3 className="font-bold text-slate-900 text-base">{title}</h3>
        <ChevronUp className={cn('w-4 h-4 text-slate-400 transition-transform', !open && 'rotate-180')} />
      </button>
      {open && <div className="divide-y divide-slate-100">{children}</div>}
    </div>
  )
}

/* ─── Row layout: label left, control right ─── */
function Row({ label, desc, children, noBorder }) {
  return (
    <div className={cn('grid grid-cols-2 gap-8 px-6 py-5', !noBorder && 'border-b border-slate-100 last:border-0')}>
      <div>
        <p className="font-semibold text-slate-800 text-sm">{label}</p>
        {desc && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{desc}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

/* ─── Radio option ─── */
function Radio({ name, value, checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange}
        className="w-4 h-4 text-blue-600" />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

const MEAL_OPTIONS = [
  { id: 'sarapan',     label: 'Sarapan' },
  { id: 'makan_siang', label: 'Makan siang' },
  { id: 'makan_malam', label: 'Makan malam' },
  { id: 'all_inclusive', label: 'All inclusive' },
]

const DEFAULT_FORM = {
  name: '',
  min_nights: 1,
  max_nights: 365,
  parent_rate_plan_id: null,
  discount_percent: 0,
  meal_plan: 'none',
  meal_options: [],
  room_ids: [],
  cancellation_type: 'no_refund',
  cancellation_detail: {
    fee_days: 1,
    fee_type: 'percent',
    fee_value: 0,
    no_show_type: 'percent',
    no_show_value: 0,
  },
  tariff_mode: 'property',
  booking_period: 'anytime',
  stay_period: 'anytime',
  advance_booking: 'anytime',
  blackout_enabled: false,
  blackout_dates: [],
  child_pricing_enabled: false,
  target_settings: {
    platform: false,
    bilibili_tier: false,
    target_location: false,
  },
  multiplier: 1.0,
  active: true,
}

export default function RatePlanForm() {
  const { hotel } = useOutletContext()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { id }    = useParams()
  const { toast } = useToast()

  const planType = location.state?.planType  // { id, label, minNights }
  const isEdit   = !!id

  /* ─── Load existing plan for edit ─── */
  const { data: existingPlan, isLoading: planLoading } = useQuery({
    queryKey: ['rate-plan-detail', hotel?.id, id],
    queryFn: () => hotelApi.getRatePlan(hotel.id, id).then(r => r.data?.data),
    enabled: !!hotel?.id && isEdit,
  })

  /* ─── Load rooms ─── */
  const { data: rooms } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn: () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data),
    enabled: !!hotel?.id,
  })

  /* ─── Load all rate plans (for parent selector on mingguan/bulanan) ─── */
  const { data: allPlans } = useQuery({
    queryKey: ['rate-plans', hotel?.id],
    queryFn: () => hotelApi.getRatePlans(hotel.id).then(r => r.data?.data || []),
    enabled: !!hotel?.id,
  })
  const parentPlanOptions = (allPlans || []).filter(p => String(p.id) !== String(id))

  /* ─── Form state ─── */
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    type: planType?.id || 'custom',
    min_nights: planType?.minNights || 1,
  })

  useEffect(() => {
    if (existingPlan) {
      setForm({
        ...DEFAULT_FORM,
        ...existingPlan,
        cancellation_detail: existingPlan.cancellation_detail || DEFAULT_FORM.cancellation_detail,
        target_settings: existingPlan.target_settings || DEFAULT_FORM.target_settings,
        room_ids: existingPlan.room_ids || [],
        meal_options: existingPlan.meal_options || [],
        blackout_dates: existingPlan.blackout_dates || [],
      })
    }
  }, [existingPlan])

  const upd  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const updD = (k, v) => setForm(f => ({
    ...f, cancellation_detail: { ...f.cancellation_detail, [k]: v }
  }))
  const updT = (k, v) => setForm(f => ({
    ...f, target_settings: { ...f.target_settings, [k]: v }
  }))

  const toggleMealOption = (opt) => {
    setForm(f => ({
      ...f,
      meal_options: f.meal_options.includes(opt)
        ? f.meal_options.filter(o => o !== opt)
        : [...f.meal_options, opt],
    }))
  }

  const toggleRoomId = (rid) => {
    setForm(f => ({
      ...f,
      room_ids: f.room_ids.includes(rid)
        ? f.room_ids.filter(r => r !== rid)
        : [...f.room_ids, rid],
    }))
  }

  /* ─── Save mutation ─── */
  const mutation = useMutation({
    mutationFn: (d) =>
      isEdit
        ? hotelApi.updateRatePlan(hotel.id, id, d)
        : hotelApi.createRatePlan(hotel.id, d),
    onSuccess: () => {
      toast({ title: isEdit ? 'Rate plan berhasil diperbarui.' : 'Rate plan berhasil dibuat.' })
      navigate(location.pathname.includes('/admin/') ? '/admin/harga/rate-plan' : '/owner/harga/rate-plan')
    },
    onError: () => toast({ title: 'Gagal menyimpan rate plan.', variant: 'destructive' }),
  })

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({ title: 'Nama Rate Plan wajib diisi.', variant: 'destructive' })
      return
    }
    mutation.mutate(form)
  }

  const goBack = () =>
    navigate(location.pathname.includes('/admin/') ? '/admin/harga/rate-plan' : '/owner/harga/rate-plan')

  if (isEdit && planLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-slate-900">
        {isEdit ? 'Edit Rate Plan' : 'Tambah Rate Plan Baru'}
      </h1>

      {/* ──────────────── Section 1: Nama Rate Plan ──────────────── */}
      <Section title="Nama Rate Plan">
        <Row
          label="Nama Rate Plan"
          desc="Nama ini hanya untuk keperluan internal dan tidak akan tampil di halaman pengguna."
        >
          <input
            value={form.name}
            onChange={e => upd('name', e.target.value)}
            placeholder="Nama Rate Plan"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </Row>

        <Row
          label="Durasi menginap"
          desc="Anda bisa mengatur durasi menginap minimum dan maksimum yang harus dimasukkan tamu agar mereka bisa memesan properti Anda."
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  value={form.min_nights}
                  onChange={e => upd('min_nights', +e.target.value)}
                  disabled={form.type === 'mingguan' || form.type === 'bulanan'}
                  className={cn(
                    'w-full border rounded-xl px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200',
                    (form.type === 'mingguan' || form.type === 'bulanan')
                      ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                      : 'border-slate-200'
                  )}
                  placeholder="1"
                />
                {form.type !== 'mingguan' && form.type !== 'bulanan' && (
                  <button
                    type="button"
                    onClick={() => upd('min_nights', 1)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >×</button>
                )}
              </div>
              <span className="text-xs text-slate-500 shrink-0">Minimum Malam</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  value={form.max_nights}
                  onChange={e => upd('max_nights', +e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="365"
                />
                <button
                  type="button"
                  onClick={() => upd('max_nights', 365)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >×</button>
              </div>
              <span className="text-xs text-slate-500 shrink-0">Maksimum Malam</span>
            </div>
          </div>
        </Row>
      </Section>

      {/* ──────────────── Section 2: Detail Rate Plan ──────────────── */}
      <Section title="Detail Rate Plan">

        {/* Pilih Rate Plan — hanya untuk mingguan & bulanan */}
        {(form.type === 'mingguan' || form.type === 'bulanan') && (
          <Row
            label="Pilih Rate Plan"
            desc={`Untuk mempercepat proses pengaturan, Anda bisa membuat rate plan ${form.type} dari rate plan yang sudah di sini.`}
          >
            <div className="space-y-3">
              {/* Info box */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Harga rate plan ini akan dihitung dari harga rate plan yang Anda pilih dikurangi persentase pengurangan harga.
                </p>
              </div>
              {/* Selector row */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={form.parent_rate_plan_id || ''}
                  onChange={e => upd('parent_rate_plan_id', e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Pilih rate plan</option>
                  {parentPlanOptions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Atur pengurangan harga</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form.discount_percent}
                    onChange={e => upd('discount_percent', +e.target.value)}
                    placeholder="Diskon"
                    className="w-24 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              </div>
            </div>
          </Row>
        )}

        {/* Makanan */}
        <Row label="Makanan (Opsional)" desc="Jika Anda menambahkan makanan ke rate plan ini, harga yang akan dilihat oleh pengguna sudah termasuk harga makanan.">
          <div className="space-y-3">
            <Radio name="meal_plan" value="none" checked={form.meal_plan === 'none'} onChange={() => upd('meal_plan', 'none')} label="Tanpa makanan" />
            <Radio name="meal_plan" value="available" checked={form.meal_plan === 'available'} onChange={() => upd('meal_plan', 'available')} label="Makanan tersedia" />
            {form.meal_plan === 'available' && (
              <div className="ml-6 grid grid-cols-2 gap-2 mt-2">
                {MEAL_OPTIONS.map(o => (
                  <label key={o.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.meal_options.includes(o.id)}
                      onChange={() => toggleMealOption(o.id)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-slate-700">{o.label}</span>
                    {o.id === 'all_inclusive' && (
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </Row>

        {/* Kamar Terhubung */}
        <Row label="Kamar Terhubung" desc="Pilih kamar yang akan menggunakan pengaturan rate plan ini.">
          <div>
            <p className="text-xs text-red-500 font-semibold mb-2 flex items-start gap-1">
              <span className="shrink-0">Baru!</span>
              <span>Agar kamar Anda tetap dapat dipesan dan menghindari kehilangan potensi booking, atur Default Rates di sini.{' '}
                <button className="text-blue-600 underline font-normal">Bagaimana ini memengaruhi booking?</button>
              </span>
            </p>
            <div className="space-y-2">
              {rooms?.map(r => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.room_ids.length === 0 || form.room_ids.includes(r.id)}
                    onChange={() => toggleRoomId(r.id)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-slate-700">{r.name}</span>
                </label>
              ))}
              {!rooms?.length && (
                <p className="text-sm text-slate-400">Belum ada kamar tersedia.</p>
              )}
            </div>
          </div>
        </Row>

        {/* Kebijakan Pembatalan */}
        <Row label="Kebijakan Pembatalan" desc="Pilih Kebijakan Pembatalan yang akan berlaku untuk rate plan ini.">
          <div className="space-y-3">
            <Radio name="cancel" value="no_refund" checked={form.cancellation_type === 'no_refund'}
              onChange={() => upd('cancellation_type', 'no_refund')} label="Tidak bisa refund" />
            <Radio name="cancel" value="custom" checked={form.cancellation_type === 'custom'}
              onChange={() => upd('cancellation_type', 'custom')} label="Kebijakan custom" />

            {form.cancellation_type === 'custom' && (
              <div className="mt-3 ml-2 rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  {/* Biaya Pembatalan */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Biaya Pembatalan</p>
                    <p className="text-xs text-slate-500">Jika membatalkan pesanan</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={form.cancellation_detail.fee_days}
                        onChange={e => updD('fee_days', +e.target.value)}
                        className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="text-xs text-slate-500">hari</span>
                    </div>
                    <p className="text-xs text-slate-500">sebelum tanggal check-in (pukul 23:59 zona waktu di akomodasi), tamu akan dikenakan biaya sebesar:</p>
                    <div className="flex gap-3">
                      <Radio name="fee_type" value="percent" checked={form.cancellation_detail.fee_type === 'percent'}
                        onChange={() => updD('fee_type', 'percent')} label="Persentase" />
                      <Radio name="fee_type" value="night" checked={form.cancellation_detail.fee_type === 'night'}
                        onChange={() => updD('fee_type', 'night')} label="Malam" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={form.cancellation_detail.fee_value}
                        onChange={e => updD('fee_value', +e.target.value)}
                        className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>

                  {/* No-show */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">No-show</p>
                    <p className="text-xs text-slate-500">Jika tidak datang saat check-in, tamu akan dikenakan biaya sebesar:</p>
                    <div className="flex gap-3">
                      <Radio name="no_show_type" value="percent" checked={form.cancellation_detail.no_show_type === 'percent'}
                        onChange={() => updD('no_show_type', 'percent')} label="Persentase" />
                      <Radio name="no_show_type" value="night" checked={form.cancellation_detail.no_show_type === 'night'}
                        onChange={() => updD('no_show_type', 'night')} label="Malam" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={form.cancellation_detail.no_show_value}
                        onChange={e => updD('no_show_value', +e.target.value)}
                        className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>
                </div>

                {/* Info box */}
                <div className="border-t border-slate-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Kebijakan Pembatalan di halaman ini akan dijadikan pengaturan awal. Jika ingin membuat kebijakan khusus untuk tanggal tertentu, Anda bisa mengaturnya melalui menu{' '}
                    <span className="font-bold">Atur Harga & Ketersediaan</span>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Row>

        {/* Mode Tarif */}
        <Row label="Mode Tarif" desc="Pilih cara menghitung harga untuk rate plan ini.">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 border-transparent hover:border-slate-200 transition-colors">
              <input type="radio" name="tariff" value="property" checked={form.tariff_mode === 'property'}
                onChange={() => upd('tariff_mode', 'property')} className="w-4 h-4 mt-0.5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Mode Tarif Properti</p>
                <p className="text-xs text-slate-500 mt-0.5">Cara menghitung harga mengikuti perhitungan komisi properti (net atau sell).</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 border-transparent hover:border-slate-200 transition-colors">
              <input type="radio" name="tariff" value="static" checked={form.tariff_mode === 'static'}
                onChange={() => upd('tariff_mode', 'static')} className="w-4 h-4 mt-0.5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Static</p>
                <p className="text-xs text-slate-500 mt-0.5">Cara menghitung harga menggunakan mode tarif net. Khusus Rate Plan Anak mengikuti mode tarif properti.</p>
              </div>
            </label>
          </div>
        </Row>

        {/* Periode Pemesanan */}
        <Row label="Periode Pemesanan" desc="Pilih periode di mana calon tamu bisa memesan rate plan ini. Jika tidak diatur, rate plan ini akan selalu tersedia.">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Kapan calon tamu bisa memesan properti Anda dengan rate plan ini?</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="booking_period" value="anytime" checked={form.booking_period === 'anytime'}
                  onChange={() => upd('booking_period', 'anytime')} className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-slate-700">Kapanpun</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">Rekomendasi</span>
              </label>
              <Radio name="booking_period" value="specific" checked={form.booking_period === 'specific'}
                onChange={() => upd('booking_period', 'specific')} label="Hari dan jam tertentu" />
            </div>
          </div>
        </Row>

        {/* Periode Menginap */}
        <Row label="Periode Menginap" desc="Pilih rentang tanggal kapan tamu bisa menginap saat memesan rate plan ini. Jika tidak diatur, tamu bisa menginap kapan pun.">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Kapan tamu bisa menginap di properti Anda dengan rate plan ini?</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="stay_period" value="anytime" checked={form.stay_period === 'anytime'}
                  onChange={() => upd('stay_period', 'anytime')} className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-slate-700">Kapanpun</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">Rekomendasi</span>
              </label>
              <Radio name="stay_period" value="specific" checked={form.stay_period === 'specific'}
                onChange={() => upd('stay_period', 'specific')} label="Hari tertentu" />
            </div>
          </div>
        </Row>

        {/* Advance Booking */}
        <Row label="Advance Booking" desc="Isi minimum dan maksimum rentang waktu antara tanggal pemesanan dan tanggal check-in yang bisa tamu pilih.">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Kapan booking window yang diizinkan sebelum check-in?</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="advance_booking" value="anytime" checked={form.advance_booking === 'anytime'}
                  onChange={() => upd('advance_booking', 'anytime')} className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-slate-700">Kapanpun</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">Rekomendasi</span>
              </label>
              <Radio name="advance_booking" value="specific" checked={form.advance_booking === 'specific'}
                onChange={() => upd('advance_booking', 'specific')} label="Booking window tertentu" />
            </div>
          </div>
        </Row>

        {/* Tanggal Blackout */}
        <Row label="Tanggal Blackout (opsional)" desc="Anda bisa menambah rentang tanggal inap saat rate plan ini tidak berlaku. Maksimum tanggal blackout adalah 30 hari." noBorder>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">{form.blackout_enabled ? 'Aktif' : 'Nonaktif'}</span>
            <button
              type="button"
              onClick={() => upd('blackout_enabled', !form.blackout_enabled)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                form.blackout_enabled ? 'bg-blue-600' : 'bg-slate-300'
              )}
            >
              <span className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                form.blackout_enabled ? 'left-7' : 'left-1'
              )} />
            </button>
          </div>
        </Row>
      </Section>

      {/* ──────────────── Section 3: Harga untuk Anak ──────────────── */}
      <Section title="Harga untuk Anak">
        <Row
          label=""
          desc="Apakah Anda ingin mengatur harga untuk anak di rate plan ini? Anda belum pernah membuat pengaturan harga untuk anak. Dengan membuat pengaturan tersebut, properti Anda akan muncul saat calon tamu dengan anak melakukan pencarian."
          noBorder
        >
          <div className="space-y-2">
            <Radio name="child_pricing" value="yes" checked={form.child_pricing_enabled === true}
              onChange={() => upd('child_pricing_enabled', true)} label="Ya, atur harga untuk anak" />
            <Radio name="child_pricing" value="no" checked={form.child_pricing_enabled === false}
              onChange={() => upd('child_pricing_enabled', false)} label="Tidak, nanti saja" />
          </div>
        </Row>
      </Section>

      {/* ──────────────── Section 4: Pengaturan Pengguna Tertentu ──────────────── */}
      <Section title="Pengaturan untuk Pengguna Tertentu">
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-sm text-slate-500">
            Jika diperlukan, Anda bisa menampilkan rate plan ini hanya kepada pengguna tertentu berdasarkan platform, lokasi, atau tier Tiket Rewards.
          </p>
        </div>
        {[
          { key: 'platform',        label: 'Platform' },
          { key: 'bilibili_tier',   label: 'Tiket Rewards Tier' },
          { key: 'target_location', label: 'Target Lokasi' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between px-6 py-4 border-b border-slate-100 last:border-0">
            <span className="text-sm font-medium text-slate-700">{item.label}</span>
            <button
              type="button"
              onClick={() => updT(item.key, !form.target_settings[item.key])}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                form.target_settings[item.key] ? 'bg-blue-600' : 'bg-slate-300'
              )}
            >
              <span className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                form.target_settings[item.key] ? 'left-7' : 'left-1'
              )} />
            </button>
          </div>
        ))}
      </Section>

      {/* ──────────────── Footer ──────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={goBack}
          className="px-6 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Batalkan
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Simpan Perubahan' : 'Tambah rate plan baru'}
        </button>
      </div>
    </div>
  )
}
