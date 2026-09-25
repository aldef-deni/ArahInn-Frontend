// Kanal streaming RRI. ArahInn menyiarkan ulang atas izin langsung dari RRI.
//
// ⚠️ URL di bawah SUDAH DIUJI satu per satu (26 Sep 2026): servernya membalas
// HTTP 200 dengan `icy-name` yang cocok. Jangan menambah kanal dari tebakan
// pola — porta 9025 dipakai bersama oleh ketiganya, tetapi nama berkas yang
// mirip belum tentu ada (rrijakartapro3.mp3 membalas 404).
//
// ⚠️ Meski berakhiran .mp3, isinya AAC+ (`audio/aacp`) 128 kbps. Nama berkas
// tidak menentukan format.
//
// Pro 3 (jaringan berita nasional) BELUM disertakan: URL-nya tidak ditemukan
// pada node Jakarta. Tambahkan satu baris di sini begitu RRI memberikannya.

const NODE = 'https://stream-node1.rri.co.id/streaming/25/9025'

export const RADIO_CHANNELS = [
  {
    id      : 'pro1',
    name    : 'RRI Pro 1',
    taglineKey: 'radio.pro1Tagline',
    freq    : '91.2 FM',
    url     : `${NODE}/rrijakartapro1.mp3`,
    // Gradien per kanal dipakai sebagai "sampul" — RRI tidak menyediakan
    // artwork lewat stream, dan memakai logo yang sama untuk semuanya membuat
    // kanal sulit dibedakan sekilas.
    gradient: 'from-blue-600 via-blue-700 to-indigo-900',
    accent  : '#2563eb',
  },
  {
    id      : 'pro2',
    name    : 'RRI Pro 2',
    taglineKey: 'radio.pro2Tagline',
    freq    : '105.0 FM',
    url     : `${NODE}/rrijakartapro2.mp3`,
    gradient: 'from-rose-500 via-pink-600 to-fuchsia-800',
    accent  : '#e11d48',
  },
  {
    id      : 'pro4',
    name    : 'RRI Pro 4',
    taglineKey: 'radio.pro4Tagline',
    freq    : '92.8 FM',
    url     : `${NODE}/rrijakartapro4.mp3`,
    gradient: 'from-amber-500 via-orange-600 to-rose-700',
    accent  : '#ea580c',
  },
]

export const findChannel = (id) => RADIO_CHANNELS.find(c => c.id === id) ?? null
