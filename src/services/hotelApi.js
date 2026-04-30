import api from './api'

const isFormData = (value) => typeof FormData !== 'undefined' && value instanceof FormData

const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 120000,
}

export const hotelApi = {
  search    : (params) => api.get('/hotels/search', { params }),
  getById   : (id)     => api.get(`/hotels/${id}`),
  getRooms  : (id)     => api.get(`/hotels/${id}/rooms`),
  getCities : ()       => api.get('/hotels/cities'),
  checkAvail: (id, params) => api.get(`/hotels/${id}/availability`, { params }),

  // Owner
  myHotel   : ()       => api.get('/hotels/my-hotel'),

  // Owner / Admin
  create    : (data)   => api.post('/hotels', data, multipartConfig),
  update    : (id, d)  => api.put(`/hotels/${id}`, d),
  approve   : (id)     => api.post(`/hotels/${id}/approve`),
  block     : (id)     => api.post(`/hotels/${id}/block`),
  addRoom   : (id, d)  => api.post(`/hotels/${id}/rooms`, d),
  updateRoom: (hId, rId, d) => {
    if (isFormData(d)) {
      if (!d.has('_method')) {
        d.append('_method', 'PUT')
      }
      return api.post(`/hotels/${hId}/rooms/${rId}`, d, multipartConfig)
    }
    return api.put(`/hotels/${hId}/rooms/${rId}`, d)
  },
  deleteRoom: (hId, rId)    => api.delete(`/hotels/${hId}/rooms/${rId}`),
}
