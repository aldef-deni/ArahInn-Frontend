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
export const hotelDetailUrl = (hotel) => {
  if (!hotel) return '/'
  const cat  = categorySlug(hotel.category || hotel.type)
  const slug = hotel.slug || slugify(hotel.name)
  if (cat && slug) return `/${cat}/${slug}`
  return `/hotel/${hotel.id}`
}
