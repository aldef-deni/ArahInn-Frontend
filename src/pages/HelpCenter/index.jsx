import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LifeBuoy, ChevronDown, Mail, MessageCircle, Phone, Search,
  CalendarCheck, CreditCard, Ticket, RotateCcw, Gift, UserCog,
} from 'lucide-react'
import SEO from '@/components/SEO'

const WA_LINK    = 'https://wa.me/6285188136009'
const WA_DISPLAY = '+62 851-8813-6009'
const CS_EMAIL   = 'cs@arahinn.com'

/* ── FAQ (bilingual) ──────────────────────────────────────────────────── */
const FAQ = (en) => [
  {
    Icon: CalendarCheck,
    q: en ? 'How do I book a stay on ArahInn?' : 'Bagaimana cara memesan penginapan di ArahInn?',
    a: en
      ? 'Search for a hotel/property, pick your dates and room, then tap "Book". Fill in the guest details and continue to payment. Your booking is confirmed once payment is verified.'
      : 'Cari hotel/properti, pilih tanggal dan kamar, lalu klik "Pesan". Isi data tamu dan lanjut ke pembayaran. Pesanan terkonfirmasi setelah pembayaran diverifikasi.',
  },
  {
    Icon: CreditCard,
    q: en ? 'What payment methods are available?' : 'Metode pembayaran apa saja yang tersedia?',
    a: en
      ? 'Currently payment is via manual bank transfer. After booking, you will get the destination account and a unique transfer amount. Transfer the exact amount so our admin can verify it quickly — your e-voucher is issued automatically afterward.'
      : 'Saat ini pembayaran melalui transfer bank manual. Setelah memesan, Anda mendapat nomor rekening tujuan dan nominal transfer unik. Transfer nominal yang tepat agar admin cepat memverifikasi — e-voucher otomatis terbit setelahnya.',
  },
  {
    Icon: Ticket,
    q: en ? 'Where is my voucher / booking confirmation?' : 'Di mana voucher / konfirmasi pemesanan saya?',
    a: en
      ? 'After payment is verified, your e-voucher is sent to your email and is also available under Profile → My Orders. Show it (printed or on screen) together with your ID at check-in.'
      : 'Setelah pembayaran diverifikasi, e-voucher dikirim ke email Anda dan juga tersedia di Profil → Pesanan Saya. Tunjukkan (cetak atau di layar) beserta identitas saat check-in.',
  },
  {
    Icon: RotateCcw,
    q: en ? 'Can I reschedule or cancel a booking?' : 'Bisakah reschedule atau membatalkan pemesanan?',
    a: en
      ? 'Reschedule and refund follow the policy of the accommodation/partner, and a service fee may apply. Submit your request via My Orders or contact our CS — we will help process it according to the applicable terms.'
      : 'Reschedule dan refund mengikuti kebijakan akomodasi/mitra, dan dapat dikenakan biaya layanan. Ajukan lewat Pesanan Saya atau hubungi CS — kami bantu proses sesuai ketentuan yang berlaku.',
  },
  {
    Icon: Gift,
    q: en ? 'How do promos, campaigns & loyalty points work?' : 'Bagaimana promo, campaign & poin loyalitas bekerja?',
    a: en
      ? 'Campaign discounts apply automatically to eligible properties. Promo codes can be entered at checkout. You also earn loyalty points on each successful transaction, redeemable as a discount (1 point = Rp 1). See the Points page for details.'
      : 'Diskon campaign berlaku otomatis untuk properti yang memenuhi syarat. Kode promo bisa dimasukkan saat checkout. Anda juga mendapat poin loyalitas tiap transaksi sukses, bisa ditukar jadi potongan (1 poin = Rp 1). Lihat halaman Poin untuk detail.',
  },
  {
    Icon: Ticket,
    q: en ? 'Can I buy flight, ferry & PPOB on ArahInn?' : 'Bisakah beli tiket pesawat, kapal & PPOB di ArahInn?',
    a: en
      ? 'Yes. Via Top Up & Ticketing you can buy flight tickets, ferry (Pelni) tickets, mobile credit/data, electricity tokens, and pay bills — all in one app.'
      : 'Bisa. Lewat Top Up & Ticketing Anda dapat membeli tiket pesawat, tiket kapal (Pelni), pulsa/paket data, token listrik, dan bayar tagihan — semua dalam satu aplikasi.',
  },
  {
    Icon: UserCog,
    q: en ? 'How do I manage or delete my account?' : 'Bagaimana mengelola atau menghapus akun saya?',
    a: en
      ? 'Edit your profile under Profile → Account Info. To delete your account and related data, contact our CS — we will process it according to our Privacy Policy.'
      : 'Ubah profil di Profil → Informasi Akun. Untuk menghapus akun dan data terkait, hubungi CS — akan kami proses sesuai Kebijakan Privasi.',
  },
]

