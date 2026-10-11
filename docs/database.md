# DATABASE — BergiziYuk

- **Versi:** 1.0
- **Status:** Draft untuk validasi tim
- **Basis:** `prd.md` BergiziYuk, bagian model data, kebutuhan fungsional, dan aturan bisnis
- **Database:** PostgreSQL
- **ORM/migration:** Prisma

> Dokumen ini menerjemahkan model data PRD menjadi rancangan database implementatif. Kolom utama yang berasal dari PRD dipertahankan. Tipe data, kolom teknis, constraint, dan beberapa relasi yang belum ditentukan secara eksplisit diberi label **usulan implementasi** dan perlu divalidasi sebelum migration final.

## 1. Prinsip desain

1. **Tidak menyimpan identitas siswa.** Laporan hanya menyimpan angka agregat, kategori gejala, waktu, dan catatan singkat.
2. **Jejak audit dipertahankan.** Perubahan penting dicatat; riwayat tindakan dan audit log bersifat append-only untuk aplikasi.
3. **Keterkaitan bukan diagnosis.** Simpan alasan tautan dan confidence sebagai data yang dapat diperiksa.
4. **Pembaruan laporan tidak menjumlahkan korban.** `affected_count` dan `referred_count` merepresentasikan nilai terkini untuk versi laporan.
5. **Operasi penting transaksional.** Pembuatan laporan, tautan kejadian, dan pembaruan ringkasan harus konsisten dalam transaksi database.
6. **Data tenant/wilayah dibatasi di service.** Foreign key menjaga integritas; otorisasi role dan wilayah tetap harus ditegakkan oleh backend.

## 2. Konvensi umum

- Primary key: `id UUID` untuk entitas utama (**usulan implementasi**).
- Waktu: `TIMESTAMPTZ`, disimpan dalam UTC dan ditampilkan sesuai zona waktu pengguna.
- Nama tabel/kolom: `snake_case`, tabel jamak.
- Kolom waktu teknis: `created_at`, `updated_at` bila relevan.
- Nilai uang tidak diperlukan pada model MVP yang didefinisikan PRD.
- Gunakan enum PostgreSQL atau `TEXT` dengan validasi Zod dan `CHECK`; pilih satu pendekatan secara konsisten.
- Semua tabel perlu migration yang dapat direproduksi dan seed data demo fiktif.

## 3. Entitas dan kolom

Kolom berlabel **PK** adalah primary key, **FK** adalah foreign key, dan **UQ** adalah unique constraint. Tipe berikut merupakan rekomendasi implementasi, bukan tipe yang ditetapkan secara eksplisit oleh PRD.

### 3.1 `regions`

Mendukung pembatasan wilayah dan hierarki wilayah.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(160) | Wajib |
| `level` | VARCHAR(40) | Wajib; nilai level perlu disepakati |
| `parent_id` | UUID | FK → `regions.id`, nullable untuk wilayah akar |
| `created_at` | TIMESTAMPTZ | Default `now()` |
| `updated_at` | TIMESTAMPTZ | Default `now()` |

Indeks: `parent_id`. Hindari siklus pada hierarki wilayah melalui validasi service.

### 3.2 `users`

Akun untuk role `KITCHEN`, `SCHOOL`, `HEALTH`, dan `ADMIN`.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(160) | Wajib |
| `email` | VARCHAR(255) | Wajib, UQ case-insensitive |
| `password_hash` | TEXT | Wajib; tidak pernah menyimpan password plaintext |
| `role` | VARCHAR(20) | Wajib; enum role |
| `org_ref` | UUID | Referensi organisasi pemilik akun; tipe organisasi perlu dikonfirmasi |
| `is_active` | BOOLEAN | Default `true` (**usulan**) |
| `created_at` | TIMESTAMPTZ | Default `now()` |
| `updated_at` | TIMESTAMPTZ | Default `now()` |

**Catatan desain:** PRD menyebut `org_ref`, tetapi belum menetapkan polymorphic reference yang aman. Alternatif yang lebih kuat secara referensial adalah kolom nullable `kitchen_id`, `school_id`, dan/atau `health_unit_id` dengan constraint yang memastikan hanya relasi yang sesuai role yang terisi. Pilih satu model sebelum implementasi.

### 3.3 `kitchens`

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(180) | Wajib |
| `region_id` | UUID | FK → `regions.id` |
| `capacity_portions` | INTEGER | Nullable; jika terisi harus ≥ 0 |
| `created_at`, `updated_at` | TIMESTAMPTZ | Default `now()` |

Indeks: `region_id`.

