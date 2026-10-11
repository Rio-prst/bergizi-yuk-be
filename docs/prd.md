# PRD --- BergiziYuk

-   **Versi:** 1.0
-   **Status:** Draft untuk validasi tim
-   **Tanggal dokumen sumber:** 4 Oktober 2026
-   **Konteks:** Hackathon JOINTS UGM 2026, tema Healthcare
-   **Batas pengumpulan:** 16 Oktober 2026, pukul 23.59 WIB

## 1. Ringkasan eksekutif

BergiziYuk adalah aplikasi web mobile-first yang mengubah laporan
gejala dari sekolah menjadi tindakan yang terlacak. Saat guru melaporkan
anak bergejala, sistem membuka kejadian, memberi tahu petugas kesehatan,
menautkan laporan ke batch makanan yang tercatat benar-benar diterima
sekolah, menemukan sekolah lain yang menerima batch sama, lalu mencatat
siapa melakukan tindakan apa sampai selesai.

Nilai inti: menjawab dengan cepat makanan/batch mana yang perlu
ditelusuri, sekolah mana yang menerima makanan terkait, siapa penanggung
jawab, dan apakah tindakan sudah dilakukan.

BergiziYuk **tidak** menentukan penyebab keracunan, menggantikan SKDR
Kemenkes atau Radar MBG BGN, dan tidak mendiagnosis siswa. Keterkaitan
adalah sinyal untuk diinvestigasi petugas.

## 2. Latar belakang dan masalah

Laporan gejala sekolah, catatan produksi dapur, dan tindak lanjut
petugas berada di kanal berbeda sehingga pengaitan dapat dikerjakan
manual setelah kejadian membesar. Sulit mengetahui siapa yang telah
menindaklanjuti, pesan terkirim tidak berarti masalah ditangani, dan
pembaruan jumlah korban berisiko terhitung ganda atau tercecer.

Klaim bahwa sistem yang sudah ada tidak memiliki alur serupa belum
terbukti. BergiziYuk diposisikan sebagai prototipe mandiri yang
melengkapi sistem yang sudah ada; integrasi memerlukan akses dan
kebutuhan teknis yang terkonfirmasi.

## 3. Tujuan produk

1.  Memperpendek waktu dari laporan pertama sampai petugas mengetahui
    batch, sekolah terkait, dan langkah awal.
2.  Memastikan setiap peringatan memiliki pemilik dan status tindak
    lanjut tercatat.
3.  Menjaga keterkaitan tetap transparan: sinyal investigasi, bukan
    kesimpulan penyebab.

### Metrik prototipe

  -----------------------------------------------------------------------
  Metrik                  Target                  Cara ukur
  ----------------------- ----------------------- -----------------------
  Laporan dikirim hingga  ≤ 5 detik               Log waktu server pada
  daftar penerima terkait                         skenario uji
  tampil                                          

  Ketepatan penautan      ≥ 95%                   20 skenario dengan
                                                  kunci jawaban, termasuk
                                                  jebakan

  Waktu guru mengisi      \< 60 detik             Uji minimal 2 orang di
  laporan                                         luar tim

  Peringatan berstatus    100% skenario demo      Audit data simulasi
  diakui                                          

  Hitung ganda korban     0 kasus                 Pengujian otomatis
  dari laporan duplikat                           
  -----------------------------------------------------------------------

## 4. Pengguna dan peran

  -----------------------------------------------------------------------
  Peran                               Kebutuhan
  ----------------------------------- -----------------------------------
  Petugas Dapur (`KITCHEN`)           Mencatat batch dan pengiriman
                                      dengan sedikit isian; melihat
                                      kejadian yang melibatkan dapurnya

  PIC Sekolah (`SCHOOL`)              Konfirmasi penerimaan, status
                                      konsumsi, laporan gejala cepat,
                                      menerima arahan

  Petugas Kesehatan (`HEALTH`)        Menerima peringatan, mengonfirmasi,
                                      melihat tautan dan penerima,
                                      menugaskan tindakan, membuat
                                      ringkasan

  Admin (`ADMIN`)                     Mengelola master data, parameter,
                                      seed/reset skenario demo
  -----------------------------------------------------------------------

