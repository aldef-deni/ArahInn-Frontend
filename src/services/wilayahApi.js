const BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api'

const toTitle = (str) =>
  str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

const fetchJson = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error('Gagal memuat data wilayah'); return r.json() })

export const wilayahApi = {
  provinces : ()       => fetchJson(`${BASE}/provinces.json`).then(list => list.map(p => ({ id: p.id, name: toTitle(p.name) }))),
  regencies : (provId) => fetchJson(`${BASE}/regencies/${provId}.json`).then(list => list.map(p => ({ id: p.id, name: toTitle(p.name) }))),
  districts : (regId)  => fetchJson(`${BASE}/districts/${regId}.json`).then(list => list.map(p => ({ id: p.id, name: toTitle(p.name) }))),
  villages  : (distId) => fetchJson(`${BASE}/villages/${distId}.json`).then(list => list.map(p => ({ id: p.id, name: toTitle(p.name) }))),
}
