# Business Rules

Dokumen ini adalah sumber kebenaran aturan bisnis BergiziYuk. **Jangan mengubah aturan tanpa konfirmasi.** Setiap aturan punya contoh masukan dan hasil yang dipakai sebagai kasus uji. Sumber asal: PRD bagian 9 dan 17.

## Data contoh untuk kasus uji

Dipakai di seluruh contoh di bawah dan di skenario demo.

| Entitas | Data |
|---|---|
| Dapur | `K1` (melayani sekolah A, B, C, D), `K2` (melayani sekolah E) |
| Batch K1 | `B1` = menu "Ayam kecap", kode `K1-20261012-01`; `B2` = menu "Ayam kecap" (sama), kode `K1-20261012-02` |
| Pengiriman | `DA` ke A: [B1]; `DB` ke B: [B1]; `DC` ke C: [B1], status konsumsi `NOT_SERVED`; `DD` ke D: [B2] |
| Petugas | `HEALTH1` untuk wilayah yang mencakup K1, A, B, C, D |

## Parameter

Semua parameter disimpan di `config_params` dan nilai awalnya dari env. Nilai berikut adalah **nilai simulasi** yang perlu disepakati dengan petugas kesehatan; belum divalidasi lapangan.

| Kunci | Nilai awal | Arti |
|---|---|---|
| `LINK_LOOKBACK_HOURS` | `72` | Jendela penelusuran: pengiriman dalam rentang ini sebelum waktu lapor boleh dikaitkan |
| `DEDUP_WINDOW_MINUTES` | `30` | Jendela deduplikasi laporan |
| `ACK_SLA_MINUTES` | `30` | Batas waktu pengakuan aksi sebelum pengingat |
| `ESCALATION_AFTER_REMINDERS` | `2` | Jumlah pengingat tanpa pengakuan sebelum eskalasi |
| `SEVERITY_MEDIUM_AFFECTED` | `10` | Total anak terdampak untuk tingkat sedang |
| `SEVERITY_HIGH_AFFECTED` | `30` | Total anak terdampak untuk tingkat tinggi |
| `SEVERITY_MEDIUM_SCHOOLS` | `2` | Jumlah sekolah terdampak untuk tingkat sedang |
| `SEVERITY_HIGH_SCHOOLS` | `3` | Jumlah sekolah terdampak untuk tingkat tinggi |
| `SEVERITY_MEDIUM_REFERRED` | `1` | Jumlah anak dirujuk ke fasilitas kesehatan untuk tingkat sedang |
| `SEVERITY_HIGH_REFERRED` | `3` | Jumlah anak dirujuk untuk tingkat tinggi |

## Enum

| Kelompok | Nilai |
|---|---|
| Peran | `KITCHEN`, `SCHOOL`, `HEALTH`, `ADMIN` |
| Status konsumsi | `NOT_SERVED`, `PARTIAL`, `CONSUMED`, `UNKNOWN` (bawaan) |
| Gejala | `NAUSEA`, `VOMITING`, `DIARRHEA`, `DIZZINESS`, `FEVER`, `ABDOMINAL_PAIN`, `OTHER` |
| Status kejadian | `INITIAL_REPORT`, `UNDER_REVIEW`, `VERIFIED`, `INVESTIGATION_DONE`, `NOT_FOOD_POISONING` |
| Keyakinan tautan | `HIGH`, `MEDIUM`, `LOW`, `UNCONFIRMED` |
| Dasar penerima | `SAME_BATCH`, `SAME_KITCHEN_SAME_DAY`, `SAME_INGREDIENT_LOT` |
| Jenis aksi | `CONFIRM_SYMPTOMS`, `CONFIRM_CONSUMPTION`, `HOLD_SERVING`, `MONITOR_RECIPIENTS`, `COLLECT_SAMPLE`, `INSPECT_KITCHEN`, `CLOSE_INCIDENT` |
| Status aksi | `OPEN`, `ACKNOWLEDGED`, `DONE`, `CANCELLED` |
| Jenis notifikasi | `INCIDENT_OPENED`, `REPORT_ADDED`, `ACTION_ASSIGNED`, `ACTION_REMINDER`, `ACTION_ESCALATED` |
| Kanal notifikasi | `IN_APP` (nyata); `EMAIL`, `WHATSAPP` (disimulasikan: hanya dicatat di log) |

## Aturan

### R1. Setiap laporan memicu respons

- Laporan pertama langsung membuat kejadian dan notifikasi `INCIDENT_OPENED` ke Petugas Kesehatan wilayah, dalam 5 detik atau kurang.
- Laporan kedua bukan syarat. Laporan berikutnya menambah bukti keterkaitan dan membantu prioritas.
- Sistem membuat aksi `CONFIRM_SYMPTOMS` berstatus `OPEN` untuk Petugas Kesehatan, jatuh tempo `ACK_SLA_MINUTES`.

