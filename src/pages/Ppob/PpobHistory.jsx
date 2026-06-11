import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import PpobTransactionList from './PpobTransactionList'

export default function PpobHistory() {
  const { t } = useTranslation()
  return (
    <div className="bg-slate-50 sm:bg-transparent min-h-[60vh] pb-6">
      {/* Sticky header mobile */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 sm:hidden">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/topup-tagihan" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-all" aria-label={t('travel.back')}>
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="font-bold text-slate-900 text-base leading-tight flex-1">
            {t('ppob.historyTitle')}
          </h1>
        </div>
      </header>

      <div className="container py-4 sm:py-6 max-w-3xl">
        <div className="hidden sm:block">
          <Link to="/topup-tagihan" className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand mb-3">
            <ChevronLeft className="w-4 h-4" /> {t('ppob.backToPpob')}
          </Link>
          <h1 className="text-2xl font-display font-bold text-slate-900 mb-6">{t('ppob.historyTitleFull')}</h1>
        </div>

        <PpobTransactionList limit={30} />
      </div>
    </div>
  )
}
