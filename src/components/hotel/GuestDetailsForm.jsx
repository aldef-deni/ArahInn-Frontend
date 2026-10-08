import { forwardRef, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Loader2, ShieldCheck, Users, ArrowLeft } from 'lucide-react'
import { formatRupiah } from '@/services/api'

/**
 * Data tamu untuk pemesanan hotel mitra.
 *
 * Nama tamu harus nama SEBENARNYA — backend menolak placeholder seperti
 * "Guest One" / "Test Test", dan ETG mensyaratkan data tamu yang asli.
 * Jumlah tamu di sini mengikuti persis komposisi yang dipakai saat pencarian.
 */
export default function GuestDetailsForm({ rate, rooms = 1, adults = 2, submitting, onSubmit, onCancel }) {
  const { t } = useTranslation()
  const [agreed, setAgreed] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      rooms: Array.from({ length: rooms }, () => ({
        guests: Array.from({ length: adults }, () => ({ firstName: '', lastName: '' })),
      })),
      contact: { phone: '', comment: '' },
    },
  })

  const { fields: roomFields } = useFieldArray({ control, name: 'rooms' })

  const submit = (values) => {
    onSubmit({
      rooms: values.rooms.map(room => ({
        guests: room.guests.map(g => ({
          firstName: g.firstName.trim(),
          lastName : g.lastName.trim(),
        })),
      })),
      contact: {
        phone  : values.contact.phone?.trim() || undefined,
        comment: values.contact.comment?.trim() || undefined,
      },
    })
  }

  const cancel = rate?.cancellation ?? {}
  const taxesAtHotel = rate?.taxesAtHotel ?? []

  return (
    <form onSubmit={handleSubmit(submit)} className="bg-white rounded-2xl border border-slate-200 p-5">
      <button
        type="button" onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {t('supplier.pickAnotherRoom')}
      </button>

      <h3 className="mt-3 font-extrabold text-slate-900">{rate?.roomName}</h3>
      <p className="mt-0.5 text-sm text-slate-500">
        {formatRupiah(rate?.sellingAmount)} · {rate?.meal?.label ?? t('supplier.noMeal')}
      </p>

      <div className="mt-5 space-y-5">
        {roomFields.map((roomField, roomIdx) => (
          <div key={roomField.id}>
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
              <Users className="w-4 h-4 text-brand" /> {t('supplier.roomNumber', { n: roomIdx + 1 })}
            </h4>

            <div className="mt-3 space-y-3">
              {Array.from({ length: adults }).map((_, guestIdx) => (
                <div key={guestIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={t('supplier.guestFirstName', { n: guestIdx + 1 })}
                    error={errors?.rooms?.[roomIdx]?.guests?.[guestIdx]?.firstName}
                    {...register(`rooms.${roomIdx}.guests.${guestIdx}.firstName`, {
                      required: t('supplier.firstNameRequired'),
                      minLength: { value: 2, message: t('supplier.minTwoChars') },
                    })}
                  />
                  <Field
                    label={t('supplier.guestLastName')}
                    error={errors?.rooms?.[roomIdx]?.guests?.[guestIdx]?.lastName}
                    {...register(`rooms.${roomIdx}.guests.${guestIdx}.lastName`, {
                      required: t('supplier.lastNameRequired'),
                      minLength: { value: 2, message: t('supplier.minTwoChars') },
                    })}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('supplier.phoneOptional')} {...register('contact.phone')} />
          <Field label={t('supplier.requestOptional')} {...register('contact.comment')} />
        </div>
      </div>

      <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
        {t('supplier.nameNotice')}
      </p>

      {/* Ringkasan biaya: harga jual, pajak termasuk, dan pajak bayar-di-properti */}
      <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
        <Line label={t('supplier.roomPriceInclTax')} value={formatRupiah(rate?.sellingAmount)} strong />
        {taxesAtHotel.map((pajak, i) => (
          <Line
            key={i}
            label={t('supplier.taxAtProperty', { name: String(pajak.name ?? '').replace(/_/g, ' ') })}
            // Pajak memakai mata uang properti (mis. USD). Menampilkannya
            // sebagai Rupiah tanpa konversi membuat "17,70 USD" terbaca "Rp 18".
            value={`${pajak.currency ?? ''} ${Number(pajak.amount ?? 0).toLocaleString('id-ID', {
              minimumFractionDigits: 2, maximumFractionDigits: 2,
            })}`.trim() + (pajak.amountIdr ? ` (±${formatRupiah(pajak.amountIdr)})` : '')}
            muted
          />
        ))}
        <p className="pt-1 text-[11px] text-slate-500 flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px text-emerald-600" />
          {cancel.refundable
            ? t('supplier.refundableNote')
            : t('supplier.nonRefundableNote')}
        </p>
      </div>

      <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
        />
        <span className="text-xs text-slate-600 leading-relaxed">
          {t('supplier.agreeTerms')}
        </span>
      </label>

      <button
        type="submit" disabled={!agreed || submitting}
        className="mt-4 w-full py-3.5 rounded-xl bg-brand text-white font-bold text-sm hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
      >
        {submitting
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('supplier.processingBooking')}</>
          : <>{t('supplier.bookNow')} · {formatRupiah(rate?.sellingAmount)}</>}
      </button>
    </form>
  )
}

/**
 * ⚠️ WAJIB `forwardRef`. Jangan diubah jadi komponen fungsi biasa.
 *
 * `register()` milik react-hook-form mengembalikan `{ name, onChange, onBlur,
 * ref }`, dan `ref` itu disebarkan ke sini bersama prop lain. Komponen fungsi
 * biasa TIDAK bisa menerima `ref` sebagai prop — React menelannya diam-diam,
 * sehingga ref tidak pernah sampai ke <input> dan react-hook-form tidak pernah
 * terhubung ke kolom aslinya.
 *
 * Gejalanya menipu dan mahal: pengguna mengetik, DOM menampilkan teksnya, tapi
 * RHF tetap menganggap kolomnya kosong — jadi aturan `required` gagal dan
 * `handleSubmit` TIDAK PERNAH mengirim apa pun. Dari sisi server terlihat
 * seperti tidak ada yang terjadi sama sekali: tanpa permintaan, tanpa galat,
 * tanpa jejak. Ini sempat membuat pencarian sebab berjam-jam ke arah cache,
 * rate limit, dan validasi backend — padahal datanya tak pernah berangkat.
 */
const Field = forwardRef(function Field({ label, error, ...props }, ref) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-slate-600 mb-1">{label}</span>
      <input
        ref={ref}
        {...props}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
          error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-brand'
        }`}
      />
      {error && <span className="mt-1 block text-[11px] text-red-500">{error.message}</span>}
    </label>
  )
})

function Line({ label, value, strong, muted }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-xs ${muted ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm ${strong ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-500'}`}>
        {value}
      </span>
    </div>
  )
}