**Contoh:** A melapor 8 anak bergejala. **Hasil:** kejadian baru berstatus `INITIAL_REPORT`, notifikasi ke `HEALTH1`, aksi `CONFIRM_SYMPTOMS` terbuka.

### R2. Waktu dicatat terpisah

- Tiga waktu disimpan sebagai kolom terpisah: `eatenAt` (waktu makan), `onsetAt` (gejala pertama), `reportedAt` (laporan dikirim, diisi server).
- Tidak ada penolakan berdasarkan jendela jam tunggal. Batas 6 jam **tidak** dipakai sebagai penyaring.
- Laporan boleh dikaitkan dengan pengiriman dalam `LINK_LOOKBACK_HOURS` sebelum `reportedAt`, termasuk makanan hari sebelumnya.
- Validasi lunak: bila `onsetAt` lebih awal dari `eatenAt`, laporan tetap diterima dan respons memuat peringatan (non-blokir). `eatenAt` dan `onsetAt` tidak boleh di masa depan.

### R3. Penautan berdasarkan batch yang diterima

- Laporan dihubungkan ke pengiriman yang dipilih guru (`deliveryIds`), lalu ke semua batch di dalam pengiriman itu.
- Satu pengiriman bisa memuat beberapa batch; semuanya menjadi kandidat tautan.
- **Kesamaan nama menu saja tidak pernah membuat tautan kuat.**
- Tautan laporan-ke-batch yang berasal dari pengiriman terpilih berkeyakinan `HIGH` dengan alasan "Batch tercatat diterima sekolah pelapor".

### R4. Penerima terkait dan tingkat keyakinan

| Dasar | Syarat | Keyakinan | Alasan yang ditampilkan |
|---|---|---|---|
| `SAME_BATCH` | Sekolah lain menerima batch yang sama | `HIGH` | "Menerima batch yang sama" |
| `SAME_KITCHEN_SAME_DAY` | Dapur yang sama, tanggal pengiriman sama, tetapi batch berbeda | `MEDIUM` | "Kemungkinan terkait: dapur dan hari yang sama, batch berbeda" |
| `SAME_INGREDIENT_LOT` | Bahan dengan lot yang sama **dan** lot tercatat `CONFIRMED` | `HIGH` atau `MEDIUM` | "Bahan dengan lot yang sama, perlu diperiksa" |

- Bila data lot tidak ada, **jangan** menautkan lewat nama bahan atau pemasok. Tampilkan "hubungan belum terkonfirmasi" dan laporan tetap diproses.
- Sekolah pelapor sendiri tidak masuk daftar penerima terkait.

**Contoh (T1):** A melapor. **Hasil:** B dan C `SAME_BATCH` `HIGH`; D `SAME_KITCHEN_SAME_DAY` `MEDIUM` (batch B2 berbeda dari B1); sekolah E (dapur K2) tidak muncul.

### R5. Penggabungan kejadian

- Laporan baru digabung ke kejadian terbuka bila (a) ada batch yang sama dengan batch kejadian itu, atau (b) dapur yang sama dan kejadian dibuka dalam `LINK_LOOKBACK_HOURS`.
- Selain itu, buka kejadian baru. Kejadian dari dapur berbeda **tidak** tergabung.
- Kejadian "terbuka" artinya status bukan `INVESTIGATION_DONE` dan bukan `NOT_FOOD_POISONING`.
- Bila laporan memuat pengiriman dari lebih dari satu dapur, laporan ditautkan ke satu kejadian per dapur.
- Laporan tanpa pengiriman terpilih (T4): dapur kandidat adalah dapur yang melayani sekolah itu. Bila tepat satu dapur, kejadian memakai dapur itu sebagai `primaryKitchen` dengan tautan `UNCONFIRMED`. Bila lebih dari satu atau tidak ada, `primaryKitchen` kosong dan kejadian tetap terbuka.

### R6. Deduplikasi

- Laporan dari sekolah yang sama dengan himpunan pengiriman yang sama dalam `DEDUP_WINDOW_MINUTES` dianggap **pembaruan**, bukan laporan baru.
- Jumlah korban per sekolah per himpunan pengiriman memakai **nilai laporan terakhir**, bukan penjumlahan.
- `POST /reports` wajib memakai header `Idempotency-Key`. Kunci yang sama dengan isi yang sama mengembalikan hasil semula. Kunci yang sama dengan isi berbeda mengembalikan `409`.
- `PATCH /reports/:id` menaikkan `version` dan menimpa nilai; riwayat versi tercatat di audit log.

