import { useTranslation } from 'react-i18next'
import { Mail, MessageCircle, Phone, Clock, Building2, ArrowUpRight, Headphones } from 'lucide-react'
import SEO from '@/components/SEO'

const WA_LINK    = 'https://wa.me/6285188136009'
const WA_DISPLAY = '+62 851-8813-6009'
const CS_EMAIL   = 'cs@arahinn.com'

export default function Contact() {
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'

  const channels = [
    {
      Icon: MessageCircle, accent: 'bg-green-500',
      label: 'WhatsApp', value: WA_DISPLAY,
      desc: en ? 'Fastest response, chat directly' : 'Respons tercepat, chat langsung',
      href: WA_LINK, external: true,
    },
    {
      Icon: Mail, accent: 'bg-brand',
      label: 'Email', value: CS_EMAIL,
      desc: en ? 'For detailed inquiries & documents' : 'Untuk pertanyaan rinci & dokumen',
      href: `mailto:${CS_EMAIL}`,
    },
    {
      Icon: Phone, accent: 'bg-slate-700',
      label: en ? 'Phone' : 'Telepon', value: WA_DISPLAY,
      desc: en ? 'Working hours only' : 'Hanya jam kerja',
      href: 'tel:+6285188136009',
    },
  ]

  const socials = [
    { label: 'Facebook',  href: 'https://www.facebook.com/profile.php?id=61566216437107&mibextid=ZbWKwL' },
    { label: 'Instagram', href: 'https://www.instagram.com/arah_inn?igsh=MXJ1OGRnMzJuNDJibg==' },
    { label: 'TikTok',    href: 'https://www.tiktok.com/@arahinn.com?_r=1&_t=ZS-95yFxJBKchW' },
  ]

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <SEO
        title={en ? 'Contact Us — ArahInn' : 'Hubungi Kami — ArahInn'}
        description={en ? 'Get in touch with ArahInn customer support via WhatsApp, email, or phone.' : 'Hubungi layanan pelanggan ArahInn melalui WhatsApp, email, atau telepon.'}
        url="/hubungi-kami"
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-800 via-brand to-brand-700 text-white">
        <div className="container py-12 sm:py-16 text-center">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur mb-4">
            <Headphones className="w-7 h-7" />
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold">{en ? 'Contact Us' : 'Hubungi Kami'}</h1>
          <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl mx-auto">
            {en ? 'Questions, help with a booking, or partnership? Our team is ready to assist you.' : 'Ada pertanyaan, butuh bantuan pemesanan, atau kerja sama? Tim kami siap membantu Anda.'}
          </p>
        </div>
      </section>

      <section className="container py-10 sm:py-12 max-w-3xl">
        {/* Channel cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {channels.map(c => {
            const Icon = c.Icon
            return (
              <a key={c.label} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
                className="group relative rounded-3xl border border-slate-200 bg-white p-5 shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
                <span className={`w-12 h-12 rounded-2xl ${c.accent} text-white flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </span>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">{c.label}</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5 break-words">{c.value}</p>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{c.desc}</p>
              </a>
            )
          })}
        </div>

        {/* Info card */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-5">{en ? 'Company Information' : 'Informasi Perusahaan'}</h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0"><Building2 className="w-4.5 h-4.5" /></span>
              <div>
                <p className="font-semibold text-slate-900">PT. Redy Hospitality Management</p>
                <p className="text-slate-500 mt-0.5">{en ? 'Operator of ArahInn — Accommodation, Transportation & Activities.' : 'Penyelenggara ArahInn — Akomodasi, Transportasi & Aktivitas.'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0"><Clock className="w-4.5 h-4.5" /></span>
              <div>
                <p className="font-semibold text-slate-900">{en ? 'Operating Hours' : 'Jam Operasional'}</p>
                <p className="text-slate-500 mt-0.5">{en ? 'Every day, 08.00–22.00 WIB' : 'Setiap hari, 08.00–22.00 WIB'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0"><Mail className="w-4.5 h-4.5" /></span>
              <div>
                <p className="font-semibold text-slate-900">{en ? 'Official Email' : 'Email Resmi'}</p>
                <a href={`mailto:${CS_EMAIL}`} className="text-brand font-medium mt-0.5 inline-block hover:underline">{CS_EMAIL}</a>
              </div>
            </div>
          </div>

          {/* CTA WhatsApp */}
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors active:scale-[0.99]">
            <MessageCircle className="w-4.5 h-4.5" /> {en ? 'Chat on WhatsApp' : 'Chat via WhatsApp'} — {WA_DISPLAY}
          </a>

          {/* Socials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">{en ? 'Follow Us' : 'Ikuti Kami'}</p>
            <div className="flex flex-wrap gap-2">
              {socials.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-sm text-slate-600 hover:border-brand hover:text-brand transition-colors">
                  {s.label} <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