Pemisahan petugas Puskesmas dan Dinkes menjadi dua tingkat dengan
eskalasi adalah pengembangan lanjutan, bukan MVP.

## 5. Ruang lingkup

### MVP / P0

-   Login dan empat role dengan pembatasan akses berdasarkan role dan
    wilayah.
-   Master data dapur, sekolah, unit kesehatan, wilayah, pemasok, dan
    relasi dapur-sekolah.
-   Batch, bahan, lot opsional, pengiriman multi-batch.
-   Konfirmasi penerimaan dan status konsumsi.
-   Laporan gejala agregat tanpa identitas siswa.
-   Mesin penautan berbasis aturan yang parameternya dapat disetel.
-   Penerima terkait, confidence, alasan tautan, rekomendasi sesuai
    status konsumsi.
-   Notifikasi dalam aplikasi; email dan tautan WhatsApp disimulasikan.
-   Tindakan dan riwayat tindak lanjut.
-   Dashboard dan detail kejadian.

### P1

-   Ringkasan investigasi siap cetak.
-   Pengingat dan eskalasi tindakan yang belum diakui.
-   UI parameter simulasi dan seed/reset demo.

### P2 / di luar MVP

-   Integrasi langsung API BGN, Radar MBG, atau SKDR.
-   WhatsApp Business API resmi.
-   Impor CSV, peta, ekspor format SKDR.
-   Sensor IoT, machine learning/prediksi risiko.
-   Identitas atau data medis individual siswa.
-   Penetapan penyebab keracunan.

## 6. Asumsi dan batasan

-   SPPG dapat menghasilkan ID batch dan mencatat batch pada setiap
    pengiriman; asumsi ini belum divalidasi.
-   Data lomba seluruhnya fiktif.
-   Jendela penelusuran awal 72 jam dan parameter lain adalah nilai
    simulasi yang perlu disepakati dengan petugas kesehatan.
-   Peringatan ke sekolah berupa imbauan sesuai SOP dan kewenangan,
    bukan perintah.
-   Satu wilayah simulasi: 3 dapur, sekitar 8 sekolah, 1 unit kesehatan.
-   Kapasitas yang diperkirakan dalam dokumen sumber sekitar 230 jam
    untuk 4 orang selama 12 hari; sesuaikan dengan kondisi aktual.

## 7. Alur pengguna utama

1.  Dapur membuat batch (menu, waktu selesai masak, bahan) dan
    pengiriman (batch, porsi, waktu kirim) ke sekolah.
2.  PIC sekolah mengonfirmasi penerimaan dan memilih status konsumsi:
    belum disajikan, sebagian dikonsumsi, sudah dikonsumsi, atau tidak
    diketahui.
3.  PIC sekolah mengirim laporan berisi jumlah anak terdampak, jumlah
    dirujuk, gejala, waktu makan, dan waktu gejala pertama.
4.  Sistem langsung membuka/menautkan kejadian, menemukan penerima
    terkait, dan memberi notifikasi kepada petugas kesehatan wilayah.
5.  Petugas kesehatan mengonfirmasi laporan dan menugaskan tindakan;
    pihak terkait mengakui dan mencatat tindakan.
6.  Laporan susulan dari sekolah lain dapat digabungkan ke kejadian yang
    sama dan memperbarui ringkasan.
7.  Petugas kesehatan mengubah status kejadian dan menghasilkan
    ringkasan investigasi.

## 8. Kebutuhan fungsional

### F1 --- Autentikasi dan peran (P0)

-   Login email dan kata sandi.
-   Akses dibatasi menurut role dan wilayah.
-   Dapur hanya melihat data dapurnya; sekolah hanya data sekolahnya;
    petugas kesehatan melihat kejadian wilayahnya.
-   Akses lintas role ditolak dengan 403 dan dicatat.
-   Token kedaluwarsa setelah 12 jam.

### F2 --- Master data dan relasi layanan (P0)

-   Kelola dapur, sekolah, unit kesehatan, wilayah, pemasok, dan relasi
    dapur-sekolah.
-   Relasi layanan menentukan sekolah yang dapat dipilih dalam
    pengiriman dan routing peringatan.