**Contoh (T3):** A mengirim laporan 8 anak, 10 menit kemudian mengirim lagi 9 anak. **Hasil:** satu laporan versi 2, total A = 9 (bukan 17).

### R7. Saran tindak lanjut menurut status konsumsi

Sistem **menyarankan**; imbauan baru sampai ke sekolah setelah Petugas Kesehatan menyetujui (lihat R9).

| Status konsumsi penerima (keyakinan `HIGH`) | Jenis aksi yang disarankan | Isi imbauan |
|---|---|---|
| `NOT_SERVED` | `HOLD_SERVING` | "Mohon tunda penyajian sampai ada arahan petugas kesehatan" |
| `PARTIAL` atau `CONSUMED` | `MONITOR_RECIPIENTS` | "Mohon pantau gejala dan akses bantuan sesuai arahan petugas" |
| `UNKNOWN` | `CONFIRM_CONSUMPTION` | "Mohon konfirmasi status konsumsi" |

- Penerima berkeyakinan `MEDIUM` ditampilkan sebagai "kemungkinan" dan tidak mendapat saran otomatis. Petugas yang memutuskan.
- Perubahan status konsumsi penerima pada kejadian terbuka memperbarui `consumptionSnapshot` dan saran.

**Contoh (T8):** setelah A melapor. **Hasil:** C (`NOT_SERVED`) disarankan `HOLD_SERVING`; B (`CONSUMED`) disarankan `MONITOR_RECIPIENTS`; D tanpa saran otomatis.

### R8. Tingkat keparahan

Indikator prioritas, **bukan diagnosis**. Dihitung ulang setiap laporan masuk atau diperbarui.

- **`HIGH`** bila salah satu: total anak terdampak ≥ `SEVERITY_HIGH_AFFECTED`, sekolah terdampak ≥ `SEVERITY_HIGH_SCHOOLS`, anak dirujuk ≥ `SEVERITY_HIGH_REFERRED`.
- **`MEDIUM`** bila salah satu: total ≥ `SEVERITY_MEDIUM_AFFECTED`, sekolah ≥ `SEVERITY_MEDIUM_SCHOOLS`, dirujuk ≥ `SEVERITY_MEDIUM_REFERRED`.
- Selain itu **`LOW`**.
- "Sekolah terdampak" adalah sekolah yang pernah melapor di kejadian itu.

**Contoh:** A 8 anak, dirujuk 0 → `LOW`. B melapor 5 anak → total 13, 2 sekolah → `MEDIUM`.

### R9. Persetujuan imbauan, pengakuan, dan eskalasi

- Imbauan ke sekolah dibuat sebagai aksi `OPEN` untuk PIC Sekolah **hanya setelah Petugas Kesehatan menyetujui/menugaskan**. Penerima mendapat notifikasi `ACTION_ASSIGNED`.
- Setiap notifikasi punya status: terkirim (`sentAt`), dibaca (`readAt`), diakui (`acknowledgedAt`). Setiap aksi punya status `OPEN`, `ACKNOWLEDGED`, `DONE`, atau `CANCELLED` beserta catatan.
- Aksi `OPEN` yang tidak diakui dalam `ACK_SLA_MINUTES` memicu `ACTION_REMINDER` ke penerima. Setelah `ESCALATION_AFTER_REMINDERS` pengingat tanpa pengakuan, kirim `ACTION_ESCALATED` ke peran `ADMIN` (pengganti Dinkes tingkat atas di MVP). Pengingat dan eskalasi berprioritas P1.
- Riwayat aksi dan notifikasi bersifat **append-only**. Tidak ada penghapusan.

### R10. Redaksi hasil dan status kejadian

Hasil penelusuran tidak boleh menyebut penyebab.

| Boleh | Dilarang |
|---|---|
| "Batch yang tercatat diterima kedua sekolah" | "Batch X penyebab keracunan" |
| "Bahan yang digunakan bersama dan perlu diperiksa" | "Ayam dari pemasok X menyebabkan keracunan" |
| "Kemungkinan terkait: dapur dan hari yang sama" | "Dapur K1 bersalah" atau "dapur lalai" |
| "Hubungan belum terkonfirmasi" | "Terbukti berasal dari ..." |
| "Informasi yang belum lengkap: lot bahan tidak tercatat" | Menyembunyikan data yang kurang |

**Status kejadian dan transisi**

- Alur maju: `INITIAL_REPORT` → `UNDER_REVIEW` → `VERIFIED` → `INVESTIGATION_DONE`.
- `NOT_FOOD_POISONING` boleh dari `INITIAL_REPORT`, `UNDER_REVIEW`, atau `VERIFIED` dan **wajib disertai catatan**.
- `INVESTIGATION_DONE` dan `NOT_FOOD_POISONING` bersifat final (tidak ada pembukaan ulang di MVP).
- Hanya `HEALTH` dan `ADMIN` yang boleh mengubah status. Setiap perubahan tercatat di audit log (pelaku dan waktu).
- Status membedakan laporan awal, informasi yang sudah diverifikasi petugas, dan hasil investigasi.

