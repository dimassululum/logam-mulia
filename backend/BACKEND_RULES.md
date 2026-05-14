# Backend Development Rules

Dokumen ini menjadi aturan kerja backend untuk project Logam Mulia E-Commerce. Tujuannya sederhana: setiap feature baru harus terasa konsisten dengan backend yang sudah ada, mudah dibaca, dan aman untuk dilanjutkan bertahap.

## 1. Source of Truth

- Ikuti `database_backend_plan.md` untuk urutan prioritas, rancangan endpoint, dan business rules.
- Ikuti `prisma/schema.prisma` untuk struktur data final. Jangan membuat shape data sendiri di service kalau model Prisma sudah menyediakan relasi/field-nya.
- Ikuti pola feature yang sudah ada: `auth`, `products`, `categories`, `boutique`, `articles`, dan `company-profile`.
- Setiap perubahan schema wajib lewat migration Prisma, bukan edit database manual.

## 2. Struktur Feature Wajib

Setiap feature baru dibuat dengan struktur ini:

```text
backend/src/features/<feature>/
├── routes/
│   └── <feature>.routes.ts
├── controller/
│   └── <feature>.controller.ts
├── service/
│   └── <feature>.service.ts
└── schema/
    └── <feature>.schema.ts
```

Aturan naming:

- Folder feature pakai kebab-case atau plural sesuai route publiknya, contoh `company-profile`, `products`, `vouchers`.
- File pakai format `<feature>.routes.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, `<feature>.schema.ts`.
- Prisma model tetap singular PascalCase, contoh `Voucher`, `VoucherUsage`.
- Database table di Prisma pakai `@@map("snake_case_plural")`.
- Endpoint API default pakai plural: `/api/products`, `/api/categories`, `/api/vouchers`. Untuk feature yang sudah terlanjur singular seperti `/api/boutique`, tetap ikuti yang sudah ada.

## 3. Tanggung Jawab Tiap Layer

### Routes

Routes hanya boleh mengatur:

- HTTP method dan path.
- Urutan middleware: `authenticate`, role middleware, `validate`, `upload`, lalu controller.
- Pemisahan public route dan protected/admin route.
- Urutan route spesifik sebelum route parameter. Contoh `/validate` harus didefinisikan sebelum `/:id`.

Routes tidak boleh berisi Prisma query atau business logic.

### Controller

Controller hanya boleh mengatur:

- Ambil data dari `req.params`, `req.query`, `req.body`, `req.file`, dan `req.user`.
- Convert query string sederhana jika belum divalidasi schema.
- Panggil service.
- Kirim response dengan `sendSuccess`.

Controller tidak boleh:

- Memanggil Prisma langsung.
- Menghitung business rule inti seperti diskon, stok, status order, atau limit voucher.
- Membuat format response manual kecuali benar-benar khusus.

### Service

Service menjadi tempat utama untuk:

- Prisma query dan transaksi database.
- Validasi business rule lintas tabel.
- Perhitungan domain, contoh diskon voucher, stok produk, status order.
- Throw error domain dengan `NotFoundError`, `BadRequestError`, `ConflictError`, `UnauthorizedError`, atau `ForbiddenError`.

Service tidak boleh menerima object Express seperti `Request` atau `Response`.

### Schema

Schema memakai Zod untuk:

- Body create/update.
- Query yang kompleks.
- Params yang perlu format ketat.

Export type dari schema dengan `z.infer`, lalu pakai type itu di service. Contoh:

```ts
export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>;
```

## 4. Response API

Semua response sukses wajib lewat `sendSuccess` dari `core/utils/response.ts`.

Format sukses:

```json
{
  "success": true,
  "message": "Voucher berhasil dibuat",
  "data": {}
}
```

List dengan pagination wajib menyertakan `meta` dari helper `paginate`.

Format error ditangani oleh global error handler. Jangan membuat `try/catch` di controller hanya untuk return error biasa. Throw error dari service dan biarkan `errorHandler` memprosesnya.

## 5. Error Handling

Gunakan error class yang sudah ada:

- `NotFoundError` untuk data tidak ditemukan.
- `BadRequestError` untuk input valid tapi melanggar aturan bisnis.
- `ConflictError` untuk unique conflict atau data tidak boleh dihapus karena masih dipakai.
- `UnauthorizedError` untuk token/login bermasalah.
- `ForbiddenError` untuk role tidak punya akses.

Gunakan `try/catch` hanya jika:

- Perlu translate error dari service eksternal seperti Midtrans/RajaOngkir/email.
- Perlu rollback/cleanup manual di luar transaksi Prisma.
- Perlu logging tambahan sebelum error dilempar lagi.

## 6. Auth dan Role

- Public endpoint tidak memakai `authenticate`.
- Customer endpoint memakai `authenticate`.
- Admin endpoint memakai `authenticate, isAdmin`.
- Super Admin endpoint memakai `authenticate, isSuperAdmin`.
- Jangan membaca user dari body untuk resource yang terkait user login. Ambil dari `req.user.userId`.
- Endpoint admin boleh menerima user id target dari params/query/body jika memang sedang mengelola data orang lain.

## 7. Pagination, Filter, Search

Untuk endpoint list:

- Pakai `parsePagination(req.query as any)` di controller.
- Default page = `1`, limit = `20`, maksimum limit = `100`.
- Service mengembalikan `{ total, <items> }`.
- Query list yang butuh total gunakan `Promise.all([count, findMany])`.
- Search text di PostgreSQL pakai `contains` + `mode: 'insensitive'` seperti pola produk/artikel.
- Sort default harus stabil, biasanya `createdAt: 'desc'` atau field khusus seperti `sortOrder`.

## 8. Prisma dan Database

- Semua akses database lewat singleton `prisma` dari `core/config/database.ts`.
- Gunakan `include/select` secukupnya. Jangan return relasi besar kalau frontend tidak butuh.
- Untuk operasi multi-step yang harus atomik, pakai `prisma.$transaction`.
- Decimal Prisma harus diperlakukan hati-hati. Input angka dari API boleh number, tapi kalkulasi uang harus jelas dan tidak bercampur string.
- Snapshot data order wajib disimpan di `OrderItem` seperti `productName`, `productImage`, dan `priceAtPurchase`.
- Jangan hapus data yang sudah menjadi histori transaksi kecuali ada alasan kuat. Untuk catalog, soft delete lebih aman.

## 9. Slug dan Unique Data

- Feature yang punya slug wajib cek conflict saat create.
- Saat update, cek slug baru hanya jika slug berubah.
- Pesan conflict harus spesifik, contoh `Produk dengan slug tersebut sudah ada`.
- Jangan bergantung hanya pada error Prisma `P2002` kalau bisa memberi pesan domain yang lebih ramah.

## 10. Upload File

- Gunakan `upload` dari `core/middlewares/upload.middleware.ts`.
- Field name harus eksplisit di route, contoh `upload.single('image')` atau `upload.single('cover')`.
- File upload hanya untuk tipe yang diizinkan middleware: JPG, PNG, WebP.
- Controller membentuk URL file, service menyimpan URL ke database.
- Untuk folder khusus seperti KTP/product/banner, lebih baik extend upload middleware secara terarah daripada membuat konfigurasi multer terpisah di feature.

## 11. Delete Policy

Pilih delete behavior berdasarkan dampak data:

- Produk utama: soft delete dengan `isActive = false`.
- Data yang masih punya child penting: tolak delete dengan `ConflictError`.
- CMS sederhana seperti artikel atau boutique boleh hard delete jika belum dipakai histori transaksi.
- Voucher sebaiknya soft delete/deactivate dengan `isActive = false`, karena usage dan order butuh histori.

## 12. External Service

- Konfigurasi secret/base URL tetap di `core/config/env.ts`.
- Wrapper client eksternal diletakkan di `core/config` atau service feature jika hanya dipakai satu domain.
- Jangan menaruh API key langsung di feature.
- Handler webhook harus idempotent, bisa dipanggil lebih dari sekali tanpa menggandakan efek seperti pengurangan stok atau penambahan usage.

## 13. Register Feature Baru

Checklist saat menambah feature:

- Tambahkan model/field di `prisma/schema.prisma` jika perlu.
- Buat migration Prisma.
- Buat folder feature dengan `routes`, `controller`, `service`, `schema`.
- Daftarkan route di `core/server.ts`.
- Pakai `sendSuccess`, `paginate`, dan error class standar.
- Tambahkan auth/role sesuai endpoint plan.
- Jalankan `npm run build` dari folder `backend`.
- Lakukan smoke test endpoint minimal untuk create/list/detail/update/delete atau flow utama feature.

## 14. Checklist Khusus Voucher

Saat mulai backend voucher, ikuti kontrak ini:

Endpoint:

- `POST /api/vouchers/validate` untuk customer/admin yang login.
- `GET /api/vouchers` untuk admin list voucher.
- `GET /api/vouchers/:id` untuk admin detail voucher jika dibutuhkan frontend.
- `POST /api/vouchers` untuk admin create.
- `PUT /api/vouchers/:id` untuk admin update.
- `DELETE /api/vouchers/:id` untuk admin deactivate, bukan hard delete.

Business rules validasi voucher:

- Code disimpan uppercase dan dibandingkan uppercase.
- Voucher harus exist dan `isActive = true`.
- Jika `startsAt` ada, voucher belum boleh dipakai sebelum waktu itu.
- Jika `expiresAt` ada, voucher tidak boleh dipakai setelah waktu itu.
- Jika `usageLimit` ada, `usageCount` tidak boleh mencapai limit.
- `perUserLimit` dicek lewat `VoucherUsage`.
- `subtotal` harus memenuhi `minPurchase`.
- `PERCENTAGE` menghitung diskon dari subtotal dan dibatasi `maxDiscount` jika ada.
- `FIXED` tidak boleh membuat diskon lebih besar dari subtotal.
- Response validate harus mengembalikan voucher ringkas, `discountAmount`, dan `finalAmount`.

Data integrity voucher:

- Saat order sukses memakai voucher, update `usageCount` dan create `VoucherUsage` dalam transaksi yang sama dengan order/payment flow.
- Jangan menambah `usageCount` hanya dari endpoint `/validate`.
- Jangan hard delete voucher yang sudah pernah dipakai order.
- Jika nanti checkout guest didukung, voucher usage per user perlu aturan tambahan sebelum perUserLimit bisa diterapkan penuh.

## 15. Definition of Done Backend Feature

Feature dianggap selesai kalau:

- Struktur file sesuai aturan.
- Semua input mutasi divalidasi Zod.
- Semua endpoint protected memakai middleware auth/role yang benar.
- Response sukses/error konsisten.
- Tidak ada Prisma query di controller.
- `npm run build` berhasil.
- Endpoint utama sudah di-smoke-test.
- Tidak ada perubahan tidak terkait yang ikut disentuh.