-   Pengiriman ke sekolah di luar relasi layanan ditolak.

### F3 --- Batch dan pengiriman (P0)

-   Batch memiliki kode otomatis, menu, waktu selesai masak, dan daftar
    bahan; pemasok/lot opsional.
-   Pengiriman dapat memuat satu atau lebih batch, sekolah tujuan,
    porsi, dan waktu kirim.
-   Target kurang dari 5 isian wajib untuk membuat pengiriman.
-   Perubahan tercatat di audit log.

### F4 --- Konfirmasi terima dan status konsumsi (P0)

-   Status: `NOT_SERVED`, `PARTIALLY_CONSUMED`, `CONSUMED`, `UNKNOWN`.
-   Perubahan menyimpan waktu dan pelaku.
-   Status dapat diperbarui sebelum maupun sesudah laporan.

### F5 --- Laporan gejala sekolah (P0)

-   Form tiga langkah mobile-first.
-   Pilih pengiriman dari 3 hari terakhir atau "tidak tahu".
-   Isi jumlah terdampak, jumlah dirujuk, kategori gejala, waktu makan,
    waktu gejala pertama, catatan singkat.
-   Tidak menyimpan nama siswa.
-   Laporan dapat dikirim tanpa pengiriman terpilih dan tidak menunggu
    persetujuan dapur.
-   Update jumlah mengganti nilai terakhir, tidak menjumlahkan ganda.
-   Retry jaringan idempotent.
-   Jika waktu gejala lebih awal daripada waktu makan, tampilkan
    peringatan non-blocking.

### F6 --- Mesin penautan dan pembukaan kejadian (P0)

-   Laporan pertama langsung membuka kejadian dan memberi notifikasi
    petugas kesehatan dalam ≤ 5 detik.
-   Penautan berdasarkan batch yang tercatat diterima, bukan kemiripan
    nama menu.
-   Setiap tautan menampilkan alasan dan confidence.
-   Laporan baru digabungkan ke kejadian terbuka bila batch tumpang
    tindih atau dapur sama dalam jendela waktu yang dikonfigurasi.

### F7 --- Penerima terkait dan rekomendasi (P0)

-   Daftar sekolah penerima batch terkait, status konsumsi, dan dasar
    keterkaitan.
-   Belum disajikan: imbauan menunda penyajian sampai ada arahan
    petugas.
-   Sudah/sebagian dikonsumsi: imbauan memantau gejala dan mengakses
    bantuan sesuai arahan.
-   Tidak diketahui: minta sekolah mengonfirmasi status konsumsi.
-   Seluruh rekomendasi mengikuti SOP dan kewenangan yang disepakati.

### F8 --- Notifikasi dan tindak lanjut (P0; pengingat/eskalasi P1)

-   Notifikasi dalam aplikasi; email dan tautan WhatsApp disimulasikan.
-   Petugas dapat menugaskan konfirmasi gejala, penundaan penyajian,
    pemantauan penerima, pengambilan sampel, pemeriksaan dapur, dan
    penutupan kejadian.
-   Status notifikasi: terkirim, dibaca, diakui.
-   Status tindakan: terbuka, diakui, selesai, dibatalkan; sertakan
    catatan.
-   Aksi belum diakui melewati default 30 menit memicu pengingat lalu
    eskalasi pada P1.
-   Riwayat append-only dan tidak dapat dihapus.

### F9 --- Dashboard dan detail kejadian (P0)

-   Daftar kejadian dengan filter status, wilayah, severity.
-   Detail berisi angka ringkas, timeline, hubungan batch-sekolah dengan
    alasan, penerima, tindakan, dan informasi belum lengkap.
-   Status kejadian: laporan awal, sedang ditelusuri, terverifikasi
    petugas, investigasi selesai, atau bukan indikasi keracunan pangan.
-   Redaksi harus menjelaskan keterkaitan data, bukan penyebab.

### F10 --- Ringkasan investigasi (P1)

-   Halaman cetak berisi kronologi, tautan dan alasan, informasi belum
    lengkap, tindakan dan pelaku.
-   Dapat disimpan sebagai PDF melalui browser.
-   Sertakan penafian bahwa tautan merupakan sinyal investigasi.

