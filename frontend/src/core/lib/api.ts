/**
 * Centralized API service layer — all backend calls go through here.
 * Each domain has its own namespace for discoverability.
 */
import apiClient from './api-client'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, phone?: string) =>
    apiClient.post('/auth/register', { name, email, password, phone }),
  logout:   (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),
  me:       () => apiClient.get('/auth/me'),
  refresh:  (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
}

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: {
    page?: number
    limit?: number
    search?: string
    categoryId?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => apiClient.get('/products', { params }),

  getBySlug: (slug: string) =>
    apiClient.get(`/products/slug/${slug}`),

  getById: (id: string) =>
    apiClient.get(`/products/${id}`),

  create: (formData: FormData) =>
    apiClient.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, formData: FormData) =>
    apiClient.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    apiClient.delete(`/products/${id}`),

  updateStock: (id: string, stock: number) =>
    apiClient.patch(`/products/${id}/stock`, { stock }),

  updatePrice: (id: string, price: number) =>
    apiClient.patch(`/products/${id}/price`, { price }),
}

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  list:      ()         => apiClient.get('/categories'),
  getBySlug: (slug: string) => apiClient.get(`/categories/slug/${slug}`),
  getById:   (id: string)   => apiClient.get(`/categories/${id}`),
  create:    (data: { name: string; description?: string; image?: File }) => {
    const fd = new FormData()
    fd.append('name', data.name)
    if (data.description) fd.append('description', data.description)
    if (data.image) fd.append('image', data.image)
    return apiClient.post('/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  update: (id: string, data: { name?: string; description?: string; image?: File }) => {
    const fd = new FormData()
    if (data.name) fd.append('name', data.name)
    if (data.description) fd.append('description', data.description)
    if (data.image) fd.append('image', data.image)
    return apiClient.put(`/categories/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  delete: (id: string) => apiClient.delete(`/categories/${id}`),
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  get:    ()                                          => apiClient.get('/cart'),
  add:    (productId: string, quantity: number)       => apiClient.post('/cart', { productId, quantity }),
  update: (productId: string, quantity: number)       => apiClient.put(`/cart/${productId}`, { quantity }),
  remove: (productId: string)                         => apiClient.delete(`/cart/${productId}`),
  clear:  ()                                          => apiClient.delete('/cart'),
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  list:   (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/orders', { params }),
  getById: (id: string) =>
    apiClient.get(`/orders/${id}`),
  create: (data: unknown) =>
    apiClient.post('/orders', data),
  cancel: (id: string) =>
    apiClient.patch(`/orders/${id}/cancel`),
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  createTransaction: (orderId: string) =>
    apiClient.post('/payments/create-transaction', { orderId }),
  getStatus: (orderId: string) =>
    apiClient.get(`/payments/status/${orderId}`),
  handleNotification: (payload: unknown) =>
    apiClient.post('/payments/notification', payload),
}

// ─── Banners ─────────────────────────────────────────────────────────────────
export const bannersApi = {
  listPublic: () => apiClient.get('/banners/public'),
  list:       () => apiClient.get('/banners'),
  create:     (formData: FormData) =>
    apiClient.post('/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:     (id: string, formData: FormData) =>
    apiClient.put(`/banners/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:     (id: string)            => apiClient.delete(`/banners/${id}`),
  toggle:     (id: string)            => apiClient.patch(`/banners/${id}/toggle`),
  reorder:    (ids: string[])         => apiClient.patch('/banners/reorder', { ids }),
}

// ─── Contents / Articles ─────────────────────────────────────────────────────
export const contentsApi = {
  listPublic: (params?: { page?: number; limit?: number; type?: string }) =>
    apiClient.get('/contents/public', { params }),
  getBySlug:  (slug: string) => apiClient.get('/contents/public', { params: { slug } }),
  list:       (params?: { page?: number; limit?: number }) =>
    apiClient.get('/contents', { params }),
  getById:    (id: string)   => apiClient.get(`/contents/${id}`),
  create:     (data: unknown) => apiClient.post('/contents', data),
  update:     (id: string, data: unknown) => apiClient.put(`/contents/${id}`, data),
  delete:     (id: string)   => apiClient.delete(`/contents/${id}`),
  publish:    (id: string)   => apiClient.patch(`/contents/${id}/publish`),
  unpublish:  (id: string)   => apiClient.patch(`/contents/${id}/unpublish`),
}

// ─── Vouchers ─────────────────────────────────────────────────────────────────
export const vouchersApi = {
  validate: (code: string, totalAmount: number) =>
    apiClient.post('/vouchers/validate', { code, totalAmount }),
  list:     (params?: { page?: number; limit?: number }) =>
    apiClient.get('/vouchers', { params }),
  create:   (data: unknown) => apiClient.post('/vouchers', data),
  update:   (id: string, data: unknown) => apiClient.put(`/vouchers/${id}`, data),
  delete:   (id: string)    => apiClient.delete(`/vouchers/${id}`),
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  listByProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/reviews/product/${productId}`, { params }),
  create: (data: { productId: string; rating: number; comment?: string }) =>
    apiClient.post('/reviews', data),
  delete: (id: string) => apiClient.delete(`/reviews/${id}`),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: (params?: { period?: string }) =>
    apiClient.get('/admin/dashboard', { params }),
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    apiClient.get('/admin/users', { params }),
  getOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get('/admin/orders', { params }),
  getOrderById: (id: string) =>
    apiClient.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string, trackingNumber?: string) =>
    apiClient.patch(`/admin/orders/${id}/status`, { status, trackingNumber }),
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data: unknown) => apiClient.put('/admin/settings', data),
}

// ─── Shipping ─────────────────────────────────────────────────────────────────
export const shippingApi = {
  getProvinces: () => apiClient.get('/shipping/provinces'),
  getCities:    (provinceId: string) => apiClient.get(`/shipping/cities/${provinceId}`),
  getCost:      (data: {
    origin: string
    destination: string
    weight: number
    courier: string
  }) => apiClient.post('/shipping/cost', data),
}
