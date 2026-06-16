export const slugify = (str) => {
  const s = String(str ?? '').toLowerCase().normalize('NFD')
  return s
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const categorySlug = (category) => slugify(category) || 'hotel'

/**
 * Build SEO-friendly hotel detail URL: /<category-slug>/<hotel-slug>
 * Falls back to /hotel/<id> if slug missing.
 */
export const hotelDetailUrl = (hotel, query) => {
  if (!hotel) return '/'
  const cat  = categorySlug(hotel.category || hotel.type)
  const slug = hotel.slug || slugify(hotel.name)
  const base = (cat && slug) ? `/${cat}/${slug}` : `/hotel/${hotel.id}`
  // Bawa tanggal/tamu hasil pencarian (kalau ada) agar detail terbuka sesuai tanggal custom
  if (query && typeof query === 'object') {
    const entries = Object.entries(query).filter(([, v]) => v != null && v !== '')
    if (entries.length) {
      const qs = new URLSearchParams(Object.fromEntries(entries)).toString()
      return `${base}?${qs}`
    }
  }
  return base
}
