import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)

export const formatDate = (date, opts = {}) =>
  new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long', day: 'numeric', ...opts }).format(new Date(date))

export const formatDateShort = (date) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))

export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))

export const diffDays = (a, b) => {
  const d1 = new Date(a); const d2 = new Date(b)
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}

export const statusBadgeClass = (status) => ({
  paid      : 'badge-paid',
  pending   : 'badge-pending',
  issued    : 'badge-issued',
  canceled  : 'badge-canceled',
  refunded  : 'badge-refunded',
  rescheduled: 'badge-issued',
}[status] || 'badge-pending')

export const statusLabel = (status) => ({
  paid      : 'Dibayar',
  pending   : 'Menunggu',
  issued    : 'Dikonfirmasi',
  canceled  : 'Dibatalkan',
  refunded  : 'Dikembalikan',
  rescheduled: 'Dijadwalkan Ulang',
}[status] || status)

export const roleLabel = (role) => ({
  superadmin    : 'Super Admin',
  owner         : 'Pemilik Hotel',
  admin_property: 'Admin Properti',
  admin         : 'Admin',
  finance       : 'Keuangan',
  user          : 'Pengguna',
}[role] || role)

export const generateBookingCode = () =>
  'OTA' + Math.random().toString(36).slice(2, 9).toUpperCase()

export const truncate = (str, n = 80) =>
  str?.length > n ? str.slice(0, n) + '...' : str
