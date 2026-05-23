import api from './api'

export const reviewApi = {
  // public: approved reviews
  byHotel:    (hotelId)    => api.get(`/hotels/${hotelId}/reviews`),
  byProperty: (propertyId) => api.get(`/properties/${propertyId}/reviews`),

  // user: submit review (hotel atau property)
  store: (data) => api.post('/reviews', data),

  // user: list ulasan miliknya sendiri
  mine: () => api.get('/reviews/mine'),

  // user: cek apakah eligible review hotel ini (sudah pernah booking & check-out)
  eligibilityHotel: (hotelId) => api.get(`/reviews/eligibility/hotel/${hotelId}`),

  // admin
  adminList: (params) => api.get('/admin/reviews', { params }),
  approve:   (id)     => api.post(`/admin/reviews/${id}/approve`),
  reject:    (id, reason) => api.post(`/admin/reviews/${id}/reject`, { reason }),
}
