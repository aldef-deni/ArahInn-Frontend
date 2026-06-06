import api from './api'

export const bookingApi = {
  calcPrice    : (d)      => api.post('/bookings/calculate-price', d),
  create       : (d)      => api.post('/bookings', d),
  myOrders     : (p)      => api.get('/bookings/my-orders', { params: p }),
  getById      : (id)     => api.get(`/bookings/${id}`),
  cancel       : (id)     => api.put(`/bookings/${id}/cancel`),
  reschedule   : (id, d)  => api.put(`/bookings/${id}/reschedule`, d),
  refund       : (id)     => api.post(`/bookings/${id}/refund`),
  // Download voucher PDF (binary)
  downloadVoucher: (id)   => api.get(`/bookings/${id}/voucher`, { responseType: 'blob' }),
  getAll       : (p)      => api.get('/bookings', { params: p }),
  updateStatus : (id, d)  => api.put(`/orders/${id}/status`, d),
}

// Public maintenance status — buat App.jsx check runtime
export const maintenanceApi = {
  status: () => api.get('/maintenance/status'),
}

// ── XAS Travel (Tiket Pesawat/Kereta/Bus/Pelni via Rajabiller Checkout Page) ──
export const xasApi = {
  // Body: { page: 'kereta'|'pesawat'|'dlu'|'pelni', phone?: string }
  // Return: { success, data: { embed_fe_url, expired_time, token_mitra, page } }
  createCredential: (d) => api.post('/xas/credential', d),
}

// ── Travel KERETA (Rajabiller API langsung) ──────────────────────────────
export const travelApi = {
  // Settings publik (markup per pax)
  settings    : ()  => api.get('/travel/settings'),
  // Public (read-only)
  stations    : ()  => api.get('/travel/train/stations'),
  searchTrain : (d) => api.post('/travel/train/search', d),      // { origin, destination, date, adult, infant }
  seatLayout  : (d) => api.post('/travel/train/seat-layout', d), // { origin, destination, date, trainNumber }
  // Auth (booking flow)
  bookTrain   : (d) => api.post('/travel/train/book', d),
  changeSeat  : (d) => api.post('/travel/train/change-seat', d),
  cancelBook  : (d) => api.post('/travel/train/cancel', d),
  trainStatus : (bookCode) => api.get(`/travel/train/status/${bookCode}`),

  // ── Pelni ──
  pelniOrigins      : ()  => api.get('/travel/pelni/origins'),
  pelniDestinations : ()  => api.get('/travel/pelni/destinations'),
  searchPelni       : (d) => api.post('/travel/pelni/search', d), // { origin, destination, startDate, endDate }
  pelniCheckAvail   : (d) => api.post('/travel/pelni/check-availability', d),

  // ── Booking + Payment (checkout → pay → e-tiket) ──
  checkout      : (d)  => api.post('/travel/checkout', d),
  myBookings    : ()   => api.get('/travel/bookings'),
  getBooking    : (id) => api.get(`/travel/bookings/${id}`),
  downloadEtiket: (id) => api.get(`/travel/bookings/${id}/etiket`, { responseType: 'blob' }),
  // Admin: verifikasi pembayaran travel → terbitkan e-tiket
  adminBookings : (p)  => api.get('/admin/travel/bookings', { params: p }),
  adminIssue    : (id, d) => api.post(`/admin/travel/bookings/${id}/issue`, d),

  // ── Pesawat ──
  airports      : ()  => api.get('/travel/flight/airports'),
  airlines      : ()  => api.get('/travel/flight/airlines'),
  searchFlight    : (d) => api.post('/travel/flight/search', d), // 1 maskapai
  searchAllFlights: (d) => api.post('/travel/flight/search-all', d), // semua maskapai (ala Traveloka)
  flightFare      : (d) => api.post('/travel/flight/fare', d),
  bookFlight    : (d) => api.post('/travel/flight/book', d),
}

