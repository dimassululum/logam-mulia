# Admin Form Behavior Rules

Aturan ini dipakai untuk semua form admin agar user selalu tahu data mana yang salah.

## 1. Error Harus Dekat Dengan Field

- Validasi input wajib muncul inline di bawah field yang bermasalah.
- Jangan hanya menampilkan toast umum seperti `Gagal menyimpan data`.
- Jika error berasal dari backend `422`, baca `errors[]` dari response dan map ke field yang sesuai.
- Jika backend mengirim error umum tanpa field, tampilkan alert kecil di bagian atas modal/form.

## 2. Toast Dipakai Untuk Outcome

Toast hanya untuk hasil umum:

- Data berhasil disimpan.
- Data berhasil dihapus.
- Gagal memuat data list.

Toast tidak cukup untuk error pengisian form karena user tidak tahu field mana yang salah.

## 3. Modal Tidak Boleh Tertutup Saat Error

- Jika validasi gagal, modal/form tetap terbuka.
- Field yang salah tetap mempertahankan value terakhir.
- Tombol simpan boleh loading saat request berjalan, lalu kembali normal saat gagal.

## 4. Field Create vs Edit

- Field status tidak perlu muncul saat tambah data jika default-nya selalu aktif.
- Field status muncul saat edit agar admin bisa aktif/nonaktifkan data.
- Field yang di-generate sistem seperti `slug` tidak perlu muncul jika bukan bagian workflow admin.

## 5. Client-Side Validation

Lakukan validasi ringan sebelum request:

- Required field tidak boleh kosong.
- Minimal panjang teks mengikuti backend.
- URL harus valid, tapi boleh dinormalisasi otomatis dari `maps.google.com/...` menjadi `https://maps.google.com/...`.

Client-side validation tidak menggantikan backend validation; keduanya tetap dipakai.

## 6. Backend Error Mapping

Pola response backend validation:

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [
    { "field": "googleMapsUrl", "message": "Link Google Maps tidak valid" }
  ]
}
```

FE wajib membaca `errors[].field` dan menampilkan `errors[].message` di field terkait.
