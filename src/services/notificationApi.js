import api from './api'

export const notificationApi = {
  getAll       : (params) => api.get('/notifications', { params }),
  unreadCount  : ()       => api.get('/notifications/unread-count'),
  markRead     : (id)     => api.post(`/notifications/${id}/read`),
  markAllRead  : ()       => api.post('/notifications/mark-all-read'),
}
