#!/usr/bin/env bash
#
# Deploy otomatis frontend ArahInn.
#
# Dipanggil cron di server. Memeriksa apakah ada commit baru di origin/main;
# kalau ada, menarik, membangun, lalu menyalin ke ketiga document root.
# Kalau tidak ada perubahan, langsung keluar tanpa melakukan apa pun.
#
# Pemasangan (sekali saja), lewat `crontab -e` di server:
#   */5 * * * * /home/ckgiyjjt/ota-frontend/auto-deploy.sh
#
# Memantau jalannya:
#   tail -f ~/ota-frontend-autodeploy.log
#
set -euo pipefail

REPO="$HOME/ota-frontend"
LOG="$HOME/ota-frontend-autodeploy.log"
LOCK="$HOME/.ota-frontend-autodeploy.lock"

cd "$REPO"

# Kunci berbasis mkdir — bekerja di mana saja, tidak bergantung pada `flock`
# yang belum tentu ada di hosting bersama. Build memakan ~30 detik sedangkan
# cron berjalan tiap 5 menit; tanpa kunci, dua proses bisa bertabrakan saat
# build kebetulan lambat.
if ! mkdir "$LOCK" 2>/dev/null; then
  # Proses yang mati mendadak (build kehabisan memori, sesi terputus)
  # meninggalkan kunci yatim yang akan memblokir deploy SELAMANYA tanpa
  # pesan apa pun. Build terlama ~2 menit, jadi kunci berumur lebih dari
  # 30 menit pasti yatim dan boleh dibuang.
  if [ -d "$LOCK" ] && [ -z "$(find "$LOCK" -maxdepth 0 -mmin -30 2>/dev/null)" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') kunci yatim >30 menit dibuang" >> "$LOG"
    rmdir "$LOCK" 2>/dev/null || true
  fi
  # Sekali coba lagi; kalau tetap gagal berarti proses lain memang jalan.
  mkdir "$LOCK" 2>/dev/null || exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

git fetch --quiet origin main || exit 0

LOKAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"

# Tidak ada commit baru → keluar senyap. Ini jalur yang paling sering diambil,
# jadi sengaja tidak menulis apa pun ke log supaya log tetap terbaca.
[ "$LOKAL" = "$REMOTE" ] && exit 0

# ── Node yang dipakai cron belum tentu ada sama sekali ────────────────
# PATH yang diwarisi cron jauh lebih pendek daripada PATH terminal. Di
# cPanel/CloudLinux, Node tinggal di /opt/alt/alt-nodejsNN atau di dalam
# nodevenv milik aplikasi — dua-duanya di luar PATH cron. Pemeriksaan ini
# WAJIB sebelum merge: pernah terjadi commit tertarik lalu build gagal,
# sehingga kode sumber di server maju sementara situs tetap versi lama dan
# tidak ada tanda apa pun bahwa deploy tidak jadi.
cari_node() {
  if command -v node >/dev/null 2>&1; then dirname "$(command -v node)"; return 0; fi
  for d in "$HOME"/nodevenv/*/*/bin /opt/alt/alt-nodejs2*/root/usr/bin \
           /opt/alt/alt-nodejs1*/root/usr/bin /opt/cpanel/ea-nodejs*/bin \
           /usr/local/bin; do
    [ -x "$d/node" ] || continue
    "$d/node" -e 'process.exit(parseInt(process.versions.node) >= 18 ? 0 : 1)' 2>/dev/null \
      && { echo "$d"; return 0; }
  done
  return 1
}

NODE_DIR="${NODE_DIR:-$(cari_node || true)}"
if [ -z "$NODE_DIR" ]; then
  {
    echo
    echo "════ $(date '+%Y-%m-%d %H:%M:%S')"
    echo "BATAL: node tidak ada di PATH cron maupun di lokasi cPanel yang biasa."
    echo "       Cari di terminal:  command -v node"
    echo "       Lalu di crontab:   NODE_DIR=/path/ke/bin $0"
    echo "       Tidak ada yang ditarik — kode sumber tetap seperti semula."
  } >> "$LOG"
  exit 1
fi
export PATH="$NODE_DIR:$PATH"

{
  echo
  echo "════ $(date '+%Y-%m-%d %H:%M:%S')"
  echo "commit: ${LOKAL:0:7} → ${REMOTE:0:7}"
  git --no-pager log --oneline "${LOKAL}..${REMOTE}" | sed 's/^/  /'
  echo "node: $(node -v 2>/dev/null) ($NODE_DIR)"
  echo

  # --ff-only: menolak bila riwayat menyimpang, alih-alih membuat commit merge
  # otomatis di server. Kalau ini gagal, ada yang perlu diperiksa manusia.
  if ! git merge --ff-only origin/main; then
    echo "GAGAL: riwayat menyimpang dari origin/main — deploy dibatalkan."
    echo "Periksa manual di server; tidak ada berkas situs yang disentuh."
    exit 1
  fi

  # deploy-server.sh sudah memverifikasi hasil build sebelum menyentuh
  # document root, jadi build yang gagal tidak akan merusak situs live.
  ./deploy-server.sh --yes

  echo "selesai $(date '+%H:%M:%S')"
} >> "$LOG" 2>&1

# Jaga agar log tidak tumbuh tanpa batas.
if [ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 1000000 ]; then
  tail -c 300000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi
