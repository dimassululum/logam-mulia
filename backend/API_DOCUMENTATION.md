# 📚 Logam Mulia Backend - API Documentation

## 🌐 Base URL

**Production:** `https://api.logam-mulia-antam.com`  
**Development:** `http://localhost:5000`

---

## 🔐 Authentication

### JWT Token Required
Most endpoints require JWT token in `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access
- **CUSTOMER:** Can access public endpoints and own data
- **ADMIN:** Can access management endpoints
- **SUPER_ADMIN:** Full system access

---

## 📋 API Endpoints

### 🔑 Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "08123456789"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "08123456789"
}
```

---

### 📦 Categories

#### List Categories
```http
GET /api/categories
```

#### Get Category by ID
```http
GET /api/categories/:id
```

#### Create Category (Admin)
```http
POST /api/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Emas Batangan",
  "slug": "emas-batangan",
  "description": "Kategori emas batangan murni",
  "isActive": true
}
```

#### Update Category (Admin)
```http
PUT /api/categories/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Category",
  "description": "Updated description"
}
```

#### Delete Category (Admin)
```http
DELETE /api/categories/:id
Authorization: Bearer <admin-token>
```

---

### 🛍️ Products

#### List Products
```http
GET /api/products?page=1&limit=10&category=emas&minPrice=1000000&maxPrice=5000000
```

#### Get Product by Slug
```http
GET /api/products/:slug
```

#### Search Products
```http
GET /api/products/search?q=emas&page=1&limit=10
```

#### Create Product (Admin)
```http
POST /api/products
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

data: {
  "name": "Gold Necklace",
  "slug": "gold-necklace",
  "description": "Beautiful gold necklace",
  "price": 2500000,
  "stock": 50,
  "categoryId": "category-id",
  "isActive": true
}
images: [file1, file2]
```

#### Update Product (Admin)
```http
PUT /api/products/:id
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

data: {
  "name": "Updated Product",
  "price": 3000000
}
images: [file1, file2]
```

#### Delete Product (Admin)
```http
DELETE /api/products/:id
Authorization: Bearer <admin-token>
```

---

### 🛒 Shopping Cart

#### Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

#### Add to Cart
```http
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-id",
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/cart/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Cart Item
```http
DELETE /api/cart/:itemId
Authorization: Bearer <token>
```

#### Clear Cart
```http
DELETE /api/cart
Authorization: Bearer <token>
```

---

### 📦 Orders

#### List Orders
```http
GET /api/orders?page=1&limit=10&status=PENDING
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product-id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "address": "Jl. Test No. 123",
    "city": "Jakarta",
    "province": "DKI Jakarta",
    "postalCode": "12345",
    "recipientName": "John Doe",
    "recipientPhone": "08123456789"
  },
  "shippingCourier": "JNE",
  "shippingCost": 10000,
  "voucherCode": "DISCOUNT10"
}
```

#### Update Order Status (Admin)
```http
PUT /api/orders/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "CONFirmed"
}
```

---

### 💳 Payments

#### Get Payment Methods
```http
GET /api/payments/methods
```

#### Create Payment Charge
```http
POST /api/payments/charge
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order-id",
  "paymentMethod": "bank_transfer"
}
```

#### Payment Webhook
```http
POST /api/payments/webhook
Content-Type: application/json

{
  "transaction_status": "settlement",
  "order_id": "order-id",
  "transaction_id": "transaction-id"
}
```

---

### 🎟️ Vouchers

#### List Active Vouchers
```http
GET /api/vouchers/active
```

#### Validate Voucher
```http
POST /api/vouchers/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "DISCOUNT10",
  "totalAmount": 2500000
}
```

#### Create Voucher (Admin)
```http
POST /api/vouchers
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "code": "DISCOUNT10",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "minPurchase": 100000,
  "maxDiscount": 50000,
  "usageLimit": 100,
  "perUserLimit": 1,
  "isActive": true
}
```

---

### 🌟 Reviews

#### List Product Reviews
```http
GET /api/reviews?productId=product-id&page=1&limit=10
```

#### Create Review
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-id",
  "orderId": "order-id",
  "rating": 5,
  "comment": "Excellent product!"
}
```

#### Update Review (Admin)
```http
PUT /api/reviews/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "approved"
}
```

---

### 🎯 Admin Dashboard

#### Dashboard Statistics
```http
GET /api/admin/dashboard?period=30d
Authorization: Bearer <admin-token>
```

#### Admin Users List
```http
GET /api/admin/users?page=1&limit=10&role=CUSTOMER&status=active
Authorization: Bearer <admin-token>
```

