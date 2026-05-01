import { useOutletContext } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { handleApiError } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/utils'
import { Check, Info, Save, X } from 'lucide-react'

const FACILITY_SECTIONS = [
  {
    key: 'popular',
    label: 'Fasilitas Populer',
    title: 'Fasilitas Populer',
    description: 'Pilihan fasilitas yang paling banyak dicari calon tamu dan paling cepat memengaruhi keputusan booking.',
    items: [
      { key: 'non_smoking', label: 'Bebas rokok' },
      { key: 'parking', label: 'Parkir gratis' },
      { key: 'pool', label: 'Kolam renang' },
      { key: 'living_room', label: 'Ruang tamu' },
      { key: 'ac', label: 'AC' },
      { key: 'laundry', label: 'Mesin cuci' },
      { key: 'minibar', label: 'Lemari es / minibar' },
      { key: 'barbecue', label: 'Peralatan barbecue' },
      { key: 'streaming', label: 'Layanan streaming', hint: 'Netflix, HBO, Disney+, dan layanan sejenis.' },
      { key: 'console_game', label: 'Konsol game' },
      { key: 'tv', label: 'Televisi' },
      { key: 'smart_tv', label: 'Smart TV' },
      { key: 'wifi', label: 'WiFi gratis' },
      { key: 'board_game', label: 'Board game' },
    ],
  },
  {
    key: 'general',
    label: 'General',
    title: 'Fasilitas Umum',
    description: 'Fasilitas dasar properti yang membentuk kenyamanan tamu sejak awal.',
    items: [
      { key: 'elevator', label: 'Lift' },
      { key: 'garden', label: 'Taman' },
      { key: 'terrace', label: 'Teras' },
      { key: 'family_friendly', label: 'Ramah keluarga' },
      { key: 'pet_friendly', label: 'Ramah hewan peliharaan' },
      { key: 'wheelchair_access', label: 'Akses kursi roda' },
    ],
  },
  {
    key: 'hotel_services',
    label: 'Layanan Hotel',
    title: 'Layanan Hotel',
    description: 'Atur layanan yang membantu operasional dan pengalaman menginap.',
    items: [
      { key: 'concierge', label: 'Concierge' },
      { key: 'room_service', label: 'Room service' },
      { key: 'daily_housekeeping', label: 'Housekeeping harian' },
      { key: 'frontdesk_24h', label: 'Resepsionis 24 jam' },
      { key: 'luggage_storage', label: 'Penyimpanan bagasi' },
      { key: 'express_checkin', label: 'Check-in cepat' },
    ],
  },
  {
    key: 'food',
    label: 'Makanan & Minuman',
    title: 'Makanan dan Minuman',
    description: 'Fasilitas F&B yang bisa menjadi nilai jual utama properti.',
    items: [
      { key: 'restaurant', label: 'Restoran' },
      { key: 'bar', label: 'Bar / lounge' },
      { key: 'coffee_shop', label: 'Kedai kopi' },
      { key: 'breakfast', label: 'Sarapan tersedia' },
      { key: 'kid_meals', label: 'Menu anak' },
      { key: 'bbq_area', label: 'Area BBQ' },
    ],
  },
  {
    key: 'transport',
    label: 'Transportasi',
    title: 'Transportasi',
    description: 'Tambahkan fasilitas mobilitas untuk memudahkan tamu tiba dan bepergian.',
    items: [
      { key: 'airport_shuttle', label: 'Antar jemput bandara' },
      { key: 'shuttle_service', label: 'Shuttle area sekitar' },
      { key: 'car_rental', label: 'Sewa mobil' },
      { key: 'valet_parking', label: 'Valet parking' },
      { key: 'bike_rental', label: 'Sewa sepeda' },
      { key: 'ev_charging', label: 'Pengisian kendaraan listrik' },
    ],
  },
  {
    key: 'business',
    label: 'Fasilitas Bisnis',
    title: 'Fasilitas Bisnis',
    description: 'Lengkapi properti untuk tamu corporate dan perjalanan kerja.',
    items: [
      { key: 'meeting_room', label: 'Ruang meeting' },
      { key: 'coworking', label: 'Area kerja bersama' },
      { key: 'printer', label: 'Printer / fotokopi' },
      { key: 'projector', label: 'Proyektor' },
      { key: 'conference_hall', label: 'Ballroom / hall' },
      { key: 'business_center', label: 'Business center' },
    ],
  },
  {
    key: 'health',
    label: 'Kesehatan',
    title: 'Kesehatan dan Relaksasi',
    description: 'Fitur wellness untuk meningkatkan persepsi kualitas properti.',
    items: [
      { key: 'spa', label: 'Spa' },
      { key: 'sauna', label: 'Sauna' },
      { key: 'gym', label: 'Gym / fitness center' },
      { key: 'yoga', label: 'Ruang yoga' },
      { key: 'massage', label: 'Layanan pijat' },
      { key: 'hot_tub', label: 'Hot tub' },
    ],
  },
  {
    key: 'media',
    label: 'Media dan Teknologi',
    title: 'Media dan Teknologi',
    description: 'Fasilitas digital yang sering dicari tamu modern.',
    items: [
      { key: 'wifi_premium', label: 'WiFi premium' },
      { key: 'streaming_ready', label: 'TV siap streaming' },
      { key: 'usb_port', label: 'Port USB di kamar' },
      { key: 'smart_lock', label: 'Smart lock' },
      { key: 'digital_tv', label: 'TV digital' },
      { key: 'sound_system', label: 'Sound system' },
    ],
  },
  {
    key: 'room',
    label: 'Fasilitas di Kamar',
    title: 'Fasilitas di Kamar',
    description: 'Fasilitas yang langsung memengaruhi kenyamanan saat menginap.',
    items: [
      { key: 'bathtub', label: 'Bathtub' },
      { key: 'jacuzzi', label: 'Jacuzzi' },
      { key: 'balcony', label: 'Balkon' },
      { key: 'kitchen', label: 'Dapur' },
      { key: 'extra_bed', label: 'Extra bed' },
      { key: 'workspace', label: 'Meja kerja' },
    ],
  },
]