function FaqItem({ item, open, onToggle }) {
  const Icon = item.Icon
  return (
    <div className={`border rounded-2xl overflow-hidden transition-colors ${open ? 'border-brand/40 bg-brand/[0.02]' : 'border-slate-200 bg-white'}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 text-left">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${open ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>
          <Icon className="w-4.5 h-4.5" />
        </span>
        <span className="flex-1 font-semibold text-sm sm:text-base text-slate-900">{item.q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-16 sm:pl-[4.5rem] -mt-1">
          <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  )
}

export default function HelpCenter() {
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'
  const [openIdx, setOpenIdx] = useState(0)
  const [query, setQuery] = useState('')

  const faqs = FAQ(en)
  const filtered = query.trim()
    ? faqs.filter(f => `${f.q} ${f.a}`.toLowerCase().includes(query.trim().toLowerCase()))
    : faqs

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <SEO
        title={en ? 'Help Center — ArahInn' : 'Pusat Bantuan — ArahInn'}
        description={en ? 'Frequently asked questions and ways to reach ArahInn customer support.' : 'Pertanyaan yang sering diajukan dan cara menghubungi layanan pelanggan ArahInn.'}
        url="/pusat-bantuan"
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-800 via-brand to-brand-700 text-white">
        <div className="container py-12 sm:py-16 text-center">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur mb-4">
            <LifeBuoy className="w-7 h-7" />
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold">{en ? 'Help Center' : 'Pusat Bantuan'}</h1>
          <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl mx-auto">
            {en ? 'Find quick answers to common questions. Still need help? Our team is one tap away.' : 'Temukan jawaban cepat untuk pertanyaan umum. Masih butuh bantuan? Tim kami siap membantu.'}
          </p>
          <div className="relative max-w-md mx-auto mt-6">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder={en ? 'Search a question…' : 'Cari pertanyaan…'}
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-slate-800 text-sm bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-10 sm:py-12 max-w-3xl">
        <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-5">
          {en ? 'Frequently Asked Questions' : 'Pertanyaan yang Sering Diajukan'}
        </h2>
        <div className="space-y-3">
          {filtered.length === 0
            ? <p className="text-center text-sm text-slate-400 py-10">{en ? 'No matching question found.' : 'Tidak ada pertanyaan yang cocok.'}</p>
            : filtered.map((item, i) => (
              <FaqItem key={item.q} item={item} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
            ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 sm:mt-12 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-card">
          <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">{en ? 'Still need help?' : 'Masih butuh bantuan?'}</h3>
          <p className="text-sm text-slate-500 mt-1.5">{en ? 'Reach our customer support — we usually reply quickly.' : 'Hubungi layanan pelanggan kami — biasanya kami balas cepat.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors active:scale-[0.98]">
              <MessageCircle className="w-4.5 h-4.5" /> WhatsApp {WA_DISPLAY}
            </a>
            <a href={`mailto:${CS_EMAIL}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand hover:bg-brand-700 text-white font-bold text-sm transition-colors active:scale-[0.98]">
              <Mail className="w-4.5 h-4.5" /> {CS_EMAIL}
            </a>
          </div>
          <a href="tel:+6285188136009" className="inline-flex items-center gap-1.5 text-xs text-slate-400 mt-4 hover:text-brand transition-colors">
            <Phone className="w-3.5 h-3.5" /> {en ? 'Or call' : 'Atau telepon'} {WA_DISPLAY}
          </a>
        </div>
      </section>
    </div>
  )
}