### F11 --- Mode simulasi dan parameter (P1)

-   Seed/reset skenario demo khusus Admin dengan target ≤ 10 detik.
-   Parameter: jendela penelusuran, ambang severity, batas waktu
    acknowledgement.
-   Setiap perubahan parameter dicatat.

## 9. Aturan bisnis dan logika penautan

  -----------------------------------------------------------------------
  Kode                                Aturan
  ----------------------------------- -----------------------------------
  R1                                  Setiap laporan memicu respons;
                                      laporan pertama membuka kejadian
                                      dan notifikasi.

  R2                                  Waktu makan, onset, dan laporan
                                      disimpan terpisah. Jendela awal 72
                                      jam; jangan menyaring hanya
                                      berdasarkan batas 6 jam.

  R3                                  Laporan ditautkan ke pengiriman
                                      yang dipilih lalu batch di
                                      dalamnya. Semua batch pengiriman
                                      multi-batch menjadi kandidat.
                                      Kesamaan menu saja bukan tautan
                                      kuat.

  R4                                  Sekolah lain penerima batch sama =
                                      confidence tinggi. Dapur sama pada
                                      hari sama tetapi batch berbeda =
                                      sedang/kemungkinan. Bahan/pemasok
                                      hanya dipakai sebagai hubungan kuat
                                      bila lot tercatat; tanpa lot, belum
                                      terkonfirmasi.

  R5                                  Gabungkan laporan ke kejadian
                                      terbuka bila batch sama atau dapur
                                      sama dalam jendela waktu. Dapur
                                      berbeda tidak digabung.

  R6                                  Laporan dari sekolah dan pengiriman
                                      sama dalam 30 menit dianggap
                                      pembaruan. Jumlah korban memakai
                                      nilai terbaru, bukan penjumlahan.

  R7                                  Rekomendasi bergantung pada status
                                      konsumsi dan harus mengikuti SOP.

  R8                                  Severity rendah/sedang/tinggi
                                      dihitung dari jumlah terdampak,
                                      jumlah sekolah, dan jumlah dirujuk;
                                      ini indikator prioritas, bukan
                                      diagnosis. Ambang perlu
                                      dikonfirmasi.

  R9                                  Notifikasi terkirim tidak berarti
                                      tertangani; acknowledgement dan
                                      tindakan harus tercatat.
                                      Pengingat/eskalasi adalah P1.

  R10                                 Hasil tidak boleh menyebut
                                      penyebab; bedakan laporan awal,
                                      informasi terverifikasi, dan hasil
                                      investigasi.
  -----------------------------------------------------------------------

## 10. Model data

  -----------------------------------------------------------------------
  Entitas                             Kolom utama
  ----------------------------------- -----------------------------------
  `users`                             `id`, `name`, `email`,
                                      `password_hash`, `role`, `org_ref`

  `regions`                           `id`, `name`, `level`, `parent_id`

  `kitchens`                          `id`, `name`, `region_id`,
                                      `capacity_portions`

  `schools`                           `id`, `name`, `region_id`, `level`,
                                      `student_count`, `pic_user_id`

  `health_units`                      `id`, `name`, `type`, `region_id`

  `kitchen_school_service`            `kitchen_id`, `school_id`

  `suppliers`                         `id`, `name`

  `batches`                           `id`, `kitchen_id`, `code`, `menu`,
                                      `cooked_at`, `created_by`

  `batch_ingredients`                 `id`, `batch_id`, `name`,
                                      `supplier_id?`, `lot_ref?`,
                                      `lot_status`

  `deliveries`                        `id`, `kitchen_id`, `school_id`,
                                      `dispatched_at`, `received_at`,
                                      `received_by`,
                                      `consumption_status`, `served_at`

  `delivery_items`                    `delivery_id`, `batch_id`,
                                      `portions`

  `symptom_reports`                   `id`, `school_id`, `reported_by`,
                                      `affected_count`, `referred_count`,
                                      `symptoms[]`, `eaten_at`,
                                      `onset_at`, `reported_at`,
                                      `idempotency_key`, `version`,
                                      `note`

  `report_deliveries`                 `report_id`, `delivery_id`

  `incidents`                         `id`, `code`, `status`, `severity`,
                                      `region_id`, `primary_kitchen_id`,
                                      `opened_at`, `closed_at`

  `incident_reports`                  `incident_id`, `report_id`,
                                      `link_reason`, `confidence`

  `incident_recipients`               `incident_id`, `school_id`,
                                      `delivery_id`, `basis`,
                                      `consumption_snapshot`,
                                      `notified_at`, `acknowledged_at`

  `actions`                           `id`, `incident_id`, `type`,
                                      `assignee_user_id`, `status`,
                                      `due_at`, `done_at`, `note`

  `notifications`                     `id`, `user_id`, `incident_id`,
                                      `channel`, `sent_at`, `read_at`,
                                      `acknowledged_at`

  `audit_logs`                        `id`, `actor_id`, `action`,
                                      `entity`, `entity_id`, `payload`,
                                      `at`

  `config_params`                     `key`, `value`, `updated_by`,
                                      `updated_at`
  -----------------------------------------------------------------------

