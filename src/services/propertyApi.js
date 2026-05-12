import api from './api'

const multipart = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }

export const propertyApi = {
  search     : (params) => api.get('/properties', { params }),
  getById    : (id)     => api.get(`/properties/${id}`),
  myListings : ()       => api.get('/properties/my-listings'),
  create     : (data)   => api.post('/properties', data, multipart),
  update     : (id, d)  => {
    if (d instanceof FormData) { d.append('_method', 'PUT'); return api.post(`/properties/${id}`, d, multipart) }
    return api.put(`/properties/${id}`, d)
  },
  destroy    : (id)     => api.delete(`/properties/${id}`),
  // Admin
  pending    : ()       => api.get('/properties/pending'),
  approve    : (id)     => api.post(`/properties/${id}/approve`),
  reject     : (id, d)  => api.post(`/properties/${id}/reject`, d),
}
