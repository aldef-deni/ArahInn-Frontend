import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Modal error pencarian travel (pesawat/kereta/pelni). Terima error = { title, msg } | null.
// accent menyesuaikan tema moda (orange=kereta, sky=pesawat, cyan=pelni).
const BTN = {
  orange: 'bg-orange-500 hover:bg-orange-600',
  sky:    'bg-sky-500 hover:bg-sky-600',
  cyan:   'bg-cyan-500 hover:bg-cyan-600',
}

export default function TravelErrorModal({ error, onClose, accent = 'orange' }) {
  const { t } = useTranslation()
  if (!error) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-amber-600" />
        </div>
        <h3 className="font-display text-lg font-bold text-slate-900">{error.title}</h3>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{error.msg}</p>
        <button onClick={onClose}
          className={`w-full mt-5 py-3 rounded-xl text-white font-bold text-sm ${BTN[accent] || BTN.orange}`}>
          {t('travel.understood')}
        </button>
      </div>
    </div>
  )
}