Indeks yang disarankan: `deliveries(school_id, dispatched_at)`,
`delivery_items(batch_id)`, `symptom_reports(school_id, reported_at)`,
`incidents(region_id, status)`, `actions(status, due_at)`.

## 11. Rancangan API

Detail request/response, enum, error, header idempotency, dan role
dijabarkan pada dokumen `api-contract.md`.

  -------------------------------------------------------------------------
  Endpoint                              Fungsi
  ------------------------------------- -----------------------------------
  `POST /auth/login`, `GET /me`         Login dan profil

  `GET /kitchens`, `GET /schools`       Master data sesuai role

  `POST /batches`, `GET /batches`       Buat/lihat batch

  `POST /deliveries`, `GET /deliveries` Buat/lihat pengiriman

  `POST /deliveries/:id/receive`        Konfirmasi penerimaan

  `PATCH /deliveries/:id/consumption`   Ubah status konsumsi

  `POST /reports`, `PATCH /reports/:id` Kirim/perbarui laporan dengan
                                        idempotency

  `GET /incidents`,                     Daftar/detail kejadian
  `GET /incidents/:id`                  

  `PATCH /incidents/:id/status`         Ubah status kejadian

  `POST /incidents/:id/actions`,        Buat/ubah tindakan
  `PATCH /actions/:id`                  

  `GET /incidents/:id/summary`          Ringkasan investigasi siap cetak

  `GET /notifications`,                 Notifikasi
  `PATCH /notifications/:id`            

  `GET /config`, `PUT /config`          Parameter Admin

  `POST /dev/scenario/seed`,            Simulasi demo; nonaktif di produksi
  `POST /dev/scenario/reset`            
  -------------------------------------------------------------------------

## 12. Arsitektur dan tech stack

  -----------------------------------------------------------------------
  Lapisan                             Pilihan
  ----------------------------------- -----------------------------------
  Backend                             NestJS, TypeScript, REST, Zod
                                      validation, role guards

  Database                            PostgreSQL + Prisma (migration dan
                                      seed)

  Queue/cache                         Redis + BullMQ untuk
                                      notifikasi/pengingat/eskalasi
                                      terjadwal

  Frontend                            React (Vite atau Next.js),
                                      Tailwind, PWA ringan

  Realtime                            Polling pendek atau Server-Sent
                                      Events

  Testing                             Jest, Supertest, unit test mesin
                                      penautan, uji manual demo

  Deployment                          Docker Compose pada satu VPS/PaaS;
                                      seed backup dan mode lokal

  Repository                          Monorepo backend dan web
  -----------------------------------------------------------------------

Prinsip mesin penautan: fungsi murni dengan input/output eksplisit;
pemrosesan laporan dalam transaksi DB; notifikasi setelah transaksi
berhasil; keputusan tautan, alasan, dan confidence disimpan untuk audit.

## 13. Kebutuhan non-fungsional

-   **Privasi:** tidak menyimpan nama/identitas siswa; hanya jumlah dan
    kategori gejala. Data demo fiktif.
-   **Keamanan:** password hash, token 12 jam, RBAC di server, audit
    log, rate limiting login/laporan.
