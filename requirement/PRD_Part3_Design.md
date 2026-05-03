# PRD - Toko Emas Online
## Part 3: Frontend Design PRD

Status: Active  
Last updated: 2026-04-28  
Scope: `frontend/`  
Supersedes: versi design PRD sebelumnya yang masih terlalu konseptual dan belum selaras dengan codebase saat ini.

---

## 1. Purpose

Dokumen ini menjadi **source of truth utama** untuk pengembangan frontend Skripsi-Finance ke depan.

Tujuan dokumen ini:

- menyelaraskan design direction dengan implementasi React/Next.js yang sudah ada;
- menetapkan aturan design system, layout, dan componentization yang wajib diikuti;
- membedakan dengan jelas antara pattern yang **sudah resmi**, yang **masih sementara**, dan yang **belum boleh dijadikan acuan**;
- mengurangi inkonsistensi styling antar halaman customer, flow transaksional, dan admin.

Jika ada konflik antara mock lama, ide ad-hoc, dan implementasi baru, maka **dokumen ini yang menang** kecuali ada keputusan revisi eksplisit.

---

## 2. Current Product Surface

### 2.1 Customer routes yang sudah ada

| Area | Route |
|------|-------|
| Home | `/` |
| Product listing | `/products` |
| Product detail | `/products/[slug]` |
| Cart | `/cart` |
| Checkout email lookup | `/checkout/email` |
| Checkout | `/checkout` |
| Payment | `/payment` |
| Payment success | `/payment/success` |
| Account home | `/account` |
| Account profile | `/account/profile` |
| Account profile edit | `/account/profile/edit` |
| Boutiques | `/boutiques` |
| Articles | `/articles/[id]` |
| Auth | `/login`, `/register` |

### 2.2 Admin routes yang sudah ada

| Area | Route | Status |
|------|-------|--------|
| Dashboard | `/admin` | implemented |
| Orders detail | `/admin/orders/[id]` | implemented with mock data |
| Products | `/admin/products` | placeholder shell |
| New product | `/admin/products/new` | route exists |
| Orders | `/admin/orders` | placeholder shell |
| Categories | `/admin/categories` | placeholder shell |
| Members | `/admin/members` | placeholder shell |
| Promos | `/admin/promos` | placeholder shell |
| Vouchers | `/admin/vouchers` | placeholder shell |
| Company profile | `/admin/company-profile` | placeholder shell |
| Admins | `/admin/admins` | placeholder shell |
| Costs | `/admin/costs` | placeholder shell |
| Settings | `/admin/settings` | placeholder shell |

### 2.3 Design implication

PRD ini harus mengikuti realita bahwa aplikasi sekarang terdiri dari 3 level kematangan:

1. halaman customer yang sudah cukup visual dan interaktif;
2. flow transaksi yang sudah punya reusable primitives;
3. admin area yang fondasinya sudah baik, tetapi banyak screen masih placeholder.

Artinya, **source of truth pattern** kita harus fokus ke struktur, token, dan reusable component, bukan ke isi placeholder.

---

## 3. Product Experience Principles

Frontend harus terasa:

- **trusted**: visual rapi, stabil, dan tidak ramai;
- **premium**: aksen emas dipakai sebagai penekanan, bukan warna dominan di seluruh permukaan;
- **task-focused**: flow beli, bayar, dan admin harus cepat dipahami;
- **mobile-first**: mayoritas shopping flow harus enak dipakai di layar kecil;
- **coded intentionally**: pattern yang sama harus lahir dari primitive/component yang sama, bukan utility class copy-paste.

Prinsip coding turunan:

- jika UI yang sama muncul 2 kali atau lebih, mulai ekstraksi ke shared component;
- jika styling panjang dipakai berulang, pindahkan ke semantic wrapper/component, bukan diulang manual;
- page boleh ekspresif, tapi primitive dasarnya harus tetap sama.

---

## 4. Information Architecture

### 4.1 Shell taxonomy

Frontend dibagi menjadi 3 shell utama.

#### A. Marketplace shell

Dipakai untuk halaman browsing customer.

