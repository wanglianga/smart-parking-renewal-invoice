import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

export const ownerAPI = {
  create: (data) => api.post('/owners', data),
  list: () => api.get('/owners'),
  get: (id) => api.get(`/owners/${id}`),
  update: (id, data) => api.put(`/owners/${id}`, data)
}

export const packageAPI = {
  list: (isActive) => api.get('/packages', { params: { is_active: isActive } }),
  get: (id) => api.get(`/packages/${id}`)
}

export const couponAPI = {
  list: () => api.get('/coupons'),
  get: (id) => api.get(`/coupons/${id}`),
  calculate: (couponId, originalAmount) =>
    api.post('/coupons/calculate', { coupon_id: couponId, original_amount: originalAmount })
}

export const renewalAPI = {
  create: (data) => api.post('/renewals', data),
  list: (ownerId) => api.get('/renewals', { params: { owner_id: ownerId } }),
  get: (id) => api.get(`/renewals/${id}`)
}

export const invoiceAPI = {
  create: (data) => api.post('/invoices', data),
  list: (ownerId, renewalId) =>
    api.get('/invoices', { params: { owner_id: ownerId, renewal_id: renewalId } })
}

export const arrearsAPI = {
  check: (ownerId) => api.get(`/arrears/check/${ownerId}`),
  list: (ownerId) => api.get('/arrears', { params: { owner_id: ownerId } })
}

export default api
