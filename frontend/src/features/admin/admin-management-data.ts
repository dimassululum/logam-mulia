import type { OrderStatus } from '@/core/types'

export type CatalogStatus = 'active' | 'inactive'
export type DiscountType = 'percentage' | 'fixed'
export type VoucherStatus = 'active' | 'inactive' | 'expired'

export interface AdminProductRecord {
  id: string
  sku: string
  name: string
  category: string
  weightGram: number
  purity: string
  price: number
  stock: number
  status: CatalogStatus
  updatedAt: string
  accent: string
}

export interface AdminCategoryRecord {
  id: string
  name: string
  slug: string
  description: string
  imageHint: string
  productCount: number
  status: CatalogStatus
  updatedAt: string
}

export interface AdminBoutiqueRecord {
  id: string
  name: string
  city: string
  address: string
  contactPhone: string
  googleMapsUrl: string
  status: CatalogStatus
  updatedAt: string
}

export interface AdminOrderRecord {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  primaryItem: string
  itemCount: number
  totalAmount: number
  status: OrderStatus
  paymentMethodCode?: string | null
  paymentMethod: string
  paymentMethodCategory?: string | null
  paymentMethodConfig?: PaymentMethodConfig | null
  paymentProofUrl?: string | null
  paymentProofUploadedAt?: string | null
  shippingMethod: string
  trackingNumber?: string
  requiresKtp: boolean
  address: string
  createdAt: string
  updatedAt: string
}

export interface PaymentMethodConfig {
  imageUrl?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  savingsBookAttachmentUrl?: string
  instructions?: string
  bankAccounts?: {
    id: string
    bankName?: string
    accountNumber?: string
    accountHolder?: string
    isActive?: boolean
    savingsBookAttachmentUrl?: string
  }[]
}

export interface AdminOrderLineItem {
  id: string
  productName: string
  productImage?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface AdminOrderPartyDetail {
  name: string
  phone: string
  email: string
}

export interface AdminOrderRecipientDetail extends AdminOrderPartyDetail {
  province: string
  city: string
  district: string
  village: string
  address: string
  postalCode: string
  ktpDocumentLabel: string
  ktpUrl?: string | null
}

export type AdminOrderFulfillmentMethod = 'delivery' | 'self_pickup'

export interface AdminOrderFulfillmentDetail {
  method: AdminOrderFulfillmentMethod
  courier?: string
  serviceLabel?: string
  boutiqueName?: string
  boutiqueAddress?: string
  pickupCode?: string
  pickupWindow?: string
  contactPerson?: string
  note?: string
}

export interface AdminOrderTimelineEvent {
  id: string
  title: string
  description: string
  occurredAt: string
  tone?: 'success' | 'info' | 'warning'
}

export interface AdminOrderDetailRecord extends AdminOrderRecord {
  subtotalAmount: number
  shippingFee: number
  voucherAmount: number
  grandTotalAmount: number
  lineItems: AdminOrderLineItem[]
  customerDetail: AdminOrderPartyDetail
  recipientDetail: AdminOrderRecipientDetail
  receiptCode: string
  receiptCreatedAt: string
  receiptUpdatedAt: string
  fulfillmentDetail: AdminOrderFulfillmentDetail
  timeline: AdminOrderTimelineEvent[]
}

export interface AdminVoucherRecord {
  id: string
  code: string
  title: string
  discountType: DiscountType
  amount: number
  minPurchase: number
  maxDiscount: number | null
  usageLimit: number
  usageCount: number
  perCustomerLimit: number
  applyTo: string
  productIds?: string[]
  startDate: string
  endDate: string
  status: VoucherStatus
}

export interface AdminArticleRecord {
  id: string
  slug: string
  title: string
  thumbnailUrl: string
  contentHtml: string
  publishedAt: string
  status: CatalogStatus
}

export const productCategoryOptions = [
  'Emas Batangan',
  'Perhiasan',
  'Logam Mulia',
  'Koin Emas',
]

export const adminProductRecords: AdminProductRecord[] = [
  {
    id: 'PRD-001',
    sku: 'LM-ANTAM-005',
    name: 'Antam Certicard 5 Gram',
    category: 'Logam Mulia',
    weightGram: 5,
    purity: '99.99%',
    price: 9825000,
    stock: 12,
    status: 'active',
    updatedAt: '2026-04-28T09:15:00+07:00',
    accent: 'from-gold-100 via-white to-gold-50',
  },
  {
    id: 'PRD-002',
    sku: 'LM-ANTAM-010',
    name: 'Antam Certicard 10 Gram',
    category: 'Logam Mulia',
    weightGram: 10,
    purity: '99.99%',
    price: 19150000,
    stock: 8,
    status: 'active',
    updatedAt: '2026-04-28T08:40:00+07:00',
    accent: 'from-gold-50 via-white to-navy-100',
  },
  {
    id: 'PRD-003',
    sku: 'BAT-UBS-025',
    name: 'UBS 25 Gram',
    category: 'Emas Batangan',
    weightGram: 25,
    purity: '99.99%',
    price: 46300000,
    stock: 4,
    status: 'active',
    updatedAt: '2026-04-27T16:05:00+07:00',
    accent: 'from-gold-100 via-gold-50 to-white',
  },
  {
    id: 'PRD-004',
    sku: 'PRH-LUNA-002',
    name: 'Kalung Luna 2 Gram',
    category: 'Perhiasan',
    weightGram: 2,
    purity: '75%',
    price: 3560000,
    stock: 21,
    status: 'active',
    updatedAt: '2026-04-27T13:10:00+07:00',
    accent: 'from-rose-50 via-white to-gold-50',
  },
  {
    id: 'PRD-005',
    sku: 'PRH-ZIVA-004',
    name: 'Gelang Ziva 4 Gram',
    category: 'Perhiasan',
    weightGram: 4,
    purity: '75%',
    price: 6790000,
    stock: 2,
    status: 'inactive',
    updatedAt: '2026-04-26T15:00:00+07:00',
    accent: 'from-navy-100 via-white to-gold-50',
  },
  {
    id: 'PRD-006',
    sku: 'KOIN-MERDEKA-001',
    name: 'Koin Emas Merdeka 1 Gram',
    category: 'Koin Emas',
    weightGram: 1,
    purity: '99.99%',
    price: 2150000,
    stock: 14,
    status: 'active',
    updatedAt: '2026-04-25T11:30:00+07:00',
    accent: 'from-gold-50 via-white to-gold-100',
  },
]

export const adminCategoryRecords: AdminCategoryRecord[] = [
  {
    id: 'CAT-001',
    name: 'Emas Batangan',
    slug: 'emas-batangan',
    description: 'Produk emas batangan standar investasi dengan fokus berat menengah hingga besar.',
    imageHint: 'Hero katalog investasi',
    productCount: 18,
    status: 'active',
    updatedAt: '2026-04-28T08:20:00+07:00',
  },
  {
    id: 'CAT-002',
    name: 'Perhiasan',
    slug: 'perhiasan',
    description: 'Koleksi cincin, gelang, dan kalung emas untuk kebutuhan gifting dan personal style.',
    imageHint: 'Highlight gift set',
    productCount: 26,
    status: 'active',
    updatedAt: '2026-04-27T17:00:00+07:00',
  },
  {
    id: 'CAT-003',
    name: 'Logam Mulia',
    slug: 'logam-mulia',
    description: 'Produk bersertifikat resmi dengan varian gramasi populer untuk transaksi cepat.',
    imageHint: 'Certicard hero strip',
    productCount: 14,
    status: 'active',
    updatedAt: '2026-04-27T12:30:00+07:00',
  },
  {
    id: 'CAT-004',
    name: 'Koin Emas',
    slug: 'koin-emas',
    description: 'Pilihan koin emas koleksi untuk segment buyer pemula dan gift premium.',
    imageHint: 'Campaign seasonal coin',
    productCount: 6,
    status: 'inactive',
    updatedAt: '2026-04-25T14:10:00+07:00',
  },
]

export const adminBoutiqueRecords: AdminBoutiqueRecord[] = [
  {
    id: 'BTQ-001',
    name: 'Butik Simfoni Gold Bintaro',
    city: 'Tangerang Selatan',
    address: 'Jl. Boulevard Bintaro Jaya Blok Sektor 7 No. 12, Pondok Jaya, Tangerang Selatan',
    contactPhone: '021-5550-0123',
    googleMapsUrl: 'https://maps.google.com/?q=Bintaro+Jaya+Sektor+7',
    status: 'active',
    updatedAt: '2026-04-28T10:15:00+07:00',
  },
  {
    id: 'BTQ-002',
    name: 'Butik Simfoni Gold Menteng',
    city: 'Jakarta Pusat',
    address: 'Jl. Cikini Raya No. 88, Menteng, Jakarta Pusat',
    contactPhone: '021-3900-1188',
    googleMapsUrl: 'https://maps.google.com/?q=Cikini+Raya+88',
    status: 'active',
    updatedAt: '2026-04-27T16:40:00+07:00',
  },
  {
    id: 'BTQ-003',
    name: 'Butik Simfoni Gold Surabaya',
    city: 'Surabaya',
    address: 'Jl. Pemuda No. 21, Genteng, Surabaya',
    contactPhone: '031-9988-2211',
    googleMapsUrl: 'https://maps.google.com/?q=Jl+Pemuda+21+Surabaya',
    status: 'inactive',
    updatedAt: '2026-04-24T14:05:00+07:00',
  },
]

export const adminOrderRecords: AdminOrderRecord[] = [
  {
    id: 'ORD-20260420-0002',
    customerName: 'akhmad sufyan',
    customerEmail: 'mr.akhmadsufyan@gmail.com',
    customerPhone: '081293335764',
    primaryItem: 'Emas Batangan - 1 gram',
    itemCount: 3,
    totalAmount: 7015000,
    status: 'paid',
    paymentMethod: 'BRI Virtual Account',
    shippingMethod: 'JNE Express',
    trackingNumber: 'RESI-20260420-0002',
    requiresKtp: true,
    address: 'Pondok Pakulonan Blok H4 No 20 RT/RW 003/004, Paku Alam, Serpong Utara, Kota Tangerang Selatan, Banten 15325',
    createdAt: '2026-04-20T13:54:00+07:00',
    updatedAt: '2026-04-20T13:54:00+07:00',
  },
  {
    id: 'INV-20260426-001',
    customerName: 'Budi Santoso',
    customerEmail: 'budi.santoso@email.com',
    customerPhone: '0812-3456-8890',
    primaryItem: 'Antam Certicard 5 Gram',
    itemCount: 2,
    totalAmount: 12450000,
    status: 'pending',
    paymentMethod: 'Midtrans BCA VA',
    shippingMethod: 'JNE Regular',
    requiresKtp: true,
    address: 'Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan',
    createdAt: '2026-04-26T09:15:00+07:00',
    updatedAt: '2026-04-26T09:15:00+07:00',
  },
  {
    id: 'INV-20260426-002',
    customerName: 'Rina Maharani',
    customerEmail: 'rina.maharani@email.com',
    customerPhone: '0811-2222-4301',
    primaryItem: 'Kalung Luna 2 Gram',
    itemCount: 1,
    totalAmount: 5600000,
    status: 'paid',
    paymentMethod: 'Midtrans QRIS',
    shippingMethod: 'Self Pickup',
    requiresKtp: true,
    address: 'Jl. Setiabudi Tengah No. 5, Jakarta Selatan',
    createdAt: '2026-04-26T10:00:00+07:00',
    updatedAt: '2026-04-26T10:32:00+07:00',
  },
  {
    id: 'INV-20260426-003',
    customerName: 'Andi Wijaya',
    customerEmail: 'andi.wijaya@email.com',
    customerPhone: '0821-9966-1244',
    primaryItem: 'UBS 25 Gram',
    itemCount: 1,
    totalAmount: 28250000,
    status: 'processing',
    paymentMethod: 'Midtrans Mandiri VA',
    shippingMethod: 'Paxel Instant',
    requiresKtp: true,
    address: 'Jl. Tebet Raya No. 41, Jakarta Selatan',
    createdAt: '2026-04-26T11:45:00+07:00',
    updatedAt: '2026-04-26T13:00:00+07:00',
  },
  {
    id: 'INV-20260425-017',
    customerName: 'Salsabila Putri',
    customerEmail: 'salsabila.putri@email.com',
    customerPhone: '0857-1444-6610',
    primaryItem: 'Antam Certicard 10 Gram',
    itemCount: 2,
    totalAmount: 9800000,
    status: 'shipped',
    paymentMethod: 'Midtrans BNI VA',
    shippingMethod: 'J&T Express',
    trackingNumber: 'JTX-20260425-8890',
    requiresKtp: true,
    address: 'Jl. Arcamanik Endah No. 7, Bandung',
    createdAt: '2026-04-25T16:20:00+07:00',
    updatedAt: '2026-04-25T19:10:00+07:00',
  },
  {
    id: 'INV-20260424-014',
    customerName: 'Michael Hartono',
    customerEmail: 'michael.hartono@email.com',
    customerPhone: '0813-9001-4488',
    primaryItem: 'Koin Emas Merdeka 1 Gram',
    itemCount: 3,
    totalAmount: 15000000,
    status: 'cancelled',
    paymentMethod: 'Midtrans GoPay',
    shippingMethod: 'JNE Regular',
    requiresKtp: false,
    address: 'Jl. Gunawarman No. 18, Jakarta Selatan',
    createdAt: '2026-04-24T14:10:00+07:00',
    updatedAt: '2026-04-24T15:40:00+07:00',
  },
  {
    id: 'INV-20260423-009',
    customerName: 'Nadia Prameswari',
    customerEmail: 'nadia.prameswari@email.com',
    customerPhone: '0878-7032-4450',
    primaryItem: 'Antam Certicard 5 Gram',
    itemCount: 1,
    totalAmount: 9850000,
    status: 'delivered',
    paymentMethod: 'Midtrans Permata VA',
    shippingMethod: 'Pos Indonesia',
    trackingNumber: 'POS-20260423-1138',
    requiresKtp: true,
    address: 'Jl. Dipatiukur No. 89, Bandung',
    createdAt: '2026-04-23T09:55:00+07:00',
    updatedAt: '2026-04-24T10:15:00+07:00',
  },
  {
    id: 'INV-20260422-005',
    customerName: 'Dimas Rahman',
    customerEmail: 'dimas.rahman@email.com',
    customerPhone: '0819-8222-1123',
    primaryItem: 'Gelang Ziva 4 Gram',
    itemCount: 1,
    totalAmount: 7090000,
    status: 'refund',
    paymentMethod: 'Midtrans BCA VA',
    shippingMethod: 'Self Pickup',
    requiresKtp: true,
    address: 'Jl. Cikajang No. 21, Jakarta Selatan',
    createdAt: '2026-04-22T13:20:00+07:00',
    updatedAt: '2026-04-23T08:05:00+07:00',
  },
  {
    id: 'INV-20260420-002',
    customerName: 'Tasya Anindita',
    customerEmail: 'tasya.anindita@email.com',
    customerPhone: '0822-7765-0098',
    primaryItem: 'UBS 25 Gram',
    itemCount: 1,
    totalAmount: 46800000,
    status: 'completed',
    paymentMethod: 'Midtrans ShopeePay',
    shippingMethod: 'JNE YES',
    trackingNumber: 'JNE-20260420-0021',
    requiresKtp: true,
    address: 'Jl. Ahmad Yani No. 120, Surabaya',
    createdAt: '2026-04-20T10:40:00+07:00',
    updatedAt: '2026-04-27T10:40:00+07:00',
  },
]

export const adminOrderDetailRecords: Record<string, AdminOrderDetailRecord> = {
  'ORD-20260420-0002': {
    id: 'ORD-20260420-0002',
    customerName: 'akhmad sufyan',
    customerEmail: 'mr.akhmadsufyan@gmail.com',
    customerPhone: '081293335764',
    primaryItem: 'Emas Batangan - 1 gram',
    itemCount: 3,
    totalAmount: 7015000,
    status: 'paid',
    paymentMethod: 'BRI Virtual Account',
    shippingMethod: 'JNE Express',
    trackingNumber: 'RESI-20260420-0002',
    requiresKtp: true,
    address: 'Pondok Pakulonan Blok H4 No 20 RT/RW 003/004, Paku Alam, Serpong Utara, Kota Tangerang Selatan, Banten 15325',
    createdAt: '2026-04-20T13:54:00+07:00',
    updatedAt: '2026-04-20T13:54:00+07:00',
    subtotalAmount: 7100000,
    shippingFee: 30000,
    voucherAmount: 125000,
    grandTotalAmount: 7015000,
    lineItems: [
      {
        id: 'ORD-20260420-0002-1',
        productName: 'Emas Batangan - 1 gram',
        quantity: 2,
        unitPrice: 2840000,
        totalPrice: 5680000,
      },
      {
        id: 'ORD-20260420-0002-2',
        productName: 'Emas Batangan - 0.5 gram',
        quantity: 1,
        unitPrice: 1420000,
        totalPrice: 1420000,
      },
    ],
    customerDetail: {
      name: 'akhmad sufyan',
      phone: '081293335764',
      email: 'mr.akhmadsufyan@gmail.com',
    },
    recipientDetail: {
      name: 'Akhmad Sufyan',
      phone: '+6281293335764',
      email: 'mr.akhmadsufyan@gmail.com',
      province: 'BANTEN',
      city: 'KOTA TANGERANG SELATAN',
      district: 'SERPONG UTARA',
      village: 'PAKU ALAM',
      address: 'Pondok Pakulonan Blok H4 No 20 RT/RW 003/004',
      postalCode: '15325',
      ktpDocumentLabel: 'KTP Pembeli',
    },
    receiptCode: 'RESI-20260420-0002',
    receiptCreatedAt: '2026-04-20T13:54:00+07:00',
    receiptUpdatedAt: '2026-04-20T13:54:00+07:00',
    fulfillmentDetail: {
      method: 'delivery',
      courier: 'JNE',
      serviceLabel: 'Express',
      note: 'Barang dikirim ke alamat penerima setelah pembayaran tervalidasi.',
    },
    timeline: [
      {
        id: 'ord-20260420-0002-created',
        title: 'Order dibuat',
        description: 'Pesanan masuk dari website dan invoice berhasil diterbitkan.',
        occurredAt: '2026-04-20T13:54:00+07:00',
        tone: 'info',
      },
      {
        id: 'ord-20260420-0002-paid',
        title: 'Pembayaran diterima',
        description: 'Pembayaran BRI Virtual Account terverifikasi dan status menjadi Paid.',
        occurredAt: '2026-04-20T13:54:00+07:00',
        tone: 'success',
      },
      {
        id: 'ord-20260420-0002-label',
        title: 'Label pengiriman dibuat',
        description: 'Resi dan barcode pengiriman JNE Express sudah tersedia untuk proses fulfillment.',
        occurredAt: '2026-04-20T13:54:00+07:00',
        tone: 'info',
      },
    ],
  },
  'INV-20260426-002': {
    id: 'INV-20260426-002',
    customerName: 'Rina Maharani',
    customerEmail: 'rina.maharani@email.com',
    customerPhone: '0811-2222-4301',
    primaryItem: 'Kalung Luna 2 Gram',
    itemCount: 1,
    totalAmount: 5600000,
    status: 'paid',
    paymentMethod: 'Midtrans QRIS',
    shippingMethod: 'Self Pickup',
    requiresKtp: true,
    address: 'Butik Simfoni Gold, Jl. Boulevard Bintaro Jaya Blok Sektor 7 No. 12, Tangerang Selatan',
    createdAt: '2026-04-26T10:00:00+07:00',
    updatedAt: '2026-04-26T10:32:00+07:00',
    subtotalAmount: 5700000,
    shippingFee: 0,
    voucherAmount: 100000,
    grandTotalAmount: 5600000,
    lineItems: [
      {
        id: 'INV-20260426-002-1',
        productName: 'Kalung Luna 2 Gram',
        quantity: 1,
        unitPrice: 5700000,
        totalPrice: 5700000,
      },
    ],
    customerDetail: {
      name: 'Rina Maharani',
      phone: '0811-2222-4301',
      email: 'rina.maharani@email.com',
    },
    recipientDetail: {
      name: 'Rina Maharani',
      phone: '0811-2222-4301',
      email: 'rina.maharani@email.com',
      province: 'BANTEN',
      city: 'KOTA TANGERANG SELATAN',
      district: 'PONDOK AREN',
      village: 'PONDOK JAYA',
      address: 'Pengambilan dilakukan di butik',
      postalCode: '15220',
      ktpDocumentLabel: 'KTP Pembeli untuk verifikasi saat pickup',
    },
    receiptCode: 'PICKUP-20260426-0002',
    receiptCreatedAt: '2026-04-26T10:32:00+07:00',
    receiptUpdatedAt: '2026-04-26T10:32:00+07:00',
    fulfillmentDetail: {
      method: 'self_pickup',
      boutiqueName: 'Butik Simfoni Gold Bintaro',
      boutiqueAddress: 'Jl. Boulevard Bintaro Jaya Blok Sektor 7 No. 12, Tangerang Selatan',
      pickupCode: 'PICKUP-20260426-0002',
      pickupWindow: '26 April 2026 pukul 16.00 - 20.00 WIB',
      contactPerson: 'Tim Boutique: 021-5550-0123',
      note: 'Customer wajib menunjukkan kode pickup dan KTP asli saat pengambilan.',
    },
    timeline: [
      {
        id: 'inv-20260426-002-created',
        title: 'Order dibuat',
        description: 'Pesanan self pickup berhasil dibuat melalui website.',
        occurredAt: '2026-04-26T10:00:00+07:00',
        tone: 'info',
      },
      {
        id: 'inv-20260426-002-paid',
        title: 'Pembayaran diterima',
        description: 'Pembayaran QRIS terverifikasi dan order siap diproses butik.',
        occurredAt: '2026-04-26T10:32:00+07:00',
        tone: 'success',
      },
      {
        id: 'inv-20260426-002-ready',
        title: 'Siap diambil di butik',
        description: 'Tim butik menyiapkan barang dan mengirim kode pickup ke customer.',
        occurredAt: '2026-04-26T11:15:00+07:00',
        tone: 'info',
      },
    ],
  },
}

export const adminVoucherRecords: AdminVoucherRecord[] = [
  {
    id: 'VCR-001',
    code: 'EMASHEMAT10',
    title: 'Diskon 10% Belanja Pertama',
    discountType: 'percentage',
    amount: 10,
    minPurchase: 2500000,
    maxDiscount: 500000,
    usageLimit: 300,
    usageCount: 188,
    perCustomerLimit: 1,
    applyTo: 'Semua produk',
    productIds: ['PRD-001', 'PRD-002'],
    startDate: '2026-04-20T00:00:00+07:00',
    endDate: '2026-05-10T23:59:59+07:00',
    status: 'active',
  },
  {
    id: 'VCR-002',
    code: 'LMWEEKEND250',
    title: 'Potongan Rp250.000 Weekend',
    discountType: 'fixed',
    amount: 250000,
    minPurchase: 5000000,
    maxDiscount: null,
    usageLimit: 120,
    usageCount: 44,
    perCustomerLimit: 1,
    applyTo: 'Kategori Logam Mulia',
    productIds: ['PRD-001', 'PRD-003'],
    startDate: '2026-04-26T00:00:00+07:00',
    endDate: '2026-05-03T23:59:59+07:00',
    status: 'active',
  },
  {
    id: 'VCR-003',
    code: 'PICKUPHEMAT',
    title: 'Voucher Self Pickup',
    discountType: 'fixed',
    amount: 100000,
    minPurchase: 1500000,
    maxDiscount: null,
    usageLimit: 500,
    usageCount: 80,
    perCustomerLimit: 2,
    applyTo: 'Checkout Self Pickup',
    productIds: ['PRD-004'],
    startDate: '2026-05-01T00:00:00+07:00',
    endDate: '2026-05-31T23:59:59+07:00',
    status: 'inactive',
  },
  {
    id: 'VCR-004',
    code: 'LEBARANBUNDLING',
    title: 'Campaign Lebaran Bundling',
    discountType: 'percentage',
    amount: 12,
    minPurchase: 7500000,
    maxDiscount: 800000,
    usageLimit: 200,
    usageCount: 200,
    perCustomerLimit: 1,
    applyTo: 'Produk dan kategori terpilih',
    productIds: ['PRD-002', 'PRD-003', 'PRD-004'],
    startDate: '2026-03-18T00:00:00+07:00',
    endDate: '2026-04-15T23:59:59+07:00',
    status: 'expired',
  },
]

export const adminArticleRecords: AdminArticleRecord[] = [
  {
    id: 'ART-001',
    slug: 'mengapa-emas-safe-haven',
    title: 'Mengapa Emas Adalah "Safe Haven" Terbaik?',
    thumbnailUrl: '/images/banner-1.png',
    contentHtml: '<h2>Mengapa emas penting?</h2><p>Emas menjadi salah satu instrumen investasi yang paling stabil dalam jangka panjang. Saat kondisi ekonomi bergejolak, investor cenderung mencari aset yang tahan nilai.</p><p>Karena itu, emas sering dianggap sebagai safe haven yang dapat menjaga daya beli dan memberikan rasa aman bagi portofolio.</p>',
    publishedAt: '2026-04-24T09:00:00+07:00',
    status: 'active',
  },
  {
    id: 'ART-002',
    slug: 'strategi-dollar-cost-averaging',
    title: 'Strategi Dollar Cost Averaging Pada Emas',
    thumbnailUrl: '/images/banner-2.png',
    contentHtml: '<h2>Investasi rutin</h2><p>Dollar Cost Averaging pada emas membantu investor membeli secara berkala tanpa harus menebak harga terbaik.</p><ul><li>Disiplin bulanan</li><li>Risiko harga lebih merata</li><li>Cocok untuk investor pemula</li></ul>',
    publishedAt: '2026-04-22T11:30:00+07:00',
    status: 'active',
  },
  {
    id: 'ART-003',
    slug: 'verifikasi-sertifikat-antam',
    title: 'Verifikasi Keaslian Sertifikat Antam',
    thumbnailUrl: '/images/banner-3.jpg',
    contentHtml: '<h2>Langkah verifikasi</h2><p>Pastikan produk dilengkapi sertifikat resmi dan cek fitur keamanan kemasannya. Edukasi pelanggan soal keaslian membantu meningkatkan trust pada brand.</p>',
    publishedAt: '2026-04-18T14:15:00+07:00',
    status: 'inactive',
  },
]

export function formatAdminDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatAdminDateShort(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateRange(startDate: string, endDate: string) {
  return `${formatAdminDateShort(startDate)} - ${formatAdminDateShort(endDate)}`
}

export function getOrderBadgeVariant(status: OrderStatus) {
  switch (status) {
    case 'unpaid':
      return 'unpaid'
    case 'pending':
      return 'pending'
    case 'paid':
      return 'paid'
    case 'success':
      return 'success'
    case 'processing':
      return 'processing'
    case 'shipped':
    case 'delivered':
    case 'completed':
    case 'selesai':
      return 'success'
    case 'refund':
      return 'refund'
    case 'cancelled':
    case 'canceled':
      return 'cancelled'
    default:
      return 'neutral'
  }
}

export function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case 'unpaid':
      return 'Unpaid'
    case 'pending':
      return 'Pending'
    case 'paid':
      return 'Paid'
    case 'success':
      return 'Success'
    case 'processing':
      return 'Paid'
    case 'shipped':
    case 'delivered':
      return 'Success'
    case 'completed':
    case 'selesai':
      return 'Success'
    case 'refund':
      return 'Refund'
    case 'cancelled':
    case 'canceled':
      return 'Canceled'
    default:
      return status
  }
}

export function getAdminOrderDetailRecord(orderId: string): AdminOrderDetailRecord | null {
  const detailedRecord = adminOrderDetailRecords[orderId]

  if (detailedRecord) {
    return detailedRecord
  }

  const baseRecord = adminOrderRecords.find((order) => order.id === orderId)

  if (!baseRecord) {
    return null
  }

  const safeItemCount = Math.max(baseRecord.itemCount, 1)
  const fallbackUnitPrice = Math.round(baseRecord.totalAmount / safeItemCount)

  return {
    ...baseRecord,
    subtotalAmount: baseRecord.totalAmount,
    shippingFee: 0,
    voucherAmount: 0,
    grandTotalAmount: baseRecord.totalAmount,
    lineItems: [
      {
        id: `${baseRecord.id}-item-1`,
        productName: baseRecord.primaryItem,
        quantity: baseRecord.itemCount,
        unitPrice: fallbackUnitPrice,
        totalPrice: baseRecord.totalAmount,
      },
    ],
    customerDetail: {
      name: baseRecord.customerName,
      phone: baseRecord.customerPhone,
      email: baseRecord.customerEmail,
    },
    recipientDetail: {
      name: baseRecord.customerName,
      phone: baseRecord.customerPhone,
      email: baseRecord.customerEmail,
      province: '-',
      city: '-',
      district: '-',
      village: '-',
      address: baseRecord.address,
      postalCode: '-',
      ktpDocumentLabel: baseRecord.requiresKtp ? 'Dokumen KTP tersedia' : 'KTP tidak diwajibkan',
    },
    receiptCode: baseRecord.trackingNumber ?? '-',
    receiptCreatedAt: baseRecord.createdAt,
    receiptUpdatedAt: baseRecord.updatedAt,
    fulfillmentDetail: {
      method: baseRecord.shippingMethod.toLowerCase().includes('self pickup') ? 'self_pickup' : 'delivery',
      courier: baseRecord.shippingMethod.toLowerCase().includes('self pickup') ? undefined : baseRecord.shippingMethod,
      serviceLabel: baseRecord.shippingMethod.toLowerCase().includes('self pickup') ? undefined : baseRecord.shippingMethod,
      boutiqueName: baseRecord.shippingMethod.toLowerCase().includes('self pickup') ? 'Butik Simfoni Gold' : undefined,
      boutiqueAddress: baseRecord.shippingMethod.toLowerCase().includes('self pickup') ? baseRecord.address : undefined,
      pickupCode: baseRecord.shippingMethod.toLowerCase().includes('self pickup') ? baseRecord.id : undefined,
      pickupWindow: baseRecord.shippingMethod.toLowerCase().includes('self pickup') ? formatAdminDate(baseRecord.updatedAt) : undefined,
      note: baseRecord.shippingMethod.toLowerCase().includes('self pickup')
        ? 'Customer menunjukkan identitas saat pengambilan.'
        : 'Barang dikirim menggunakan ekspedisi yang dipilih customer.',
    },
    timeline: [
      {
        id: `${baseRecord.id}-created`,
        title: 'Order dibuat',
        description: 'Pesanan tercatat di sistem admin.',
        occurredAt: baseRecord.createdAt,
        tone: 'info',
      },
      {
        id: `${baseRecord.id}-updated`,
        title: 'Status terakhir diperbarui',
        description: `Status order saat ini adalah ${baseRecord.status}.`,
        occurredAt: baseRecord.updatedAt,
        tone: 'success',
      },
    ],
  }
}
