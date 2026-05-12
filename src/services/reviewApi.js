import api from './api'

export const reviewApi = {
  // public: approved reviews for a hotel
  byHotel: (hotelId) => api.get(`/hotels/${hotelId}/reviews`),

  // user: submit review
  store: (data) => api.post('/reviews', data),

  // admin
  adminList:  (params) => api.get('/admin/reviews', { params }),
  approve:    (id)     => api.post(`/admin/reviews/${id}/approve`),
  reject:     (id, reason) => api.post(`/admin/reviews/${id}/reject`, { reason }),
}
