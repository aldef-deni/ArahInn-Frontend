/**
 * Auto-generate file terjemahan i18n via Google Cloud Translation API (v2).
 *
 * Sumber : src/locales/id/translation.json  (bahasa Indonesia = canonical)
 * Tujuan : src/locales/<lang>/translation.json
 *
 * Hemat & aman:
 *  - Hanya translate KEY yang belum ada di file tujuan (skip yg sudah ada →
 *    irit biaya + menjaga edit manual Anda).
 *  - Placeholder {{var}} & tag HTML <b>..</b> TIDAK ikut diterjemahkan
 *    (dibungkus <span translate="no"> saat dikirim, lalu dilepas lagi).
 *
 * Cara pakai:
 *   1. Aktifkan "Cloud Translation API" di Google Cloud, buat API key.
 *   2. set env:  $env:GOOGLE_TRANSLATE_API_KEY="xxxx"   (PowerShell)
 *   3. node scripts/auto-translate.mjs en ms ja ko zh ar
 *      (argumen = daftar kode bahasa tujuan; default: en)
 *   4. Daftarkan bahasa baru di src/i18n.js (resources + supportedLngs) &
 *      language switcher.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCALES   = path.resolve(__dirname, '../src/locales')
const SRC_LANG  = 'id'
const API_KEY   = process.env.GOOGLE_TRANSLATE_API_KEY
const ENDPOINT  = 'https://translation.googleapis.com/language/translate/v2'

const targets = process.argv.slice(2).filter(Boolean)
if (!targets.length) targets.push('en')
if (!API_KEY) {
  console.error('❌  Set dulu env GOOGLE_TRANSLATE_API_KEY')
  process.exit(1)
}

const readJson  = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const writeJson = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n', 'utf8')

const source = readJson(path.join(LOCALES, SRC_LANG, 'translation.json'))

// Lindungi {{placeholder}} agar tidak diterjemahkan
const PH = /\{\{[^}]+\}\}/g
const protect   = (s) => s.replace(PH, (m) => `<span translate="no">${m}</span>`)
const unprotect = (s) => s.replace(/<span[^>]*translate=["']?no["']?[^>]*>(.*?)<\/span>/gi, '$1')

// Kumpulkan semua string yang perlu diterjemahkan (yang belum ada di target)
function collect(srcNode, tgtNode, prefixPath, bucket) {
  for (const [k, v] of Object.entries(srcNode)) {
    const here = tgtNode?.[k]
    if (typeof v === 'string') {
      if (typeof here !== 'string') bucket.push({ path: [...prefixPath, k], text: v })
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      collect(v, (here && typeof here === 'object') ? here : {}, [...prefixPath, k], bucket)
    }
  }
}

function setDeep(obj, keys, value) {
  let node = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof node[keys[i]] !== 'object' || node[keys[i]] === null) node[keys[i]] = {}
    node = node[keys[i]]
  }
  node[keys[keys.length - 1]] = value
}

// Mulai target dari struktur sumber + isi target lama (deep merge), supaya
// struktur lengkap & edit manual dipertahankan.
function deepMerge(base, over) {
  const out = Array.isArray(base) ? [...base] : { ...base }
  for (const [k, v] of Object.entries(over || {})) {
    out[k] = (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object')
      ? deepMerge(out[k], v) : v
  }
  return out
}

async function translateBatch(texts, target) {
  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ q: texts.map(protect), source: SRC_LANG, target, format: 'html' }),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return json.data.translations.map(t => unprotect(t.translatedText))
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

for (const lang of targets) {
  const outDir  = path.join(LOCALES, lang)
  const outFile = path.join(outDir, 'translation.json')
  const existing = fs.existsSync(outFile) ? readJson(outFile) : {}

  const bucket = []
  collect(source, existing, [], bucket)

  // Hasil = struktur sumber lengkap + isi lama
  const result = deepMerge(source, existing)

  if (bucket.length === 0) {
    console.log(`✅  ${lang}: sudah lengkap, tidak ada yang baru.`)
    continue
  }
  console.log(`🌐  ${lang}: menerjemahkan ${bucket.length} string baru…`)

  for (const part of chunk(bucket, 100)) {
    const translated = await translateBatch(part.map(b => b.text), lang)
    part.forEach((b, i) => setDeep(result, b.path, translated[i]))
  }

  fs.mkdirSync(outDir, { recursive: true })
  writeJson(outFile, result)
  console.log(`💾  ${lang}: ditulis ke ${path.relative(process.cwd(), outFile)}`)
}

console.log('Selesai. Jangan lupa daftarkan bahasa baru di src/i18n.js.')