- top navigation: `Navbar`
- bottom mobile navigation: **tidak dipakai untuk guest checkout model**
- content area: customer main content
- footer: **opsional per page**, belum menjadi global shell

Contoh:

- `/`
- `/products`
- `/boutiques`
- `/articles/[id]`

Catatan keputusan terbaru: customer tidak diwajibkan register atau sign in. Karena itu `BottomBar` tidak lagi menjadi navigasi default customer, terutama karena menu pesanan dan profil tidak relevan tanpa akun.

#### B. Focused flow shell

Dipakai untuk halaman yang butuh fokus tinggi dan minim distraksi.

- top bar: `AppBar`
- tanpa navbar penuh
- tanpa bottom navigation umum
- boleh punya sticky action footer sendiri

Contoh:

- `/cart`
- `/checkout/email`
- `/checkout`
- `/payment`
- `/payment/success`
- `/account`
- `/account/profile`
- `/account/profile/edit`

#### C. Admin shell

Dipakai untuk seluruh route `/admin`.

- wrapper utama: `AdminShell`
- sidebar: `AdminSidebar`
- topbar: `AdminTopbar`
- content container responsif

### 4.2 Navigation rules

- `Navbar` tidak boleh dipakai bersamaan di halaman flow yang sudah memakai `AppBar`.
- `BottomBar` tidak dipakai pada customer shell selama model produk masih guest checkout.
- `AppBar` adalah standar untuk flow page customer yang fokus pada satu tugas.
- `Footer` saat ini dianggap page-level module, bukan global default.
- sticky CTA bawah hanya dipakai bila aksi utama memang perlu selalu terlihat pada mobile.

### 4.3 Route alignment note

Beberapa asumsi PRD lama tidak lagi akurat. Contohnya:

- belum semua route customer lama benar-benar ada;
- admin screens banyak yang masih scaffolding;
- navigasi dan pattern saat ini lebih kuat daripada daftar wireframe lama.

Mulai sekarang, route inventory di atas adalah referensi utama untuk design planning.

---

## 5. Visual System

### 5.1 Brand direction

Visual brand saat ini adalah **luxury-trust minimalism**:

- navy gelap untuk anchor, struktur, dan sense of authority;
- gold untuk CTA, highlight, dan premium accent;
- surface terang untuk readability;
- serif hanya untuk headline penting;
- body copy tetap clean dan modern.

### 5.2 Color tokens

Gunakan token yang sudah hidup di `tailwind.config.ts`. Jangan bikin hex baru kalau token setara sudah tersedia.

#### Primary accents

| Token | Usage |
|------|-------|
| `gold-400` | CTA utama, highlight aktif, accent premium |
| `gold-500` | pressed / deeper gold usage |
| `gold-600` | strong accent text |
| `gold-50` / `gold-100` | selected state background, soft callout |

#### Core neutrals

| Token | Usage |
|------|-------|
| `navy-900` | header dark base, text kuat, dark shell |
| `navy-700` | text body kuat |
| `navy-600` | secondary text |
| `navy-500` | tertiary/meta text |
| `navy-200` / `navy-100` | border, surface divider |
| `navy-50` | muted section background |
| `white` | base card surface |

#### Semantic

| Token | Usage |
|------|-------|
| `success` / emerald palette | status sukses |
| `warning` / amber-yellow palette | pending / warning |
| `info` / blue palette | proses / info |
| `error` / red palette | destructive / gagal |

### 5.3 Typography

| Role | Font |
|------|------|
| Headings | `font-heading` = Playfair Display |
| Body | `font-body` = Inter |
| IDs / technical values | `font-mono` = JetBrains Mono |

### 5.4 Type scale

Gunakan token yang sudah disediakan lebih dulu:

| Token | Usage |
|------|-------|
| `text-display-lg` | hero headline |
| `text-display-md` | section headline besar |
| `text-headline-sm` | subsection / card section title |
| `text-body-lg` | body emphasis |
| `text-body-md` | default body |
| `text-label-md` | uppercase/small emphasis label |

Rule:

- heading penting memakai serif;
- admin header boleh lebih netral dan dense;
- jangan mencampur terlalu banyak ukuran custom jika token setara sudah ada.

### 5.5 Spacing and layout scale

Token utama:

- `stack-xs`, `stack-sm`, `stack-md`, `stack-lg`, `stack-xl`
- `gutter`
- `margin-mobile`
- `margin-desktop`
- `container-max`

Rule:

- pakai `container-main` untuk page container umum;
- pakai `section-full` atau `section-main` untuk rhythm section vertikal;
- hindari penulisan ulang `max-w-7xl mx-auto px-...` jika `container-main` sudah cocok.

### 5.6 Radius, shadow, motion

#### Radius

- cards default: `rounded-2xl`
- button/input common: `rounded-xl`
- badge/pill: `rounded-full`

#### Shadow

- `shadow-elevation-low`: default card / button
- `shadow-elevation-mid`: hover card / emphasis
- `shadow-elevation-high`: modal / strong overlay
- `shadow-elevation-gold`: premium hover / gold emphasis

#### Motion

- default micro interaction: `150ms` to `200ms`
- layout or hover lift: `300ms`
- use existing variables `--transition-fast`, `--transition-base`, `--transition-slow`

Motion harus terasa halus, bukan dekoratif berlebihan.

---

## 6. Canonical Shared Components

Komponen berikut adalah baseline resmi. Saat use case cocok, komponen ini **wajib diprioritaskan** dibanding styling manual.

### 6.1 Primitive components

| Component | Purpose |
|-----------|---------|
| `Button` | aksi utama, sekunder, ghost, danger |
| `Input` | text field dengan label, hint, error, icon |
| `Card` | surface wrapper |
| `Badge` | status chip / label kecil |
| `Modal` | dialog overlay |
| `RadioCard` | selectable option card |
| `Accordion` | expandable info blocks |
| `Skeleton` | loading placeholder |

### 6.2 App-level shared components

| Component | Purpose |
|-----------|---------|
| `AppBar` | focused flow header |
| `Navbar` | customer marketplace top nav |
| `BottomBar` | legacy mobile marketplace nav, tidak aktif selama guest checkout model |
| `Footer` | page-level footer module |
| `AdminPageHeader` | admin page title + actions |
| `AdminStatCard` | KPI summary |
| `AdminTable` | responsive admin table/card hybrid |
| `AdminEmptyState` | empty state untuk admin screens |
| `AdminShell` | admin layout wrapper |

### 6.3 Mandatory usage rules

- jangan buat tombol manual kalau `Button` bisa dipakai;
- jangan buat input manual kalau `Input` bisa dipakai;
- jangan buat panel putih ber-border berulang kalau `Card` bisa membungkusnya;
- status order, pembayaran, atau admin state harus lewat `Badge` atau extension resmi dari `Badge`;
- pilihan pengiriman, bank, atau lokasi yang sifatnya single-select sebaiknya pakai `RadioCard`;
- header admin selalu mulai dari `AdminPageHeader`.

### 6.4 Allowed exceptions

Raw markup masih boleh jika:

- komponen shared belum mendukung kebutuhan visual/behavior;
- pattern benar-benar unik dan tidak berulang;
- sedang eksperimen awal, tetapi harus dibersihkan sebelum dianggap final.

Kalau exception dipakai dua kali, itu sinyal bahwa primitive/shared component perlu diperluas.

---

## 7. Componentization Rules

Ini bagian paling penting untuk coding consistency.

### 7.1 Hierarchy

Gunakan urutan ini saat membangun UI:

1. design token
2. primitive shared UI
3. domain component
4. page section
5. page composition

Jangan lompat langsung ke page-level utility blob jika primitive sebenarnya sudah ada.

### 7.2 File placement

| Layer | Lokasi |
|------|--------|
| App routing | `src/app` |
| Domain feature components | `src/features/<domain>` |
| Cross-domain UI primitives | `src/shared/ui` |
| Layout and shell | `src/shared/layout` |

### 7.3 Reuse criteria