#### Update User Status (Admin)
```http
PUT /api/admin/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "isActive": false,
  "role": "CUSTOMER"
}
```

#### Admin Orders List
```http
GET /api/admin/orders?page=1&limit=10&status=PENDING&dateFrom=2024-01-01&dateTo=2024-12-31
Authorization: Bearer <admin-token>
```

#### Bulk Update Orders (Admin)
```http
POST /api/admin/orders/bulk-update
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "orderIds": ["order-id-1", "order-id-2"],
  "status": "Confirmed"
}
```

#### Get Settings (Admin)
```http
GET /api/admin/settings
Authorization: Bearer <admin-token>
```

#### Update Settings (Admin)
```http
POST /api/admin/settings
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "settings": {
    "company_name": "Logam Mulia Antam",
    "company_phone": "+62 812-3456-7890",
    "shipping_cost_base": "10000"
  }
}
```

---

### 🎨 Banners

#### List Banners (Admin)
```http
GET /api/banners?position=home&isActive=true
Authorization: Bearer <admin-token>
```

#### Public Banners
```http
GET /api/banners/public?position=home
```

#### Create Banner (Admin)
```http
POST /api/banners
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

{
  "title": "Special Offer",
  "subtitle": "Get 20% off",
  "imageUrl": "https://example.com/banner.jpg",
  "linkUrl": "/products",
  "isActive": true,
  "position": "home",
  "sortOrder": 1
}
```

#### Update Banner (Admin)
```http
PUT /api/banners/:id
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

{
  "title": "Updated Banner",
  "isActive": false
}
```

#### Toggle Banner Status (Admin)
```http
POST /api/banners/:id/toggle
Authorization: Bearer <admin-token>
```

#### Reorder Banners (Admin)
```http
POST /api/banners/reorder
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "bannerOrders": [
    {"id": "banner-id-1", "sortOrder": 1},
    {"id": "banner-id-2", "sortOrder": 2}
  ]
}
```

---

### 📝 Contents

#### List Contents (Admin)
```http
GET /api/contents?type=page&status=published&page=1&limit=10
Authorization: Bearer <admin-token>
```

#### Public Contents
```http
GET /api/contents/public?type=page
```

#### Get Content by Slug
```http
GET /api/contents/slug/:slug
```

#### Create Content (Admin)
```http
POST /api/contents
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "slug": "about-us",
  "title": "About Us",
  "content": "<h1>About Our Company</h1><p>We are...</p>",
  "excerpt": "Learn about our company",
  "type": "page",
  "status": "published",
  "seoTitle": "About Us - Logam Mulia Antam",
  "seoDesc": "Learn about Logam Mulia Antam company"
}
```

#### Update Content (Admin)
```http
PUT /api/contents/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Updated Content",
  "status": "draft"
}
```

#### Publish Content (Admin)
```http
POST /api/contents/:id/publish
Authorization: Bearer <admin-token>
```

#### Unpublish Content (Admin)
```http
POST /api/contents/:id/unpublish
Authorization: Bearer <admin-token>
```

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## 🔍 Query Parameters

### Common Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search term
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort order (asc/desc, default: desc)

### Date Parameters
- `dateFrom`: Start date (YYYY-MM-DD)
- `dateTo`: End date (YYYY-MM-DD)
- `period`: Predefined period (7d, 30d, 90d, 1y)

---

## 🚨 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## 📝 Examples

### Complete Order Flow
```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@example.com',
    password: 'password123'
  })
});
const { token } = await loginResponse.json();

// 2. Add to cart
await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    productId: 'product-id',
    quantity: 2
  })
});

// 3. Create order
const orderResponse = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    items: [{ productId: 'product-id', quantity: 2 }],
    shippingAddress: {
      address: 'Jl. Test No. 123',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postalCode: '12345',
      recipientName: 'John Doe',
      recipientPhone: '08123456789'
    },
    shippingCourier: 'JNE',
    shippingCost: 10000
  })
});

// 4. Create payment
const paymentResponse = await fetch('/api/payments/charge', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    orderId: orderResponse.data.order.id,
    paymentMethod: 'bank_transfer'
  })
});
```

---

## 🔄 Rate Limiting

- **General Endpoints:** 100 requests per 15 minutes
- **Authentication:** 10 requests per minute
- **File Upload:** 5 requests per minute
- **Admin Endpoints:** 200 requests per 15 minutes

---

## 📞 Support

For API support and questions:
- **Email:** api-support@logam-mulia-antam.com
- **Documentation:** https://docs.logam-mulia-antam.com
- **Status Page:** https://status.logam-mulia-antam.com

---

*This API documentation covers all endpoints available in the Logam Mulia Backend system.*
