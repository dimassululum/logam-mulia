// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  pricePerGram: number
  weightGram: number
  totalPrice: number
  stock: number
  imageUrl: string
  category: string
  purity: string // e.g. "99.99%"
  displayRating: number
  reviewCount: number
  soldCount: number
  createdAt: string
  updatedAt: string
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product
  quantity: number
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'unpaid'
  | 'pending'
  | 'success'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'selesai'
  | 'canceled'
  | 'cancelled'
  | 'refund'

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  totalAmount: number
  status: OrderStatus
  snapToken?: string
  shippingAddress: ShippingAddress
  createdAt: string
}

// ─── Shipping ─────────────────────────────────────────────────────────────────
export interface ShippingAddress {
  fullName: string
  phone: string
  province: string
  city: string
  district: string
  postalCode: string
  address: string
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  ktpUrl?: string
}

export type UserRole = 'customer' | 'admin' | 'super_admin'
export type AdminUserRole = Extract<UserRole, 'admin' | 'super_admin'>

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: AdminUserRole
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