## Aturan pengiriman dan konsumsi

- Dapur hanya boleh membuat batch dan pengiriman untuk dapurnya sendiri.
- Pengiriman hanya boleh ke sekolah yang ada di relasi layanan dapur tersebut (`422` bila tidak).
- Semua batch dalam satu pengiriman harus milik dapur pengirim.
- Konfirmasi terima dan perubahan status konsumsi hanya oleh PIC sekolah penerima. Status bawaan `UNKNOWN`. Setiap perubahan menyimpan waktu dan pelaku, dan boleh dilakukan sebelum maupun sesudah ada laporan.
- Laporan hanya boleh memilih pengiriman milik sekolah pelapor. Laporan dari sekolah di luar relasi layanan dapur ditandai dan **tidak** ditautkan otomatis (T9).

## Privasi dan keluaran

- Tidak ada nama atau identitas siswa di mana pun (DB, log, notifikasi, ringkasan).
- Data demo fiktif. Log aplikasi tidak boleh memuat isi catatan bebas dari laporan.
- Setiap keluaran penelusuran memuat tingkat keyakinan, alasan, dan bagian "informasi yang belum lengkap".

## Kasus uji

Setiap kasus harus menjadi test otomatis. T1 sampai T9 dan T11 untuk mesin penautan dan service laporan; T10 untuk aksi dan notifikasi; T12 untuk guard peran.

| Kode | Given | When | Expect |
|---|---|---|---|
| T1 | A, B, C menerima B1; D menerima B2 (menu sama, batch beda) | A melapor | B dan C `HIGH` (`SAME_BATCH`); D paling tinggi `MEDIUM`; tidak ada tautan `HIGH` ke D |
| T2 | Pengiriman `DX` ke sekolah A memuat B1 dan B2 | A memilih `DX` lalu melapor | B1 dan B2 sama-sama kandidat tautan; penerima batch mana pun muncul sebagai terkait |
| T3 | A sudah melapor 8 anak 10 menit lalu | A mengirim laporan dengan pengiriman sama, 9 anak | Satu laporan versi 2; total A = 9; tidak ada hitung ganda |
| T4 | A melapor tanpa memilih pengiriman | Submit | Kejadian tetap terbuka; tautan `UNCONFIRMED`; pesan "hubungan belum terkonfirmasi"; dapur kandidat dari relasi layanan |
| T5 | Pengiriman ke A kemarin 10.00; sekarang melapor hari berikutnya | A memilih pengiriman itu | Diterima (dalam 72 jam); tautan terbentuk |
| T6 | `eatenAt` 12.00, `onsetAt` dua hari kemudian | Submit | Diterima; tiga waktu tersimpan terpisah; tidak ada penolakan karena selisih waktu |
| T7 | Kejadian terbuka dari K1; E (dapur K2) melapor | E melapor | Kejadian baru untuk K2; tidak tergabung dengan kejadian K1 |
| T8 | Kejadian terbuka dari laporan A | Sistem menghitung saran | C (`NOT_SERVED`) → `HOLD_SERVING`; B (`CONSUMED`) → `MONITOR_RECIPIENTS`; D tanpa saran otomatis |
| T9 | Sekolah F tidak ada di relasi layanan K1 | F memilih pengiriman K1 | Ditolak atau ditandai dan tidak ditautkan otomatis (`422`) |
| T10 | Aksi `OPEN` tidak diakui | `ACK_SLA_MINUTES` terlampaui | `ACTION_REMINDER` terkirim; setelah batas pengingat, `ACTION_ESCALATED` (P1) |
| T11 | Dua request `POST /reports` dengan `Idempotency-Key` sama (jaringan buruk) | Kirim ulang | Respons sama; hanya satu laporan tersimpan. Isi berbeda dengan kunci sama → `409` |
| T12 | Pengguna `SCHOOL` atau `KITCHEN` | Mengakses `GET /incidents/:id` | `403` dan tercatat di audit log |

Kasus tambahan yang disarankan:

- T13: A melapor 8 anak, lalu B melapor 5 anak → B bergabung ke kejadian yang sama; total 13; tingkat keparahan naik ke `MEDIUM`; tidak ada hitung ganda.
- T14: perubahan status konsumsi C dari `NOT_SERVED` ke `CONSUMED` pada kejadian terbuka → `consumptionSnapshot` dan saran C diperbarui.
- T15: transisi status tidak sah (mis. `INVESTIGATION_DONE` → `VERIFIED`) → `409`.