### 3.4 `schools`

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(180) | Wajib |
| `region_id` | UUID | FK → `regions.id` |
| `level` | VARCHAR(60) | Wajib atau nullable sesuai validasi master data |
| `student_count` | INTEGER | Nullable; jika terisi harus ≥ 0 |
| `pic_user_id` | UUID | FK → `users.id`, nullable |
| `created_at`, `updated_at` | TIMESTAMPTZ | Default `now()` |

Indeks: `region_id`, `pic_user_id`.

### 3.5 `health_units`

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(180) | Wajib |
| `type` | VARCHAR(60) | Wajib; daftar nilai perlu disepakati |
| `region_id` | UUID | FK → `regions.id` |
| `created_at`, `updated_at` | TIMESTAMPTZ | Default `now()` |

Indeks: `region_id`.

### 3.6 `kitchen_school_service`

Relasi many-to-many dapur dan sekolah yang dilayani.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `kitchen_id` | UUID | PK bagian; FK → `kitchens.id` |
| `school_id` | UUID | PK bagian; FK → `schools.id` |
| `created_at` | TIMESTAMPTZ | Default `now()` |

PK komposit: (`kitchen_id`, `school_id`). Pembuatan delivery harus ditolak bila pasangan ini tidak terdaftar.

### 3.7 `suppliers`

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(180) | Wajib |
| `created_at`, `updated_at` | TIMESTAMPTZ | Default `now()` |

### 3.8 `batches`

Batch produksi makanan oleh dapur.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `kitchen_id` | UUID | FK → `kitchens.id`, wajib |
| `code` | VARCHAR(80) | Wajib; UQ minimal per dapur |
| `menu` | VARCHAR(240) | Wajib |
| `cooked_at` | TIMESTAMPTZ | Wajib |
| `created_by` | UUID | FK → `users.id`, wajib |
| `created_at`, `updated_at` | TIMESTAMPTZ | Default `now()` |

Constraint yang disarankan: `UNIQUE(kitchen_id, code)`. Indeks tambahan: `(kitchen_id, cooked_at)`.

### 3.9 `batch_ingredients`

Bahan pada batch. `supplier_id` dan `lot_ref` opsional sesuai PRD.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `batch_id` | UUID | FK → `batches.id`, wajib |
| `name` | VARCHAR(180) | Wajib |
| `supplier_id` | UUID | FK → `suppliers.id`, nullable |
| `lot_ref` | VARCHAR(120) | Nullable |
| `lot_status` | VARCHAR(40) | Nilai harus divalidasi; arti/status final perlu disepakati |
| `created_at` | TIMESTAMPTZ | Default `now()` |

Indeks: `batch_id`, `supplier_id`, dan `lot_ref` jika dipakai untuk penelusuran. Jangan menyimpulkan lot tertentu bila lot tidak tercatat.

### 3.10 `deliveries`

Satu pengiriman memiliki satu dapur dan satu sekolah tujuan; batch yang dikirim direlasikan melalui `delivery_items`.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `kitchen_id` | UUID | FK → `kitchens.id`, wajib |
| `school_id` | UUID | FK → `schools.id`, wajib |
| `dispatched_at` | TIMESTAMPTZ | Wajib |
| `received_at` | TIMESTAMPTZ | Nullable hingga penerimaan dikonfirmasi |
| `received_by` | UUID | FK → `users.id`, nullable hingga dikonfirmasi |
| `consumption_status` | VARCHAR(30) | `NOT_SERVED`, `PARTIALLY_CONSUMED`, `CONSUMED`, `UNKNOWN`; default `UNKNOWN` |
| `served_at` | TIMESTAMPTZ | Nullable |
| `created_at`, `updated_at` | TIMESTAMPTZ | Default `now()` |

Indeks: `(school_id, dispatched_at DESC)`, `(kitchen_id, dispatched_at DESC)`. Service wajib memvalidasi `kitchen_school_service`. Catat pelaku dan waktu untuk perubahan status konsumsi; bila perlu riwayat lengkap, tambahkan tabel history khusus (keputusan terbuka).

### 3.11 `delivery_items`

Tabel penghubung pengiriman dan batch; mendukung satu pengiriman berisi beberapa batch.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `delivery_id` | UUID | PK bagian; FK → `deliveries.id` |
| `batch_id` | UUID | PK bagian; FK → `batches.id` |
| `portions` | INTEGER | Wajib, > 0 |

PK komposit: (`delivery_id`, `batch_id`). Validasi service memastikan batch berasal dari dapur yang sama dengan `deliveries.kitchen_id`.

### 3.12 `symptom_reports`