function FacilityOption({ label, hint, active, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 py-4 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-base font-medium text-slate-900">{label}</p>
          {hint && (
            <span title={hint} className="text-slate-400">
              <Info className="h-4 w-4" />
            </span>
          )}
        </div>
        {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
            active
              ? 'border-blue-500 bg-blue-50 text-blue-600'
              : 'border-slate-300 bg-white text-slate-400 hover:border-blue-300'
          )}
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
            !active
              ? 'border-blue-500 bg-blue-50 text-blue-600'
              : 'border-slate-300 bg-white text-slate-400 hover:border-blue-300'
          )}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default function PropertiFasilitas() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [selected, setSelected] = useState([])
  const [activeSection, setActiveSection] = useState(FACILITY_SECTIONS[0].key)

  useEffect(() => {
    if (Array.isArray(hotel?.facilities)) {
      setSelected(hotel.facilities)
    }
  }, [hotel?.id, hotel?.facilities])

  const mutation = useMutation({
    mutationFn: () => hotelApi.update(hotel.id, { facilities: selected }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-my-hotels'] })
      toast({ title: 'Fasilitas berhasil diperbarui.' })
    },
    onError: (error) => toast({ title: handleApiError(error), variant: 'destructive' }),
  })

  if (!hotel) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Info className="w-7 h-7 text-slate-300" />
      </div>
      <p className="text-base font-semibold text-slate-500">Properti tidak ditemukan</p>
      <p className="text-sm mt-1">Pastikan Anda sudah mendaftarkan dan memilih properti.</p>
    </div>
  )

  const currentSection = useMemo(
    () => FACILITY_SECTIONS.find(section => section.key === activeSection) || FACILITY_SECTIONS[0],
    [activeSection]
  )

  const initialFacilities = hotel?.facilities || []
  const hasChanges = JSON.stringify([...selected].sort()) !== JSON.stringify([...initialFacilities].sort())
  const totalSelected = selected.length

  const setAvailability = (key, enabled) => {
    setSelected(previous => {
      const hasItem = previous.includes(key)
      if (enabled && !hasItem) return [...previous, key]
      if (!enabled && hasItem) return previous.filter(item => item !== key)
      return previous
    })
  }

  const resetChanges = () => setSelected(initialFacilities)

  const columns = currentSection.items.reduce((result, item, index) => {
    result[index % 2].push(item)
    return result
  }, [[], []])

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-6 md:p-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{currentSection.title}</h2>
              <p className="mt-3 text-base leading-7 text-slate-500">{currentSection.description}</p>
              <div className="mt-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                {totalSelected} fasilitas dipilih
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 md:p-6">
              <div className="grid gap-x-8 md:grid-cols-2">
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex}>
                    {column.map(item => (
                      <FacilityOption
                        key={item.key}
                        label={item.label}
                        hint={item.hint}
                        active={selected.includes(item.key)}
                        onToggle={(enabled) => setAvailability(item.key, enabled)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-white xl:border-l xl:border-t-0">
            <div className="sticky top-[178px] p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Kategori</p>
              <div className="space-y-1">
                {FACILITY_SECTIONS.map(section => (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    className={cn(
                      'w-full rounded-2xl px-4 py-3 text-left text-base font-medium transition-colors',
                      activeSection === section.key
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="sticky bottom-4 z-20 flex justify-end">
        <div className="flex w-full max-w-xl items-center justify-end gap-3 rounded-[28px] border border-slate-200 bg-white/95 px-4 py-4 shadow-lg backdrop-blur md:px-5">
          <button
            type="button"
            onClick={resetChanges}
            disabled={mutation.isPending || !hasChanges}
            className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batalkan
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !hasChanges}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}
