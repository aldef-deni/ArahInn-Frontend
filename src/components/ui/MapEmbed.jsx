import { useState, useEffect, useRef } from 'react'
import { MapPin, ExternalLink, Loader2, AlertCircle, Navigation } from 'lucide-react'

async function nominatimGeocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=id`
  const res  = await fetch(url, { headers: { 'Accept-Language': 'id' } })
  if (!res.ok) throw new Error('geocode failed')
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

/**
 * MapEmbed — shows an OpenStreetMap iframe for a given address.
 *
 * Props:
 *  query   string  — full address string to geocode (e.g. "Jl. Merdeka, Kota Medan, Sumatera Utara, Indonesia")
 *  lat     number  — pre-known latitude  (skips geocoding)
 *  lng     number  — pre-known longitude (skips geocoding)
 *  height  number  — iframe height in px (default 280)
 *  onCoords fn     — callback(lat, lng) when geocoding succeeds
 */
export default function MapEmbed({ query, lat: initLat, lng: initLng, height = 280, onCoords }) {
  const [coords,  setCoords]  = useState(initLat && initLng ? { lat: initLat, lng: initLng } : null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(false)
  const timerRef = useRef(null)
  const lastQuery = useRef('')

  // When pre-known coords change, use them directly
  useEffect(() => {
    if (initLat && initLng) setCoords({ lat: initLat, lng: initLng })
  }, [initLat, initLng])

  // Geocode when query changes (debounced 1.5 s)
  useEffect(() => {
    if (initLat && initLng) return   // skip if coords already known
    if (!query || query === lastQuery.current) return

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      lastQuery.current = query
      setLoading(true)
      setError(false)
      try {
        const result = await nominatimGeocode(query)
        if (result) {
          setCoords(result)
          onCoords?.(result.lat, result.lng)
        } else {
          setCoords(null)
          setError(true)
        }
      } catch {
        setCoords(null)
        setError(true)
      } finally {
        setLoading(false)
      }
    }, 1500)

    return () => clearTimeout(timerRef.current)
  }, [query, initLat, initLng])

  const delta       = 0.008
  const mapSrc      = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - delta},${coords.lat - delta},${coords.lng + delta},${coords.lat + delta}&layer=mapnik&marker=${coords.lat},${coords.lng}`
    : null

  const gmapsUrl    = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || '')}`
  const osmUrl      = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(query || '')}`

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">

      {/* toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <MapPin className="w-4 h-4 text-brand" />
          Lokasi di Peta
        </div>
        <div className="flex items-center gap-3">
          <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <Navigation className="w-3 h-3" /> Google Maps
          </a>
          {coords && (
            <>
              <span className="text-slate-300">|</span>
              <a href={osmUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                OpenStreetMap <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* map area */}
      <div style={{ height }} className="relative bg-slate-100">

        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-100">
            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-brand animate-spin" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Mencari lokasi...</p>
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">Lokasi tidak ditemukan di peta.</p>
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              Cari manual di Google Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {!loading && !error && !coords && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <MapPin className="w-10 h-10 text-slate-200" />
            <p className="text-sm text-slate-400">Isi alamat lengkap untuk melihat lokasi di peta</p>
          </div>
        )}

        {!loading && mapSrc && (
          <iframe
            key={mapSrc}
            src={mapSrc}
            width="100%"
            height={height}
            className="block border-0"
            title="Lokasi Hotel"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  )
}
