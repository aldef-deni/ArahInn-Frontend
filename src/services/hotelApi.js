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
  popularDestinations: () => api.get('/hotels/popular-destinations'),
  getById   : (id)     => api.get(`/hotels/${id}`),
  getRooms  : (id)     => api.get(`/hotels/${id}/rooms`),
  getCities : ()       => api.get('/hotels/cities'),
  checkAvail: (id, params) => api.get(`/hotels/${id}/availability`, { params }),

  // Owner
  myHotel   : ()       => api.get('/hotels/my-hotel'),
  myHotels  : ()       => api.get('/hotels/my-hotels'),

  // Owner / Admin
  create    : (data)   => api.post('/hotels', data, multipartConfig),
  update    : (id, d)  => {
    if (isFormData(d)) {
      if (!d.has('_method')) d.append('_method', 'PUT')
      return api.post(`/hotels/${id}`, d, multipartConfig)
    }
    return api.put(`/hotels/${id}`, d)
  },
  approve   : (id)     => api.post(`/hotels/${id}/approve`),
  block     : (id)     => api.post(`/hotels/${id}/block`),
  addRoom   : (id, d)  => isFormData(d)
    ? api.post(`/hotels/${id}/rooms`, d, multipartConfig)
    : api.post(`/hotels/${id}/rooms`, d),
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

  // ── Harga & Ketersediaan ─────────────────────────────
  // Settings
  getSettings  : (hId)       => api.get(`/hotels/${hId}/settings`),
  updateSettings: (hId, d)   => api.put(`/hotels/${hId}/settings`, d),

  // Rate Plans
  getRatePlans  : (hId)       => api.get(`/hotels/${hId}/rate-plans`),
  getRatePlan   : (hId, id)   => api.get(`/hotels/${hId}/rate-plans/${id}`),
  createRatePlan: (hId, d)    => api.post(`/hotels/${hId}/rate-plans`, d),
  updateRatePlan: (hId, id, d)=> api.put(`/hotels/${hId}/rate-plans/${id}`, d),
  deleteRatePlan: (hId, id)   => api.delete(`/hotels/${hId}/rate-plans/${id}`),

  // Room prices (calendar)
  getRoomPrices : (hId, rId, params) => api.get(`/hotels/${hId}/rooms/${rId}/prices`, { params }),
  upsertRoomPrices: (hId, rId, d)    => api.put(`/hotels/${hId}/rooms/${rId}/prices`, d),
  bulkUpdatePrices: (hId, d)         => api.post(`/hotels/${hId}/rooms/prices/bulk`, d),
  toggleRoomNow   : (hId, rId)       => api.put(`/hotels/${hId}/rooms/${rId}/toggle-now`),

  // Range view (Softblock Allotment): semua kamar × tanggal
  getRoomPricesRange: (hId, params)  => api.get(`/hotels/${hId}/rooms/prices/range`, { params }),

  // Hotel fees
  getHotelFees  : (hId)        => api.get(`/hotels/${hId}/fees`),
  createHotelFee: (hId, d)     => api.post(`/hotels/${hId}/fees`, d),
  updateHotelFee: (hId, id, d) => api.put(`/hotels/${hId}/fees/${id}`, d),
  deleteHotelFee: (hId, id)    => api.delete(`/hotels/${hId}/fees/${id}`),
}