-   **Performa:** penautan dan notifikasi ≤ 5 detik pada skenario;
    halaman utama ≤ 3 detik pada koneksi seluler biasa.
-   **Ketahanan:** laporan idempotent, retry notifikasi gagal, riwayat
    tindakan append-only.
-   **Kegunaan:** mobile-first, bahasa Indonesia sederhana, form laporan
    \< 60 detik, kontras dan target sentuh memadai.
-   **Kejujuran informasi:** confidence dan data yang belum lengkap
    selalu tampak; tidak menyatakan penyebab.

## 14. Rencana implementasi dan jadwal

### Estimasi implementasi per fitur

  -------------------------------------------------------------------------------
  Area                                     Jam Target selesai   Kriteria
  ---------------------- --------------------- ---------------- -----------------
  Fondasi/infra                              8 6 Okt            App berjalan di
                                                                staging dan DB
                                                                terhubung

  F1 Auth/role                               8 6 Okt            Akses lintas role
                                                                ditolak otomatis

  F2 Master data                            10 6 Okt            Seed wilayah
                                                                simulasi lengkap

  F3 Batch/delivery                         24 8 Okt            Pengiriman
                                                                multi-batch
                                                                dengan sedikit
                                                                isian

  F4 Receipt/consumption                     8 8 Okt            Status menyimpan
                                                                waktu dan actor

  F5 Symptom report                         22 10 Okt           Form \< 60 detik,
                                                                deduplikasi
                                                                berfungsi

  F6 Linking engine                         28 11 Okt           Kasus uji
                                                                penautan lulus

  F7 Related recipients                     10 12 Okt           Dasar tautan dan
                                                                konsumsi terlihat

  F8                                        22 12 Okt           Acknowledgement
  Notification/actions                                          dan riwayat
                                                                tersedia

  F9 Dashboard/detail                       26 12 Okt           Detail tanpa
                                                                klaim penyebab

  F10 Summary                                6 13 Okt           Halaman cetak
                                                                rapi

  F11 Simulation/config                      8 13 Okt           Seed/reset ≤ 10
                                                                detik

  Testing/fixes                             20 14 Okt           Tidak ada bug P0
                                                                terbuka

  Deliverable lomba                         30 16 Okt           Video, deck,
                                                                README, repo
                                                                selesai
  -------------------------------------------------------------------------------

Jika tertinggal setelah 12 Oktober: potong F10, pengingat/eskalasi F8,
dan UI parameter F11 (ganti file konfigurasi); notifikasi email cukup
disimulasikan di dalam aplikasi. Jangan memotong F5, F6, F7, F9, dan
alur tindak lanjut dasar F8.

### Jadwal 5--16 Oktober 2026

  -----------------------------------------------------------------------
  Tanggal                 Fokus                   Keluaran
  ----------------------- ----------------------- -----------------------
  5 Okt                   Setup repo/skema,       Repo dan wireframe
                          parameter, skenario,    
                          wireframe               

  6 Okt                   F1, F2, deploy awal     Login dan seed

  7 Okt                   F3 backend/UI dapur     Batch dan pengiriman

  8 Okt                   F3 selesai, F4, mulai   Sekolah konfirmasi
                          F5                      penerimaan

  9 Okt                   F5 UI/API, mulai F6     Laporan masuk

  10 Okt                  F5 selesai, F6 dan      Incident otomatis
                          deduplikasi             

  11 Okt                  F6 selesai dan test; F8 Uji mesin lulus
                          backend                 

  12 Okt                  F7, F8, F9 dan          Alur end-to-end
                          integrasi               

  13 Okt                  F10, F11, demo penuh;   Demo berjalan
                          freeze fitur            

  14 Okt                  Testing, perbaikan,     Bug ditutup
                          usability, storyboard   

  15 Okt                  Deploy final, video ≤ 2 Video dan deck
                          menit, pitch deck,      
                          README                  

  16 Okt                  Buffer dan submit;      Semua deliverable
                          target kirim pukul      terkumpul
                          18.00 WIB               
  -----------------------------------------------------------------------

## 15. Pembagian peran

-   **Anggota 1 --- Backend lead:** skema data, linking engine, test
    mesin, kualitas API.
