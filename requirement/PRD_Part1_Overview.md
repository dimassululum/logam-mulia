# PRD - Toko Emas Online (E-Commerce)
## Part 1: Project Overview

---

> [!NOTE]
> Dokumen ini adalah PRD untuk keperluan **development**, bukan pitching. Fokus pada spesifikasi teknis dan fungsional.

---

## 1. Executive Summary

### 1.1 Product Vision

Membangun platform e-commerce untuk toko emas/logam mulia yang mengintegrasikan **pengalaman belanja online** dengan **operasional toko fisik** yang sudah berjalan. Platform ini menggantikan website lama yang discontinued, dengan fokus utama pada **automasi pembayaran** melalui Midtrans — menggantikan proses transfer manual yang menjadi bottleneck operasional.

Website menjadi **channel penjualan utama online** yang melengkapi 1 outlet fisik, memungkinkan toko menjangkau pelanggan luar area dengan pengalaman belanja aman, terpercaya, dan profesional.

### 1.2 Business Goals

| # | Goal | Metric Target |
|---|------|---------------|
| 1 | Automate payment | 90% transaksi via Midtrans |
| 2 | Expand market reach | Customer luar kota bisa order |
| 3 | Reduce ops overhead | Admin processing < 5 menit/order |
| 4 | Build online presence | SEO-ready + company profile |
| 5 | Increase repeat purchase | Member system + promo/voucher |

### 1.3 Success Metrics (Post-Launch)

**Quantitative:**
- Conversion rate ≥ 2%
- Payment success rate ≥ 95%
- Order processing time < 24 jam
- Uptime ≥ 99%
- Page load < 3 detik

**Qualitative:**
- Customer checkout tanpa bantuan admin
- Admin manage semua dari 1 dashboard
- Owner update harga & stok sendiri

---

## 2. Problem Statement

### 2.1 Current Pain Points

| Problem | Impact | Severity |
|---------|--------|----------|
| Payment manual (transfer → konfirmasi) | Delay 1-24 jam, human error | 🔴 Critical |
| Tidak ada website aktif | Kehilangan channel online | 🔴 Critical |
| Order via chat (WA/manual) | Tidak tercatat, rentan missed | 🟡 High |
| Tidak ada sistem member | Tidak bisa retarget customer | 🟡 High |
| Harga update manual | Tidak real-time, effort tinggi | 🟢 Medium |

### 2.2 Solution

```
BEFORE                              AFTER
──────                              ─────
Chat WA                  →          Browse & order via website
Transfer manual          →          Payment gateway (Midtrans)
Tracking via chat        →          Real-time order status
Harga broadcast manual   →          Harga di website (admin CMS)
Tidak ada data customer  →          Member system + history
Tidak ada review         →          Review & rating system
```

---

## 3. Target Users & Personas

### Persona 1: 🧑‍💼 Investor Emas (Primary)
- **Demografis**: 30-55 tahun, middle-upper income
- **Behavior**: Beli batangan sebagai investasi, repeat buyer
- **Needs**: Harga transparan, proses cepat & aman
- **Frequency**: 1-4x/bulan

### Persona 2: 💍 Pembeli Perhiasan (Secondary)
- **Demografis**: Wanita, 25-50 tahun
- **Behavior**: Beli perhiasan untuk dipakai/hadiah, browsing-heavy
- **Needs**: Foto detail, filter kategori/kadar, review
- **Frequency**: 1-2x/3 bulan

### Persona 3: 🔄 Repeat Customer
- **Demografis**: Existing customer toko fisik
- **Needs**: Kemudahan reorder, promo loyalty, pickup di toko
- **Frequency**: Regular

### Persona 4: 🛡️ Admin/Owner (Internal)
- **Needs**: Dashboard simpel, notifikasi order, bulk update
- **Goal**: Efisiensi operasional dari 1 tempat

---

## 4. Scope & Boundaries

### 4.1 In Scope (MVP)
- ✅ Product catalog (multi-foto, kategori)
- ✅ Shopping cart & checkout
- ✅ Member registration & login
- ✅ Payment gateway (Midtrans Snap)
- ✅ Order management (full lifecycle)
- ✅ Shipping (Raja Ongkir + manual + self pickup)
- ✅ Admin CMS (products, orders, categories, promo, voucher)
- ✅ Company profile (editable CMS)
- ✅ Review & rating (verified buyer)
- ✅ Email notifications
- ✅ KTP upload (compliance)
- ✅ Manual price & stock update
- ✅ Basic admin permissions
- ✅ Responsive (mobile-first)

### 4.2 Out of Scope (Future Phases)
- ❌ Real-time gold price API (Phase 2)
- ❌ Buyback/trade-in (Phase 2)
- ❌ Cicilan payment (Phase 2)
- ❌ Native mobile app
- ❌ Multi-outlet/warehouse
- ❌ Loyalty points (Phase 2)
- ❌ Live chat (Phase 2)
- ❌ Multi-language
- ❌ Advanced analytics (Phase 2)
- ❌ Sertifikat emas digital
- ❌ Auction/bidding
- ❌ B2B/wholesale pricing

> [!IMPORTANT]
> **Core Value**: Automasi payment (manual → Midtrans) HARUS sempurna di MVP. Fitur lain bisa simplified tapi payment flow harus robust.