Naikkan ke `shared/ui` jika:

- dipakai lintas domain;
- bentuk dan behavior relatif stabil;
- hanya butuh prop kecil untuk variasi.

Naikkan ke `features/*` jika:

- masih terikat kuat ke data atau domain tertentu;
- markup-nya reusable dalam domain itu saja.

### 7.4 Styling rules

- utamakan token Tailwind yang sudah ada;
- jangan hardcode hex baru tanpa alasan jelas;
- satu komponen boleh ekspresif, tapi jangan mencampur terlalu banyak shadow/radius/spacing pattern;
- gunakan class semantic global hanya untuk pattern yang benar-benar generik dan sering berulang.

### 7.5 State handling

Setiap komponen interaktif idealnya punya state visual untuk:

- default
- hover
- active/pressed
- focus-visible
- disabled
- loading jika relevan
- empty/error bila relevan di level wrapper

---

## 8. Canonical Page Patterns

### 8.1 Marketing / browsing page

Struktur umum:

1. hero atau top visual
2. section heading dengan CTA sekunder
3. content blocks berbasis card/grid
4. optional supporting footer module

Guidelines:

- section heading gunakan `section-heading` bila cocok;
- kombinasi dark section dan light section diperbolehkan untuk ritme visual;
- card produk dan card insight harus konsisten pada spacing internal dan hover affordance.

### 8.2 Product listing

Standar:

- search di atas
- category tabs/chips
- sort action
- grid produk 2 kolom mobile, bertambah pada layar besar
- empty state yang jelas

Catatan source of truth:

- listing pattern resmi adalah grid product card dengan filter ringan di atas, bukan sidebar filter besar seperti PRD lama;
- kalau nanti filter bertambah kompleks, harus tetap mobile-first dan tidak merusak ritme katalog.

### 8.3 Product detail

Standar:

- galeri produk di atas/kiri
- info utama di kanan/bawah
- metadata grid ringkas
- credibility block seperti sertifikasi
- deskripsi
- related products
- sticky CTA bawah untuk mobile-first buying

### 8.4 Transaction flow page

Dipakai untuk cart, checkout, payment, payment success.

Aturan:

- gunakan `AppBar`;
- layout fokus, maksimal width yang lebih sempit dari landing page;
- section summary memakai card/surface yang konsisten;
- sticky bottom action diperbolehkan untuk CTA primer;
- jangan tampilkan terlalu banyak navigasi yang mengganggu keputusan.
- sebelum checkout, gunakan layer email lookup singkat untuk guest customer;
- jika email pernah order, checkout boleh prefill alamat dan status KTP;
- jika email belum ditemukan, checkout lanjut dengan field alamat dan KTP kosong.

### 8.5 Account page

Aturan:

- tetap gunakan `AppBar`;
- gunakan `Card` untuk list menu, summary, dan info block;
- struktur harus terasa seperti task hub, bukan landing page mini.

### 8.6 Admin page

Struktur default:

1. `AdminPageHeader`
2. optional stats row
3. primary content card/table
4. empty state jika data kosong

Aturan:

- admin harus lebih padat dan operasional daripada customer UI;
- warna emas dipakai sebagai emphasis, bukan background dominan;
- tabel wajib mobile-safe, dan `AdminTable` adalah baseline resmi.

---

## 9. Responsiveness

### 9.1 Breakpoints

| Breakpoint | Intent |
|------------|--------|
| `<640px` | mobile-first, single column, sticky CTA valid |
| `640px-1023px` | tablet / small laptop |
| `>=1024px` | desktop composition |

### 9.2 Grid rules

- product grid default: 2 kolom di mobile, naik bertahap;
- admin stats: stack di mobile, pecah ke 2 atau 4 kolom di desktop;
- table-heavy layout harus punya fallback card layout untuk mobile.

### 9.3 Sticky elements

- sticky header hanya dipakai jika membantu orientasi;
- sticky footer CTA khusus flow page harus memperhitungkan safe area mobile;
- `BottomBar` tidak dipakai pada customer guest checkout model; jika diaktifkan lagi, pastikan tidak bentrok dengan sticky CTA page.

