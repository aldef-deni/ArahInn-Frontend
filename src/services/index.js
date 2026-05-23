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

export const paymentApi = {
  initiate    : (d)    => api.post('/payments/initiate', d),
  status      : (bId)  => api.get(`/payments/${bId}/status`),
  getAll      : (p)    => api.get('/payments', { params: p }),
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
  gateways       : ()       => api.get('/admin/settings/payment-gateways'),
  setGateway     : (d)      => api.post('/admin/settings/payment-gateways', d),
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
