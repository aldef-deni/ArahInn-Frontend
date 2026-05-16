import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, MessageCircle, ChevronDown, Film, Loader2, ImageIcon, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { interiorDesignApi, interiorApi } from '@/services/index'
import { getImageUrl } from '@/utils'

const WA_DEFAULT = '628128968609'
const PROYEK_OPTIONS = ['Rumah', 'Apartemen', 'Ruko', 'Kantor', 'Gedung', 'Lainnya']

export default function InteriorPenawaran({ noCard = false }) {
  const [detailDesign, setDetailDesign]   = useState(null)
  const [slideIndex, setSlideIndex]       = useState(0)
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState({ nama: '', noHp: '', proyek: '', proyekLainnya: '' })
  const [errors, setErrors]             = useState({})
  const [submitting, setSubmitting]     = useState(false)
  const [videoDesign, setVideoDesign]   = useState(null)

  const { data: designs = [], isLoading } = useQuery({
    queryKey: ['interior-designs-public'],
    queryFn : () => interiorDesignApi.publicList().then(r => r.data.data),
  })

  const openForm = (design) => {
    setSelectedDesign(design)
    setShowForm(true)
    setForm({ nama: '', noHp: '', proyek: '', proyekLainnya: '' })
    setErrors({})
  }

  const closeForm = () => { setShowForm(false); setSelectedDesign(null) }

  const validate = () => {
    const e = {}
    if (!form.nama.trim())  e.nama  = 'Nama wajib diisi'
    if (!form.noHp.trim())  e.noHp  = 'No HP wajib diisi'
    if (!form.proyek)       e.proyek = 'Pilih jenis proyek'
    if (form.proyek === 'Lainnya' && !form.proyekLainnya.trim()) e.proyekLainnya = 'Isi jenis proyek Anda'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    const proyek = form.proyek === 'Lainnya' ? form.proyekLainnya : form.proyek
    setSubmitting(true)
    try {
      await interiorApi.submit({ nama: form.nama, noHp: form.noHp, proyek, desainReferensi: selectedDesign?.title || null })
    } catch { /* tetap buka WA */ } finally { setSubmitting(false) }
    const waTarget = selectedDesign?.waNumber || selectedDesign?.wa_number || WA_DEFAULT
    const msg = `Halo Arahinn,\n\nSaya tertarik dengan layanan *Furnish & Design Interior*.\n\n*Nama:* ${form.nama}\n*No HP:* ${form.noHp}\n*Jenis Proyek:* ${proyek}\n*Referensi Desain:* ${selectedDesign?.title || '-'}\n\nMohon informasi lebih lanjut. Terima kasih.`
    window.open(`https://wa.me/${waTarget}?text=${encodeURIComponent(msg)}`, '_blank')
    closeForm()
  }

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      {/* ── Grid Kartu (style sama dengan property cards) ── */}
      <div className={noCard ? '' : 'bg-white border rounded-2xl shadow-card overflow-hidden'}>
        {!noCard && (
          <div className="px-5 py-4 border-b bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900">Furnish & Design Interior</h2>
              <p className="text-xs text-slate-500 mt-0.5">Wujudkan ruang impian Anda bersama tim desainer profesional kami</p>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full whitespace-nowrap">Premium</span>
          </div>
        )}

        <div className={noCard ? '' : 'p-5'}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            </div>
          ) : designs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">Belum ada contoh desain.</div>
          ) : (() => {
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {designs.map(d => (
                <div key={d.id} onClick={() => { setDetailDesign(d); setSlideIndex(0) }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {(d.images || []).length > 0 ? (
                      <img src={getImageUrl(d.images[0])} alt={d.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                    ) : null}
                    <div className={`w-full h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 ${(d.images||[]).length > 0 ? 'hidden' : 'flex'}`}>
                      <Building2 className="w-10 h-10 text-slate-300" />
                    </div>
                    {(d.images || []).length > 1 && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs font-semibold rounded-full">
                        +{d.images.length - 1} foto
                      </span>
                    )}
                    {(d.videos || []).length > 0 && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-blue-600/90 text-white text-[10px] font-bold rounded-full">
                        <Film className="w-3 h-3" /> Video
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{d.title}</h3>
                  </div>
                </div>
              ))}
            </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* ── Modal Detail ── */}
      {detailDesign && (() => {
        const imgs   = detailDesign.images || []
        const total  = imgs.length
        const prev   = (e) => { e.stopPropagation(); setSlideIndex(i => (i - 1 + total) % total) }
        const next   = (e) => { e.stopPropagation(); setSlideIndex(i => (i + 1) % total) }
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDetailDesign(null)} />
            <div className="relative z-10 bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

              {/* Header */}
              <div className="px-6 py-4 border-b flex items-start justify-between bg-gradient-to-r from-orange-50 to-amber-50 shrink-0">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-bold text-slate-900 text-lg leading-snug">{detailDesign.title}</h3>
                  {detailDesign.style && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                      {detailDesign.style}
                    </span>
                  )}
                </div>
                <button onClick={() => setDetailDesign(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/80 transition-colors shrink-0">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Slider / Foto */}
              <div className="flex-1 overflow-y-auto">
                {total === 0 ? (
                  <div className="h-72 flex items-center justify-center bg-slate-100">
                    <ImageIcon className="w-14 h-14 text-slate-300" />
                  </div>
                ) : total === 1 ? (
                  <img src={getImageUrl(imgs[0])} alt={detailDesign.title}
                    className="w-full max-h-[60vh] object-cover"
                    onError={e => { e.target.src = 'https://placehold.co/800x500/f1f5f9/94a3b8?text=Interior' }} />
                ) : (
                  <div className="relative select-none">
                    {/* Gambar aktif */}
                    <div className="relative overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                      <img
                        key={slideIndex}
                        src={getImageUrl(imgs[slideIndex])}
                        alt={`${detailDesign.title} ${slideIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = 'https://placehold.co/800x450/f1f5f9/94a3b8?text=Interior' }}
                      />
                      {/* Overlay gelap di kiri-kanan untuk kontras tombol */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />

                      {/* Tombol Prev */}
                      <button onClick={prev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors shadow-lg">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      {/* Tombol Next */}
                      <button onClick={next}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors shadow-lg">
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      {/* Counter */}
                      <span className="absolute top-3 right-3 px-3 py-1 bg-black/60 text-white text-xs font-semibold rounded-full">
                        {slideIndex + 1} / {total}
                      </span>
                    </div>

                    {/* Dot indicators */}
                    <div className="flex items-center justify-center gap-1.5 py-3">
                      {imgs.map((_, i) => (
                        <button key={i} onClick={() => setSlideIndex(i)}
                          className={`rounded-full transition-all ${i === slideIndex ? 'w-5 h-2 bg-orange-500' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'}`} />
                      ))}
                    </div>

                    {/* Thumbnail strip */}
                    {total > 1 && (
                      <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
                        {imgs.map((img, i) => (
                          <button key={i} onClick={() => setSlideIndex(i)}
                            className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === slideIndex ? 'border-orange-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                            <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover"
                              onError={e => { e.target.src = 'https://placehold.co/64x48/f1f5f9/94a3b8?text=IMG' }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tombol Video */}
                {(detailDesign.videos || []).length > 0 && (
                  <div className="px-5 pb-4">
                    <button onClick={() => setVideoDesign(detailDesign)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 text-sm font-semibold rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors">
                      <Film className="w-4 h-4" />
                      Lihat Video ({detailDesign.videos.length})
                    </button>
                  </div>
                )}

                {/* Deskripsi */}
                {detailDesign.description && (
                  <div className="px-5 pb-5">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Deskripsi</h4>
                    <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                      {detailDesign.description.split('\n').filter(Boolean).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="px-6 py-4 border-t bg-slate-50 shrink-0">
                <button onClick={() => { openForm(detailDesign); setDetailDesign(null) }}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-base">
                  <MessageCircle className="w-5 h-5" />
                  Minta Penawaran
                </button>
                <p className="text-center text-xs text-slate-400 mt-2">Anda akan diarahkan ke WhatsApp</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Modal Video ── */}
      {videoDesign && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setVideoDesign(null)} />
          <div className="relative z-10 bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 truncate flex-1 mr-3">{videoDesign.title}</h3>
              <button onClick={() => setVideoDesign(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y max-h-[70vh] overflow-y-auto">
              {(videoDesign.videos || []).map((vid, i) => (
                <div key={i} className="p-4 bg-black">
                  <p className="text-xs text-slate-400 mb-2">Video {i + 1}</p>
                  <video src={getImageUrl(vid)} controls className="w-full rounded-lg max-h-72" />
                  <a href={getImageUrl(vid)} download className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 underline">
                    Unduh video {i + 1}
                  </a>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t text-xs text-slate-400 text-center">
              Format .mpg dan .avi mungkin memerlukan codec tambahan di browser.
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Form Penawaran ── */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative z-10 bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <h3 className="font-bold text-slate-900">Minta Penawaran</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{selectedDesign?.title}</p>
              </div>
              <button onClick={closeForm} className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Nama lengkap Anda" value={form.nama} onChange={e => upd('nama', e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.nama ? 'border-red-400' : 'border-slate-200'}`} />
                {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">No Handphone <span className="text-red-500">*</span></label>
                <input type="tel" placeholder="08xxxxxxxxxx" value={form.noHp} onChange={e => upd('noHp', e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.noHp ? 'border-red-400' : 'border-slate-200'}`} />
                {errors.noHp && <p className="text-xs text-red-500 mt-1">{errors.noHp}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jenis Proyek <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={form.proyek} onChange={e => upd('proyek', e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.proyek ? 'border-red-400' : 'border-slate-200'}`}>
                    <option value="">-- Pilih jenis proyek --</option>
                    {PROYEK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.proyek && <p className="text-xs text-red-500 mt-1">{errors.proyek}</p>}
              </div>
              {form.proyek === 'Lainnya' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jenis Proyek Lainnya <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Jelaskan jenis proyek Anda" value={form.proyekLainnya} onChange={e => upd('proyekLainnya', e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.proyekLainnya ? 'border-red-400' : 'border-slate-200'}`} />
                  {errors.proyekLainnya && <p className="text-xs text-red-500 mt-1">{errors.proyekLainnya}</p>}
                </div>
              )}
            </div>
            <div className="px-5 pb-5 pt-1">
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                <MessageCircle className="w-5 h-5" />
                {submitting ? 'Menyimpan...' : 'Kirim via WhatsApp'}
              </button>
              <p className="text-center text-xs text-slate-400 mt-2.5">Anda akan diarahkan ke WhatsApp</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