---

## 10. Accessibility and UX Quality Bar

Setiap UI baru minimal memenuhi ini:

- fokus keyboard terlihat jelas dengan focus ring gold;
- icon-only button wajib punya `aria-label`;
- text kontras cukup terhadap background;
- selected state tidak hanya dibedakan lewat warna tipis;
- form error tampil dekat field;
- modal bisa ditutup dengan Escape dan backdrop bila sesuai;
- target tap mobile tidak terlalu kecil.

Untuk admin dan flow page, readability lebih penting daripada dekorasi.

---

## 11. Content and Tone

Tone UI:

- profesional
- tepercaya
- informatif
- ringkas

Guideline copy:

- hindari jargon marketing berlebihan;
- CTA harus jelas dan langsung ke aksi;
- status dan error harus mudah dipahami user non-teknis;
- teks admin harus lugas dan operasional.

---

## 12. What Is No Longer Source of Truth

Hal-hal berikut dari PRD design lama **tidak lagi otomatis berlaku**:

- sitemap lama yang mengasumsikan semua screen customer dan admin sudah final;
- daftar URL lama yang belum sesuai dengan route nyata saat ini;
- asumsi bahwa product listing harus memakai filter sidebar besar;
- wireframe admin yang seolah seluruh modul sudah production-ready;
- design guidance yang hanya visual tetapi tidak mengikat struktur coding.

Mulai sekarang, halaman placeholder tidak menjadi acuan visual final. Yang menjadi acuan adalah:

- shell
- token
- primitive
- layout pattern
- component composition rules

---

## 13. Current Gaps To Gradually Normalize

Gap ini sudah terlihat di codebase saat ini dan harus kita rapikan bertahap.

1. Masih ada halaman yang memakai input, button, app bar, atau section card manual padahal shared component sudah tersedia.
2. Beberapa page container masih menulis `max-width` dan padding manual, belum konsisten memakai `container-main`.
3. Product cards di homepage dan catalog belum sepenuhnya memakai satu pattern tunggal.
4. Customer flow pages sudah cukup konsisten, tapi belum semuanya memakai wrapper section/card yang sama.
5. Admin foundation sudah rapi, tetapi sebagian besar halaman domain masih placeholder sehingga visual final belum boleh diturunkan dari sana.

Gap ini bukan blocker, tapi harus dibaca sebagai backlog standardisasi.

---

## 14. Implementation Rules For Future Frontend Work

Setiap pengembangan frontend ke depan harus mengikuti checklist ini:

1. tentukan dulu shell halaman: marketplace, focused flow, atau admin;
2. gunakan token warna, spacing, dan typography yang sudah ada;
3. pilih shared primitive sebelum menulis markup manual;
4. ekstrak pattern berulang ke component yang tepat;
5. jaga mobile behavior sejak awal, bukan ditambal belakangan;
6. kalau membuat exception, pastikan exception itu sadar konteks dan terdokumentasi.

Rule praktis:

- default CTA gunakan `Button`;
- default form field gunakan `Input`;
- default white surface gunakan `Card` atau semantic wrapper resmi;
- default selection card gunakan `RadioCard`;
- default status badge gunakan `Badge`;
- default admin page scaffold gunakan `AdminPageHeader` + `Card`/`AdminTable`.

---

## 15. Decision Summary

Keputusan design PRD terbaru ini adalah:

- kita mempertahankan visual direction premium navy-gold yang sudah terlanjur hidup di codebase;
- kita menjadikan shared component dan token yang ada sebagai fondasi resmi;
- kita memisahkan pattern customer marketplace, focused transaction flow, dan admin;
- kita berhenti menjadikan PRD design lama sebagai acuan literal untuk wireframe, route, dan screen completeness;
- kita memakai dokumen ini sebagai referensi utama saat membuat UI baru atau merapikan UI lama.

Dokumen ini harus selalu direvisi bila ada perubahan besar pada:

- shell aplikasi;
- design token;
- shared component inventory;
- pattern page yang sudah dianggap final.