-   **Anggota 2 --- Backend/infra:** auth, master data, batch/delivery,
    queue/notifikasi, simulasi, deploy, seed.
-   **Anggota 3 --- Frontend lead:** UI dapur, UI sekolah, form gejala,
    usability test.
-   **Anggota 4 --- Frontend/desain/narasi:** dashboard petugas,
    ringkasan, mockup, pitch deck, video, validasi.
-   Semua anggota menguji fitur masing-masing dan menjalankan skenario
    demo minimal sekali.

## 16. Rencana pengujian

### Kasus mesin penautan

  -----------------------------------------------------------------------
  ID                      Kasus                   Hasil yang diharapkan
  ----------------------- ----------------------- -----------------------
  T1                      Dua sekolah menerima    Tidak confidence
                          menu sama dari batch    tinggi; paling tinggi
                          berbeda                 kemungkinan bila dapur
                                                  dan hari sama

  T2                      Satu pengiriman memuat  Kedua batch menjadi
                          dua batch               kandidat

  T3                      Laporan duplikat        Pembaruan, tidak
                          sekolah/pengiriman sama menghitung korban ganda
                          dalam 30 menit          

  T4                      Laporan tanpa           Incident tetap terbuka,
                          pengiriman              hubungan belum
                                                  terkonfirmasi

  T5                      Laporan hari berikutnya Diterima dalam jendela
                          untuk makanan           penelusuran
                          sebelumnya              

  T6                      Gejala muncul lama      Diterima; waktu
                          setelah makan           makan/onset/laporan
                                                  terpisah

  T7                      Dua kejadian dari dapur Tidak digabung
                          berbeda                 

  T8                      Penerima belum          Imbauan menunda
                          menyajikan              penyajian sesuai arahan
                                                  petugas

  T9                      Sekolah di luar relasi  Ditandai dan tidak
                          layanan dapur           ditautkan otomatis

  T10                     Action melewati batas   Pengingat lalu eskalasi
                          acknowledgement         pada P1

  T11                     Retry pengiriman        Idempotent, tidak ada
                          laporan karena sinyal   laporan ganda
                          buruk                   

  T12                     Role lain mengakses     Ditolak dengan 403
                          incident                
  -----------------------------------------------------------------------

Lapisan tambahan: API integration dengan Supertest untuk alur
dapur-sekolah-petugas dan RBAC; usability test minimal 2 orang di luar
tim; jalankan demo penuh minimal 3 kali dari keadaan reset, termasuk
koneksi lambat.

## 17. Data dan skenario demo

-   3 dapur (`K1`, `K2`, `K3`), sekitar 8 sekolah (`S1`--`S8`), 1 unit
    kesehatan, dan 14 hari pengiriman fiktif.
-   K1 melayani S1 (A), S2 (B), S3 (C), dan S4 (D).
-   Batch pagi K1 dikirim ke A, B, C. D menerima menu sama dari batch
    berbeda sebagai kasus jebakan.
-   C memiliki jadwal makan lebih siang dan status belum disajikan.

### Demo 2 menit

1.  **0:00--0:15:** jelaskan masalah dan posisi sebagai pelengkap
    SKDR/Radar MBG.
2.  **0:15--0:35:** tampilkan batch dan pengiriman K1.
3.  **0:35--1:05:** A melaporkan delapan anak bergejala; incident
    terbuka, petugas diberi tahu, B/C muncul sebagai penerima batch
    sama, D tidak ditautkan kuat.
4.  **1:05--1:25:** petugas menugaskan tindakan; C mengonfirmasi dan
    mencatat tindak lanjut sesuai arahan.
5.  **1:25--1:45:** B melapor lima anak; laporan digabungkan tanpa
    hitung ganda.
6.  **1:45--2:00:** tampilkan timeline/ringkasan dan rencana pilot satu
    kecamatan bersama satu Puskesmas.

Klaim bahwa sistem "mencegah korban" belum bisa dibuktikan melalui demo;
demo hanya menunjukkan peluang mempercepat penemuan penerima dan
mengurangi paparan tambahan.

## 18. Deliverable hackathon

