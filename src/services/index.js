import api from './api'

export const bookingApi = {
  calcPrice   : (d)    => api.post('/bookings/calculate-price', d),
  create      : (d)    => api.post('/bookings', d),
  myOrders    : (p)    => api.get('/bookings/my-orders', { params: p }),
  getById     : (id)   => api.get(`/bookings/${id}`),
  cancel      : (id)   => api.put(`/bookings/${id}/cancel`),
  reschedule  : (id,d) => api.put(`/bookings/${id}/reschedule`, d),
  refund      : (id)   => api.post(`/bookings/${id}/refund`),
  getAll      : (p)    => api.get('/bookings', { params: p }),
}

export const paymentApi = {
  initiate    : (d)    => api.post('/payments/initiate', d),
  status      : (bId)  => api.get(`/payments/${bId}/status`),
  getAll      : (p)    => api.get('/payments', { params: p }),
}

export const promoApi = {
  getActive   : ()     => api.get('/promos/active'),
  flashSales  : ()     => api.get('/promos/flash-sales'),
  validate    : (d)    => api.post('/promos/validate', d),
  create      : (d)    => api.post('/promos', d),
  update      : (id,d) => api.put(`/promos/${id}`, d),
  remove      : (id)   => api.delete(`/promos/${id}`),
  loyalty: {
    balance : ()    => api.get('/promos/loyalty/balance'),
    history : (p)   => api.get('/promos/loyalty/history', { params: p }),
    redeem  : (d)   => api.post('/promos/loyalty/redeem', d),
  },
}

export const adminApi = {
  dashboard   : ()     => api.get('/admin/dashboard'),
  revenue     : (p)    => api.get('/admin/reports/revenue', { params: p }),
  bookings    : (p)    => api.get('/admin/reports/bookings', { params: p }),
  canceled    : (p)    => api.get('/admin/reports/canceled', { params: p }),
  logs        : (p)    => api.get('/admin/logs', { params: p }),
  pending     : ()     => api.get('/admin/hotels/pending'),
  gateways    : ()     => api.get('/admin/settings/payment-gateways'),
  setGateway  : (d)    => api.post('/admin/settings/payment-gateways', d),
}

export const userApi = {
  profile     : ()     => api.get('/users/profile'),
  update      : (d)    => api.put('/users/profile', d),
  avatar      : (d)    => api.post('/users/profile/avatar', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  password    : (d)    => api.put('/users/change-password', d),
  getAll      : (p)    => api.get('/users', { params: p }),
  changeRole  : (id,d) => api.put(`/users/${id}/role`, d),
  toggleStatus: (id)   => api.put(`/users/${id}/status`),
}

export const authApi = {
  register    : (d)    => api.post('/auth/register', d),
  login       : (d)    => api.post('/auth/login', d),
  logout      : ()     => api.post('/auth/logout'),
  refresh     : (d)    => api.post('/auth/refresh-token', d),
  forgot      : (d)    => api.post('/auth/forgot-password', d),
  reset       : (d)    => api.post('/auth/reset-password', d),
  me          : ()     => api.get('/auth/me'),
}
