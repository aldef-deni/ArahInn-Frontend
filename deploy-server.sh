#!/usr/bin/env bash
#
# Build & deploy frontend ArahInn langsung dari server cPanel.
#
# Dijalankan DI SERVER, dari folder sumber frontend (mis. ~/ota-frontend).
# Hasil build disalin ke TIGA document root: arahinn.com, kelola.arahinn.com,
# dan my.arahinn.com. Melewatkan salah satunya membuat domain itu tertinggal versi.
#
#   ./deploy-server.sh                 # build + deploy ke kedua folder
#   ./deploy-server.sh --build-only    # build saja, tidak menyentuh docroot
#   ./deploy-server.sh --yes           # lewati pertanyaan konfirmasi
#
set -euo pipefail

# ── Tata letak di server (dikonfirmasi 2026-09-23) ────────────────────
#   ~/ota-frontend       sumber FE (repo ArahInn-Frontend)  ← folder ini
#   ~/public_html        hasil build → arahinn.com        (customer)
#   ~/pengelola-arahinn  hasil build → kelola.arahinn.com (superadmin)
#   ~/extranet-owner     hasil build → my.arahinn.com     (owner properti)
#
# SATU hasil build melayani KETIGANYA. Aplikasinya membedakan diri saat
# berjalan lewat hostname (src/utils/isExtranet.js), bukan lewat build
# terpisah. Melewatkan salah satu folder membuat domain itu tertinggal versi.
DOCROOT_PUBLIC="${DOCROOT_PUBLIC:-$HOME/public_html}"
DOCROOT_KELOLA="${DOCROOT_KELOLA:-$HOME/pengelola-arahinn}"
DOCROOT_OWNER="${DOCROOT_OWNER:-$HOME/extranet-owner}"

DOCROOTS=("$DOCROOT_PUBLIC" "$DOCROOT_KELOLA" "$DOCROOT_OWNER")

BUILD_ONLY=false
ASSUME_YES=false
for arg in "$@"; do
  case "$arg" in
    --build-only) BUILD_ONLY=true ;;
    --yes|-y)     ASSUME_YES=true ;;
    *) echo "Opsi tidak dikenal: $arg"; exit 1 ;;
  esac
done

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
fail() { printf '\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

# ── 1. Periksa lingkungan ─────────────────────────────────────────────
say "1) Memeriksa lingkungan"
command -v node >/dev/null || fail "node tidak ditemukan. Aktifkan Node di cPanel (Setup Node.js App)."
command -v npm  >/dev/null || fail "npm tidak ditemukan."

NODE_MAJOR="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
[ "$NODE_MAJOR" -ge 18 ] || fail "Butuh Node 18+, terpasang $(node -v)."
echo "   node $(node -v), npm $(npm -v)"

[ -f package.json ] || fail "package.json tidak ada. Jalankan dari folder sumber frontend."

# ── 2. Dependensi ─────────────────────────────────────────────────────
say "2) Menyiapkan dependensi"
if [ -d node_modules ] && [ package-lock.json -ot node_modules ]; then
  echo "   node_modules sudah mutakhir, dilewati."
else
  # npm ci memakai package-lock apa adanya — hasilnya sama persis dengan lokal.
  npm ci --no-audit --no-fund
fi

# ── 3. Build ──────────────────────────────────────────────────────────
say "3) Build"
# Hosting bersama sering membatasi memori; beri ruang lebih untuk Vite.
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}" npx vite build

# Build yang gagal separuh jalan TIDAK boleh sampai menyentuh situs live.
[ -s dist/index.html ] || fail "dist/index.html kosong atau tidak ada — build gagal."
FILES="$(find dist -type f | wc -l)"
[ "$FILES" -ge 20 ] || fail "dist hanya berisi $FILES berkas — mencurigakan, dibatalkan."
echo "   $FILES berkas, $(du -sh dist | cut -f1)"

if [ "$BUILD_ONLY" = true ]; then
  say "Selesai (--build-only). Tidak ada berkas situs yang diubah."
  exit 0
fi

# ── 4. Konfirmasi ─────────────────────────────────────────────────────
say "4) Tujuan penyalinan"
for d in "${DOCROOTS[@]}"; do
  [ -d "$d" ] || fail "Folder tidak ada: $d  (sesuaikan DOCROOT_PUBLIC / DOCROOT_KELOLA / DOCROOT_OWNER)"
  echo "   $d"
done

if [ "$ASSUME_YES" != true ]; then
  read -r -p "   Lanjutkan menimpa situs live? [y/N] " jawab
  [ "$jawab" = "y" ] || [ "$jawab" = "Y" ] || { echo "Dibatalkan."; exit 0; }
fi

# ── 5. Salin ──────────────────────────────────────────────────────────
say "5) Menyalin"
STAMP="$(date +%Y%m%d-%H%M%S)"

for d in "${DOCROOTS[@]}"; do
  # Simpan index.html lama — inilah satu-satunya berkas yang, bila salah,
  # langsung membuat situs blank.
  [ -f "$d/index.html" ] && cp "$d/index.html" "$d/index.html.bak-$STAMP"

  # SENGAJA TANPA --delete. Document root berisi berkas milik pihak lain
  # (.htaccess kustom, unggahan, folder backend); menghapusnya bisa
  # mematikan situs. Aset lama bernama hash — menumpuk sedikit, tidak apa-apa.
  rsync -a dist/ "$d/"

  echo "   selesai: $d  (cadangan: index.html.bak-$STAMP)"
done

say "Selesai."
echo "Buka arahinn.com, kelola.arahinn.com, dan my.arahinn.com,"
echo "lalu hard refresh (Ctrl+Shift+R) — index.html sering ter-cache browser."
echo
echo "Bila ada yang rusak, kembalikan index.html:"
echo "  cp \"$DOCROOT_PUBLIC/index.html.bak-$STAMP\" \"$DOCROOT_PUBLIC/index.html\""