export const paymentApi = {
  mode        : ()       => api.get('/payments/mode'),
  initiate    : (d)      => api.post('/payments/initiate', d),
  status      : (bId)    => api.get(`/payments/${bId}/status`),
  uploadProof : (bId, fd)=> api.post(`/payments/${bId}/upload-proof`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  // Admin manual confirmation
  confirmManual: (bId, d) => api.post(`/payments/${bId}/confirm-manual`, d || {}),
  getAll      : (p)      => api.get('/payments', { params: p }),
}

export const promoApi = {
  getAll      : ()     => api.get('/promos'),
  getActive   : ()     => api.get('/promos/active'),
  flashSales  : ()     => api.get('/promos/flash-sales'),
  validate    : (d)    => api.post('/promos/validate', d),
  myPromos    : ()     => api.get('/promos/my'),
  platform    : ()     => api.get('/promos/platform'),
  ownersList  : ()     => api.get('/promos/owners-list'),
  flyers      : ()     => api.get('/promos/flyers'),
  follow      : (id)   => api.post(`/promos/${id}/follow`),
  unfollow    : (id)   => api.delete(`/promos/${id}/follow`),
  create      : (d)    => d instanceof FormData
    ? api.post('/promos', d, { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.post('/promos', d),
  update      : (id,d) => {
    if (d instanceof FormData) {
      d.append('_method', 'PUT')
      return api.post(`/promos/${id}`, d, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    return api.put(`/promos/${id}`, d)
  },
  remove      : (id)   => api.delete(`/promos/${id}`),
  loyalty: {
    balance : ()    => api.get('/promos/loyalty/balance'),
    history : (p)   => api.get('/promos/loyalty/history', { params: p }),
    redeem  : (d)   => api.post('/promos/loyalty/redeem', d),
  },
}

export const adminApi = {
  dashboard      : ()       => api.get('/admin/dashboard'),
  revenue        : (p)      => api.get('/admin/reports/revenue', { params: p }),
  bookings       : (p)      => api.get('/admin/reports/bookings', { params: p }),
  canceled       : (p)      => api.get('/admin/reports/canceled', { params: p }),
  logs           : (p)      => api.get('/admin/logs', { params: p }),
  // Analytics
  analyticsOverview  : (p)  => api.get('/admin/analytics/overview', { params: p }),
  analyticsUsers     : (p)  => api.get('/admin/analytics/users', { params: p }),
  analyticsBookings  : (p)  => api.get('/admin/analytics/bookings', { params: p }),
  analyticsTopHotels : (p)  => api.get('/admin/analytics/top-hotels', { params: p }),
  gateways       : ()       => api.get('/admin/settings/payment-gateways'),
  setGateway     : (d)      => api.post('/admin/settings/payment-gateways', d),
  // Payment mode + manual bank
  getPaymentMode    : ()    => api.get('/admin/settings/payment-mode'),
  setPaymentMode    : (d)   => api.post('/admin/settings/payment-mode', d),
  getPaymentManual  : ()    => api.get('/admin/settings/payment-manual'),
  setPaymentManual  : (d)   => api.post('/admin/settings/payment-manual', d),
  // Maintenance mode
  getMaintenance    : ()    => api.get('/admin/settings/maintenance'),
  setMaintenance    : (d)   => api.post('/admin/settings/maintenance', d),
  // PPN tax toggle
  getPpnTax         : ()    => api.get('/admin/settings/ppn-tax'),
  setPpnTax         : (d)   => api.post('/admin/settings/ppn-tax', d),
  // Markup travel
  getTravelMarkup   : ()    => api.get('/admin/settings/travel-markup'),
  setTravelMarkup   : (d)   => api.post('/admin/settings/travel-markup', d),
  // Hotels CRUD
  hotels         : (p)      => api.get('/admin/hotels', { params: p }),
  pendingHotels  : ()       => api.get('/admin/hotels/pending'),
  createHotel    : (d)      => d instanceof FormData
    ? api.post('/admin/hotels', d, { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.post('/admin/hotels', d),
  updateHotel    : (id, d)  => {
    if (d instanceof FormData) {
      if (!d.has('_method')) d.append('_method', 'PUT')
      return api.post(`/admin/hotels/${id}`, d, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    return api.put(`/admin/hotels/${id}`, d)
  },
  deleteHotel    : (id)     => api.delete(`/admin/hotels/${id}`),
  approveHotel   : (id)     => api.post(`/admin/hotels/${id}/approve`),
  blockHotel     : (id)     => api.post(`/admin/hotels/${id}/block`),
  // Update komisi platform (markup final = commission_percent + 2% di BE)
  updateHotelCommission: (id, commissionPercent) =>
    api.put(`/admin/hotels/${id}/commission`, { commission_percent: commissionPercent }),
}

export const userApi = {
  profile      : ()       => api.get('/users/profile'),
  update       : (d)      => api.put('/users/profile', d),
  avatar       : (d)      => api.post('/users/profile/avatar', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  password     : (d)      => api.put('/users/change-password', d),
  getAll       : (p)      => api.get('/users', { params: p }),
  getById      : (id)     => api.get(`/users/${id}`),
  changeRole   : (id, d)  => api.put(`/users/${id}/role`, d),
  toggleStatus : (id)     => api.put(`/users/${id}/status`),
  // Superadmin CRUD
  create       : (d)      => api.post('/users', d),
  adminUpdate  : (id, d)  => api.put(`/users/${id}`, d),
  delete       : (id)     => api.delete(`/users/${id}`),
}

export const campaignApi = {
  getAll   : ()      => api.get('/admin/campaigns'),
  myList   : ()      => api.get('/campaigns/my'),
  forHotel : (id)    => api.get(`/hotels/${id}/campaigns`),
  create   : (d)     => api.post('/admin/campaigns', d),
  update   : (id, d) => api.put(`/admin/campaigns/${id}`, d),
  remove   : (id)    => api.delete(`/admin/campaigns/${id}`),
}

export const ownerApi = {
  dashboard: (p) => api.get('/owner/dashboard', { params: p }),
}

export const mmApi = {
  myMM : () => api.get('/owner/market-manager'),
}

export const mmHandlerApi = {
  listMMs   : ()           => api.get('/admin/mm-handler'),
  getOwners : (mmId)       => api.get(`/admin/mm-handler/${mmId}/owners`),
  setOwners : (mmId, d)    => api.post(`/admin/mm-handler/${mmId}/owners`, d),
}

export const chatApi = {
  ownerRooms       : ()       => api.get('/chat/owner-rooms'),
  myRooms          : ()       => api.get('/chat/rooms'),
  createRoom       : (d)      => api.post('/chat/rooms', d),
  messages         : (id)     => api.get(`/chat/rooms/${id}/messages`),
  send             : (id, d)  => api.post(`/chat/rooms/${id}/messages`, d),
  // Support chat (customer ↔ Arahinn CS)
  supportMyRoom    : ()       => api.get('/chat/support/my-room'),
  supportAdminList : (p)      => api.get('/chat/support/rooms', { params: p }),
  // Inquiry chat (customer ↔ Owner penginapan, pra-booking)
  inquiryRoom      : (hotelId)=> api.post('/chat/inquiry', { hotel_id: hotelId }),
  myInquiries      : ()       => api.get('/chat/inquiry/my-rooms'),
  ownerInquiries   : ()       => api.get('/chat/owner-inquiries'),
}

export const authApi = {
  register      : (d)    => api.post('/auth/register', d),
  registerOwner : (d)    => api.post('/auth/register-owner', d),
  login       : (d)    => api.post('/auth/login', d),
  logout      : ()     => api.post('/auth/logout'),
  refresh     : (d)    => api.post('/auth/refresh-token', d),
  forgot      : (d)    => api.post('/auth/forgot-password', d),
  reset       : (d)    => api.post('/auth/reset-password', d),
  me          : ()     => api.get('/auth/me'),
}

export const interiorApi = {
  submit      : (d)    => api.post('/interior-inquiries', d),
  getAll      : (p)    => api.get('/interior-inquiries', { params: p }),
  updateStatus: (id,d) => api.put(`/interior-inquiries/${id}/status`, d),
}

export const interiorDesignApi = {
  // public — gallery (approved only, no auth required)
  publicList  : ()      => api.get('/interior-designs'),
  // admin CRUD
  adminList   : ()      => api.get('/admin/interior-designs'),
  create      : (fd)    => api.post('/admin/interior-designs', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update      : (id,fd) => api.post(`/admin/interior-designs/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove      : (id)    => api.delete(`/admin/interior-designs/${id}`),
  // superadmin approval
  approve     : (id)    => api.post(`/admin/interior-designs/${id}/approve`),
  reject      : (id)    => api.post(`/admin/interior-designs/${id}/reject`),
}

// ── PPOB (Payment Point Online Banking) ────────────────────────────
export const ppobApi = {
  // Public catalog
  categories      : ()        => api.get('/ppob/categories'),
  products        : (p)       => api.get('/ppob/products', { params: p }),
  // Authenticated — PREPAID 1-step (purchase), POSTPAID 2-step (inquiry → confirmPay)
  purchase        : (d)       => api.post('/ppob/purchase', d),
  inquiry         : (d)       => api.post('/ppob/inquiry', d),
  confirmPay      : (code)    => api.post(`/ppob/transactions/${code}/confirm-pay`),
  myTransactions  : (p)       => api.get('/ppob/my-transactions', { params: p }),
  getTrx          : (code)    => api.get(`/ppob/transactions/${code}`),
  downloadReceipt : (code)    => api.get(`/ppob/transactions/${code}/receipt`, { responseType: 'blob' }),
  // Admin
  adminTrx        : (p)       => api.get('/admin/ppob/transactions', { params: p }),
  adminMarkPaid   : (code, d) => api.post(`/admin/ppob/transactions/${code}/mark-paid`, d),
  adminCancel     : (code, d) => api.post(`/admin/ppob/transactions/${code}/cancel`, d),
  adminRefund     : (code, d) => api.post(`/admin/ppob/transactions/${code}/refund`, d),
  adminRetry      : (code)    => api.post(`/admin/ppob/transactions/${code}/retry`),
  adminBalance    : ()        => api.get('/admin/ppob/balance'),
  adminCategories : ()        => api.get('/admin/ppob/categories'),
  adminUpdateCategory: (id,d) => api.put(`/admin/ppob/categories/${id}`, d),
  adminSyncCatalog: (d)       => api.post('/admin/ppob/sync-catalog', d),
}
