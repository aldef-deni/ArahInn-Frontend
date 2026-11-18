# Catatan untuk Claude — ArahInn Frontend

Berlaku untuk sesi mana pun di repo ini, termasuk yang berjalan **di server
cPanel** lewat `claude` di `~/ota-frontend`.

## Aturan commit (wajib)

- Author: `Deni Afrizal <deniafrizal2904@gmail.com>`.
- **DILARANG** menambahkan `Co-Authored-By:` atau baris
  "🤖 Generated with …" pada pesan commit. Ini aturan pemilik repo dan
  mengalahkan bawaan Claude Code. Pernah terlanggar pada commit `7330419`
  (FE) dan `ac7dd2f` (BE) — jangan diulang.
- Git di server belum tentu punya identitas. Setel per-commit, jangan global:

  ```bash
  git -c user.name="Deni Afrizal" -c user.email="deniafrizal2904@gmail.com" \
      commit --author="Deni Afrizal <deniafrizal2904@gmail.com>" -m "…"
  ```

## Deploy: cukup push, jangan zip

Satu hasil build melayani **tiga domain**; aplikasinya membedakan diri saat
berjalan lewat hostname (`src/utils/isExtranet.js`), bukan lewat build terpisah.

| Document root | Domain |
|---|---|
| `~/public_html` | arahinn.com |
| `~/pengelola-arahinn` | kelola.arahinn.com |
| `~/extranet-owner` | my.arahinn.com |
| `~/staging` | staging.arahinn.com — **opsional**, dilewati bila folder belum ada |

Cron di server menjalankan `auto-deploy.sh` tiap 5 menit: menarik `origin/main`,
build, lalu menyalin ke ketiganya. **Tidak perlu mengirim zip ke user.**

### Fitur yang masih diuji

Dipagari lewat **hostname**, bukan build terpisah: `isStaging()` di
`src/utils/isExtranet.js` (staging.arahinn.com + localhost). Menu DAN rutenya
sama-sama dipagari — menyembunyikan tautan saja tidak menghentikan siapa pun
mengetik path-nya langsung di bilah alamat produksi.

Saat ini dipagari: **Streaming radio RRI** (`/streaming`).

⚠️ Pemagaran staging **hanya untuk halaman PELANGGAN**. Halaman `/admin/*`
tinggal di `~/pengelola-arahinn` (kelola.arahinn.com) dan `AdminRoute` melempar
keluar akses `/admin` dari host lain. Memagari halaman admin ke staging berarti
halaman itu tidak bisa dibuka di mana pun — pernah terjadi dengan halaman
Digiflazz, dan "perbaikannya" saat itu membuka jalan masuk baru ke dasbor
pengelola lewat domain staging. Jangan diulang.

⚠️ Staging dan produksi memakai **backend dan database yang SAMA**
(`ota-backend.arahinn.com`). Yang terpisah hanya berkas frontend. Untuk fitur
yang menulis data, staging tidak mengisolasi apa pun.

Deploy manual (mis. setelah `git pull` manual, yang membuat cron menganggap
tidak ada yang baru): `./deploy-server.sh --yes`

`auto-deploy.sh` mencatat commit yang benar-benar berhasil tersalin di
`~/.ota-frontend-terpasang`. Kalau build gagal, ia mencoba lagi pada jalannya
cron berikutnya sampai 5 kali, lalu berhenti dengan pesan di
`~/ota-frontend-autodeploy.log`.

## Jebakan yang pernah memakan waktu

- **PATH cron tidak memuat `node`.** Ada di `/opt/alt/alt-nodejsNN/root/usr/bin`.
  `auto-deploy.sh` mencarinya sendiri; bisa ditimpa lewat `NODE_DIR`.
- **`rsync` tidak ada** di hosting ini — `deploy-server.sh` memakai `cp -a`.
- **Nama berkas peka huruf besar-kecil.** Windows memaafkan, Linux tidak;
  `AKR.png` vs `akr.png` pernah menyebabkan 404 hanya di produksi.
- **`keepPreviousData: true` sudah dihapus di react-query v5** dan diabaikan
  diam-diam. Bentuk v5-nya `placeholderData: keepPreviousData`.
- **Setiap sub-komponen yang memakai `t()` wajib memanggil `useTranslation()`
  sendiri.** Meminjam `t` dari induk lolos di dev lalu memunculkan layar putih
  di produksi.
- **Halaman `/admin/*` tidak diterjemahkan** (0 dari 23 memakai i18n). Itu
  konvensi yang disengaja — jangan "memperbaikinya" tanpa diminta.
- **Jangan menguji skrip dengan `git reset --hard HEAD~1` lalu menjalankannya**:
  reset itu ikut mengembalikan skripnya sendiri ke versi lama.

## Allotment di dasbor pemilik

- Angka yang ditampilkan ke pemilik = **sisa** (`remaining_units`), bukan
  kuota (`available_units`). Kuota tidak pernah turun saat ada booking, dan
  menampilkannya terbaca persis seperti keluhan "allotment tidak berkurang".
- Kotak edit di Kalender menyimpan `terpesan + softblock + sisa`. Softblock
  dulu terlupa, sehingga sisa yang tersimpan selalu kurang dari yang diketik.
- Grid Softblock punya baris "Sisa Allotment"; dulu hanya "Kamar Dipesan".
- Hitungannya ada di backend (`App\Support\KetersediaanKamar`). Jangan
  menghitung ulang di frontend.

## Sebelum menyatakan selesai

Build lokal (`npx vite build`) **tidak** menangkap ikon lucide yang dipakai tapi
belum diimpor — itu muncul sebagai layar putih di produksi. Periksa manual
komponen yang dipakai versus yang diimpor pada berkas yang Anda ubah.