Laporan agregat gejala dari sekolah, tanpa nama atau identitas siswa.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `school_id` | UUID | FK → `schools.id`, wajib |
| `reported_by` | UUID | FK → `users.id`, wajib |
| `affected_count` | INTEGER | Wajib, ≥ 0 |
| `referred_count` | INTEGER | Wajib, ≥ 0 dan tidak melebihi `affected_count` bila definisi operasional disetujui |
| `symptoms` | TEXT[] atau JSONB | Wajib; kategori gejala, bukan catatan individu |
| `eaten_at` | TIMESTAMPTZ | Nullable jika tidak diketahui |
| `onset_at` | TIMESTAMPTZ | Nullable jika tidak diketahui |
| `reported_at` | TIMESTAMPTZ | Default `now()` |
| `idempotency_key` | VARCHAR(160) | Wajib untuk pengiriman idempotent |
| `version` | INTEGER | Default 1; naik saat update |
| `note` | VARCHAR(1000) | Nullable; jangan masukkan identitas siswa |
| `created_at`, `updated_at` | TIMESTAMPTZ | Default `now()` |

Constraint/indeks:
- `UNIQUE(reported_by, idempotency_key)` sebagai usulan cakupan key; perlu diputuskan apakah key unik global atau per user.
- Indeks `(school_id, reported_at DESC)`.
- Validasi `affected_count >= 0`, `referred_count >= 0`.
- Update angka korban mengganti nilai sebelumnya, bukan menambahkannya.
- `eaten_at`, `onset_at`, dan `reported_at` disimpan terpisah. Jika onset lebih awal dari makan, beri peringatan non-blocking sesuai PRD.

### 3.13 `report_deliveries`

Relasi many-to-many laporan dengan pengiriman yang dipilih/terkait. Mendukung laporan tanpa pengiriman yang diketahui.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `report_id` | UUID | PK bagian; FK → `symptom_reports.id` |
| `delivery_id` | UUID | PK bagian; FK → `deliveries.id` |
| `link_source` | VARCHAR(30) | **Usulan**; mis. `USER_SELECTED` atau `RULE_MATCHED` |

PK komposit: (`report_id`, `delivery_id`). Service harus memvalidasi bahwa pengiriman berkaitan dengan sekolah pelapor. Kolom `link_source` adalah tambahan implementasi untuk membedakan sumber tautan.

### 3.14 `incidents`

Kejadian yang menjadi wadah investigasi dan penggabungan laporan.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `code` | VARCHAR(80) | Wajib, UQ |
| `status` | VARCHAR(40) | Status kejadian sesuai PRD |
| `severity` | VARCHAR(20) | `LOW`, `MEDIUM`, `HIGH` sesuai ambang yang disepakati |
| `region_id` | UUID | FK → `regions.id` |
| `primary_kitchen_id` | UUID | FK → `kitchens.id`, nullable bila belum diketahui |
| `opened_at` | TIMESTAMPTZ | Wajib |
| `closed_at` | TIMESTAMPTZ | Nullable |
| `created_at`, `updated_at` | TIMESTAMPTZ | Default `now()` |

Status yang disebut PRD: laporan awal, sedang ditelusuri, terverifikasi petugas, investigasi selesai, bukan indikasi keracunan pangan. Tetapkan kode enum final dan transisi status setelah validasi tim. Indeks: `(region_id, status)`, `(opened_at DESC)`.

### 3.15 `incident_reports`

Tautan antara kejadian dan laporan, beserta alasan dan confidence yang dapat diaudit.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `incident_id` | UUID | PK bagian; FK → `incidents.id` |
| `report_id` | UUID | PK bagian; FK → `symptom_reports.id` |
| `link_reason` | TEXT | Wajib |
| `confidence` | VARCHAR(20) atau NUMERIC | Wajib; format final perlu diputuskan |
| `created_at` | TIMESTAMPTZ | Default `now()` |

PK komposit: (`incident_id`, `report_id`). Rekomendasi: jika confidence berupa skor, definisikan rentang (mis. 0–1) dan maknanya sebelum implementasi. Jangan menampilkan skor seolah probabilitas diagnosis.

### 3.16 `incident_recipients`

Daftar sekolah penerima terkait dengan dasar keterkaitan dan snapshot status konsumsi.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `incident_id` | UUID | PK bagian; FK → `incidents.id` |
| `school_id` | UUID | PK bagian; FK → `schools.id` |
| `delivery_id` | UUID | PK bagian; FK → `deliveries.id` |
| `basis` | TEXT | Wajib; dasar keterkaitan |
| `consumption_snapshot` | VARCHAR(30) | Wajib; status saat penerima dikaitkan |
| `notified_at` | TIMESTAMPTZ | Nullable |
| `acknowledged_at` | TIMESTAMPTZ | Nullable |
| `created_at` | TIMESTAMPTZ | Default `now()` |