-   Video YouTube publik, maksimal 2 menit.
-   Source code GitHub dengan README, akun demo, cara menjalankan; repo
    publik atau dapat diakses panitia.
-   Pitch deck PDF berisi masalah, solusi, demo, pembeda yang jujur,
    validasi, dan pilot.
-   Prototype/mockup UI/UX atau prototype interaktif.
-   Proposal PDF maksimal 10 halaman bersifat opsional.
-   Pengumpulan maksimal 16 Oktober 2026 pukul 23.59 WIB; target
    internal kirim lebih awal.
-   Penggunaan AI diungkapkan secara transparan; patuhi lisensi dan
    orisinalitas karya.

## 19. Risiko dan mitigasi

  -----------------------------------------------------------------------
  Risiko                              Mitigasi
  ----------------------------------- -----------------------------------
  Scope membengkak                    Patuhi garis potong dan freeze
                                      fitur 13 Oktober

  Klaim pembeda dipatahkan            Nyatakan hipotesis, tunjukkan bukti
                                      demo/validasi, posisikan sebagai
                                      pelengkap

  Data batch tidak tersedia           Tampilkan hubungan belum
                                      terkonfirmasi; laporan tetap
                                      diproses

  Penautan keliru/menuduh dapur       Tampilkan alasan/confidence,
                                      redaksi sinyal, uji kasus jebakan

  Alarm palsu                         Status bertahap, konfirmasi
                                      petugas, imbauan sesuai SOP

  Beban pelaporan tinggi              Template, pilih delivery, form \<
                                      60 detik, pilot kecil

  Privasi anak                        Data agregat, akses sesuai role,
                                      demo fiktif

  Demo gagal                          Seed/reset, rekaman cadangan, mode
                                      lokal

  Sensitivitas topik MBG              Bingkai sebagai alat bantu
                                      pelengkap, bukan kritik

  Sistem resmi menambah fitur serupa  Tekankan potensi integrasi dan
                                      peran komplementer
  -----------------------------------------------------------------------

## 20. Validasi lapangan dan pertanyaan terbuka

### Validasi yang disarankan

1.  **Petugas surveilans Puskesmas/Dinkes:** bagaimana laporan sekolah
    saat ini ditautkan ke makanan dan penerimanya? Bagian mana paling
    memakan waktu?
2.  **SPPG:** apakah ID batch sampai ke sekolah dan apakah pencatatan
    batch per pengiriman realistis?
3.  **Guru:** apakah alur pelaporan dapat digunakan saat mendesak?

Prioritaskan wawancara petugas surveilans sebelum menghabiskan waktu
untuk tampilan. Jika kebutuhan sudah terlayani, pertimbangkan posisi
sebagai modul pelengkap Dinkes atau ide cadangan.

### Pertanyaan terbuka

-   Siapa yang berwenang menyarankan/menunda penyajian dan bagaimana
    imbauan disampaikan?
-   Siapa penanggung jawab respons per wilayah dan berapa batas
    waktunya?
-   Format data SKDR apa yang diperlukan untuk ekspor/integrasi?
-   Nilai parameter kesehatan masyarakat yang masuk akal: jendela
    penelusuran, ambang severity, batas acknowledgement?
-   Apakah SPPG dapat menyediakan data batch dan lot secara konsisten?
-   Apakah ada alur serupa yang sudah tersedia di sistem internal?

## 21. Pengembangan lanjutan

-   Pilot satu kecamatan bersama satu Puskesmas dan ukur metrik pada
    bagian 3.
-   Impor batch dari sistem dapur, ekspor format SKDR, integrasi bila
    akses terkonfirmasi.
-   Peta kejadian/tren wilayah dan eskalasi dua tingkat petugas.
-   Pencatatan lot bahan/pemasok lebih lengkap.
-   Notifikasi kanal resmi melalui WhatsApp Business API.

## 22. Catatan sumber

Dokumen ini merapikan isi PRD sumber yang diunggah, mempertahankan klaim
dan status validasinya. Angka kejadian, kondisi sistem eksternal, dan
klaim pembeda tidak diverifikasi ulang di sini; verifikasi sumber perlu
dilakukan sebelum dipakai dalam pitch atau publikasi.
