# OTA Frontend — ReactJS + Vite + Tailwind CSS

Frontend sistem OTA (Online Travel Agent) dibangun dengan React 18, Vite, Tailwind CSS, dan shadcn/ui.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit VITE_API_URL sesuai URL backend Anda

# 3. Jalankan development server
npm run dev
```

Buka di browser: `http://localhost:5173`

---

## 📁 Struktur Halaman

### 👤 User
| Path | Halaman |
|---|---|
| `/` | Landing page + Search bar |
| `/search` | Hasil pencarian hotel |
| `/hotel/:id` | Detail hotel + pilih kamar |
| `/checkout/:roomId` | Form pemesanan |
| `/payment/:bookingId` | Halaman pembayaran |
| `/orders` | Riwayat pesanan |
| `/profile` | Profil & poin loyalitas |

### 🔐 Auth
| Path | Halaman |
|---|---|
| `/login` | Halaman login |
| `/register` | Halaman daftar |

### 🛠️ Admin
| Path | Halaman |
|---|---|
| `/admin` | Dashboard overview |
| `/admin/hotels` | Manajemen hotel |
| `/admin/orders` | Manajemen pesanan |
| `/admin/reports` | Laporan keuangan |
| `/admin/users` | Manajemen pengguna |
| `/admin/promos` | Manajemen promo |

---

## 🧰 Tech Stack

| Teknologi | Kegunaan |
|---|---|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first CSS |
| shadcn/ui (Radix UI) | Komponen UI |
| TanStack Query | Server state management |
| Zustand | Client state (auth) |
| React Router v6 | Routing |
| React Hook Form | Form management |
| Axios | HTTP client |
| Socket.IO Client | LiveChat realtime |
| Recharts | Grafik & chart |
| i18next | Multi-bahasa (ID/EN) |
| date-fns | Utilitas tanggal |

---

## 🌐 Dual Language

Website mendukung Bahasa Indonesia dan English.
- Ganti bahasa melalui tombol **ID / EN** di navbar.
- File terjemahan: `src/locales/id/translation.json` dan `src/locales/en/translation.json`

---

## 💬 LiveChat

Chat widget 24/7 tersedia di pojok kanan bawah untuk pengguna yang sudah login.
Terhubung langsung ke backend via Socket.IO.

---

## 🔑 Akun Demo

Gunakan akun berikut (setelah seed backend):

| Role | Email | Password |
|---|---|---|
| SuperAdmin | superadmin@otasystem.id | Password123! |
| Admin | admin@otasystem.id | Password123! |
| User | user@otasystem.id | Password123! |

---

## ⚙️ Build Produksi

```bash
npm run build
# Output di folder dist/
```
