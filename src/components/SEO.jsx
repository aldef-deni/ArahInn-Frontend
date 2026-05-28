import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'ArahInn'
const DEFAULT_TITLE = 'ArahInn — Booking Hotel, Villa & Properti Terpercaya'
const DEFAULT_DESCRIPTION = 'Pesan hotel, villa, dan properti pilihan di seluruh Indonesia dengan harga terbaik. Pembayaran aman, layanan 24 jam, dan ribuan akomodasi terkurasi.'
const DEFAULT_IMAGE = 'https://arahinn.com/logo-arahin.png'
const SITE_URL = 'https://arahinn.com'

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE
  const canonical = url ? (url.startsWith('http') ? url : `${SITE_URL}${url}`) : SITE_URL
  const ogImage = image?.startsWith('http') ? image : `${SITE_URL}${image || ''}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="id_ID" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={fullTitle} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