Kunci komposit di atas mencegah penggandaan recipient untuk kombinasi yang sama. Bila produk perlu menyimpan beberapa alasan per kombinasi, pindahkan alasan ke tabel link terpisah.

### 3.17 `actions`

Tindakan tindak lanjut pada kejadian.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `incident_id` | UUID | FK → `incidents.id`, wajib |
| `type` | VARCHAR(60) | Wajib; jenis tindakan dari PRD |
| `assignee_user_id` | UUID | FK → `users.id`, nullable jika belum ditugaskan |
| `status` | VARCHAR(20) | `OPEN`, `ACKNOWLEDGED`, `DONE`, `CANCELLED` |
| `due_at` | TIMESTAMPTZ | Nullable |
| `done_at` | TIMESTAMPTZ | Nullable |
| `note` | TEXT | Nullable |
| `created_at`, `updated_at` | TIMESTAMPTZ | Default `now()` |

Indeks: `(status, due_at)`, `(incident_id, status)`, `assignee_user_id`. Riwayat perubahan status/catatan harus dipertahankan; opsi paling sederhana adalah tabel `action_events` append-only (disarankan bila setiap perubahan wajib dapat ditelusuri).

### 3.18 `notifications`

Notifikasi kepada pengguna; pengiriman tidak sama dengan acknowledgement.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id`, wajib |
| `incident_id` | UUID | FK → `incidents.id`, nullable untuk notifikasi non-kejadian |
| `channel` | VARCHAR(20) | Mis. `IN_APP`, `EMAIL_SIMULATED`, `WHATSAPP_LINK_SIMULATED` |
| `sent_at` | TIMESTAMPTZ | Nullable |
| `read_at` | TIMESTAMPTZ | Nullable |
| `acknowledged_at` | TIMESTAMPTZ | Nullable |
| `created_at` | TIMESTAMPTZ | Default `now()` |

Indeks: `(user_id, created_at DESC)`, `(incident_id)`. Nilai `channel` adalah usulan kode implementasi untuk kanal yang dijelaskan PRD.

### 3.19 `audit_logs`

Log append-only untuk perubahan penting dan akses yang perlu diaudit.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `id` | UUID | PK |
| `actor_id` | UUID | FK → `users.id`, nullable untuk aksi sistem |
| `action` | VARCHAR(100) | Wajib |
| `entity` | VARCHAR(100) | Wajib |
| `entity_id` | UUID | Nullable bila aksi tidak terkait satu entitas |
| `payload` | JSONB | Wajib; minimalkan data sensitif |
| `at` | TIMESTAMPTZ | Default `now()` |

Indeks: `(entity, entity_id, at DESC)`, `(actor_id, at DESC)`. Batasi akses tulis/hapus di aplikasi; jangan memasukkan password, token, atau identitas siswa ke payload.

### 3.20 `config_params`

Parameter aturan penautan dan simulasi yang dapat dikelola Admin.

| Kolom | Tipe usulan | Aturan |
|---|---|---|
| `key` | VARCHAR(120) | PK |
| `value` | JSONB | Wajib |
| `updated_by` | UUID | FK → `users.id` |
| `updated_at` | TIMESTAMPTZ | Default `now()` |

Kandidat parameter dari PRD: jendela penelusuran awal 72 jam, ambang severity, dan batas waktu acknowledgement default 30 menit. Nilai tersebut merupakan parameter simulasi yang perlu dikonfirmasi dengan petugas kesehatan. Setiap perubahan dicatat ke `audit_logs`.

## 4. Relasi inti

- `regions` 1—N `kitchens`, `schools`, `health_units`, dan `incidents`.
- `regions` 1—N `regions` melalui `parent_id`.
- `kitchens` N—N `schools` melalui `kitchen_school_service`.
- `kitchens` 1—N `batches` dan `deliveries`.
- `batches` N—N `deliveries` melalui `delivery_items`.
- `batches` 1—N `batch_ingredients`; `suppliers` 1—N `batch_ingredients`.
- `schools` 1—N `deliveries` dan `symptom_reports`.
- `symptom_reports` N—N `deliveries` melalui `report_deliveries`.
- `incidents` N—N `symptom_reports` melalui `incident_reports`.
- `incidents` 1—N `incident_recipients`, `actions`, dan `notifications`.
- `users` berelasi dengan laporan, tindakan, notifikasi, audit, dan master data sesuai peran.

## 5. Indeks minimum

Indeks yang secara eksplisit direkomendasikan PRD:
- `deliveries(school_id, dispatched_at)`
- `delivery_items(batch_id)`
- `symptom_reports(school_id, reported_at)`
- `incidents(region_id, status)`
- `actions(status, due_at)`

Indeks tambahan yang disarankan:
- `batches(kitchen_id, cooked_at)`
- `notifications(user_id, created_at)`
- `audit_logs(entity, entity_id, at)`
- Unique index untuk `users.email`, `batches(kitchen_id, code)`, `incidents.code`, dan kunci idempotensi sesuai cakupan yang diputuskan.

Jangan menambahkan indeks berlebihan sebelum memeriksa query nyata dan rencana eksekusi.

## 6. Transaksi dan integritas

### Pembuatan laporan

Dalam satu transaksi database:
1. Validasi idempotency key dan cek apakah request sudah diproses.
2. Buat atau update `symptom_reports` dengan nilai agregat terbaru.
3. Simpan tautan pengiriman pada `report_deliveries` bila diketahui.
4. Cari kandidat batch/penerima berdasarkan data pengiriman yang tercatat.
5. Buat atau tautkan `incidents` melalui `incident_reports`, simpan `link_reason` dan `confidence`.
6. Perbarui `incident_recipients` dan ringkasan severity bila diperlukan.
7. Commit transaksi.
8. Setelah commit, proses pengiriman notifikasi; kegagalan notifikasi tidak boleh menghapus laporan.

Implementasi idempotensi dan aturan penggabungan harus mencegah dua request bersamaan membuat kejadian ganda. Pertimbangkan unique constraint dan locking/serializable strategy sesuai kebutuhan.

### Pembuatan pengiriman

- Pastikan pasangan dapur–sekolah tersedia di `kitchen_school_service`.
- Pastikan semua batch milik dapur yang sama dengan delivery.
- Simpan setiap batch di `delivery_items`; jangan menaruh banyak ID batch dalam satu kolom.

### Update jumlah korban

- Update nilai `affected_count` dan `referred_count`, bukan increment otomatis.
- Simpan `version` atau mekanisme optimistic locking untuk mencegah update bersamaan saling menimpa.
- Laporan dari sekolah dan pengiriman sama dalam 30 menit diperlakukan sebagai pembaruan sesuai PRD; definisi pemilihan record utama perlu disepakati.

## 7. Retensi dan keamanan

- Jangan simpan nama, NIS/NISN, alamat, nomor telepon, atau identitas individual siswa.
- Validasi isi `note` dan payload audit untuk mengurangi risiko data pribadi masuk bebas.
- Gunakan password hash yang sesuai; jangan menyimpan token autentikasi di log.
- Batasi data berdasarkan role dan wilayah pada setiap query yang relevan.
- Riwayat tindakan dan audit log diperlakukan append-only oleh aplikasi.
- Aturan retensi, backup, penghapusan akun, dan pemenuhan kebijakan privasi belum dirinci di PRD dan harus diputuskan sebelum produksi.

## 8. Pertanyaan yang harus diputuskan sebelum migration final

1. Apakah `users.org_ref` dipertahankan atau diganti foreign key organisasi yang eksplisit?
2. Apakah `symptom_reports` dapat memiliki beberapa delivery sekaligus, dan apakah relasi pilihan pengguna dibedakan dari hasil mesin?
3. Apakah confidence berupa label (`LOW/MEDIUM/HIGH`) atau skor numerik? Apa definisi dan tampilannya?
4. Apa daftar final status kejadian, jenis tindakan, jenis unit kesehatan, status lot, dan kategori gejala?
5. Apakah perubahan status konsumsi perlu tabel history tersendiri?
6. Apakah setiap perubahan action wajib dicatat dalam `action_events` atau cukup lewat audit log?
7. Apakah `incident_recipients` perlu mempertahankan beberapa delivery/basis untuk satu sekolah dalam satu kejadian?
8. Bagaimana cakupan unik `idempotency_key` dan kebijakan retensi?
9. Apa definisi severity dan ambangnya yang disetujui petugas kesehatan?

## 9. Definition of Done database

- [ ] Seluruh tabel dan foreign key dibuat melalui migration.
- [ ] Unique constraint, check constraint, dan indeks penting diuji.
- [ ] Seed demo menggunakan data fiktif.
- [ ] Repository integration test berjalan terhadap PostgreSQL test schema
      sungguhan (`DATABASE_URL_TEST`, schema `test` di Supabase).
- [ ] Test mencakup transaksi, FK, unique/idempotency, dan query penautan.
- [ ] Tidak ada identitas siswa di schema atau seed.
- [ ] Backup/restore lokal didokumentasikan.
