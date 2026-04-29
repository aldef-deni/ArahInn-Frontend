import api from './api'

export const hotelApi = {
  search    : (params) => api.get('/hotels/search', { params }),
  getById   : (id)     => api.get(`/hotels/${id}`),
  getRooms  : (id)     => api.get(`/hotels/${id}/rooms`),
  getCities : ()       => api.get('/hotels/cities'),
  checkAvail: (id, params) => api.get(`/hotels/${id}/availability`, { params }),

  // Owner / Admin
  create    : (data)   => api.post('/hotels', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update    : (id, d)  => api.put(`/hotels/${id}`, d),
  approve   : (id)     => api.post(`/hotels/${id}/approve`),
  block     : (id)     => api.post(`/hotels/${id}/block`),
  addRoom   : (id, d)  => api.post(`/hotels/${id}/rooms`, d),
  updateRoom: (hId, rId, d) => api.put(`/hotels/${hId}/rooms/${rId}`, d),
  deleteRoom: (hId, rId)    => api.delete(`/hotels/${hId}/rooms/${rId}`),
}
