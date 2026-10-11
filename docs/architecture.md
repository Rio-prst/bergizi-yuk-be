# BergiziYuk --- Architecture

-   **Dokumen:** Architecture Decision & Development Guide
-   **Versi:** 1.0
-   **Status:** Draft untuk validasi tim
-   **Basis produk:** PRD BergiziYuk v1.0 (4 Oktober 2026)

## 1. Tujuan

Dokumen ini menetapkan struktur backend, batas tanggung jawab layer,
aturan dependensi, validasi, keamanan, pengujian, dan dokumentasi API
untuk BergiziYuk.

BergiziYuk adalah aplikasi untuk menautkan laporan gejala agregat dari
sekolah ke pengiriman dan batch makanan yang tercatat, menemukan sekolah
penerima terkait, dan mencatat tindak lanjut. Hasil penautan adalah
**sinyal untuk investigasi**, bukan diagnosis atau penetapan penyebab.

## 2. Stack yang diusulkan

  -----------------------------------------------------------------------
  Area                                Teknologi
  ----------------------------------- -----------------------------------
  Backend                             NestJS, TypeScript, REST

  Validasi input                      Zod

  Database                            PostgreSQL

  ORM dan migrasi                     Prisma

  Queue dan pekerjaan terjadwal       Redis + BullMQ (bila diperlukan
                                      pada MVP)

  Unit test                           Jest

  HTTP/API integration test           Supertest

  Dokumentasi API                     Swagger / OpenAPI melalui
                                      `@nestjs/swagger`

  Deployment                          Docker Compose pada satu VPS/PaaS

  Repository                          Single-app NestJS (backend only)
  -----------------------------------------------------------------------

**Catatan implementasi:** NestJS biasanya memakai DTO/class-validator
secara konvensional. Proyek ini memilih Zod sesuai kebutuhan tim;
sediakan pipe/helper integrasi Zod agar semua input HTTP divalidasi
secara konsisten sebelum mencapai service.

## 3. Prinsip arsitektur

1.  **Modular monolith:** domain dipisah menjadi module NestJS; tidak
    perlu microservices untuk MVP.
2.  **Dependency direction:**
    `route/controller → service → repository → database`. Service
    bergantung pada interface repository, bukan implementasi Prisma.
3.  **DTO di batas sistem:** semua payload, query, dan parameter yang
    berasal dari HTTP divalidasi dengan Zod.
4.  **Business rules di service/domain:** controller tidak menjalankan
    aturan bisnis dan repository tidak menentukan keputusan bisnis.
5.  **Transaksi untuk alur kritis:** pemrosesan laporan, deduplikasi,
    pembukaan/penggabungan kejadian, dan penyimpanan tautan harus
    konsisten secara transaksional.
6.  **Side effects setelah commit:** notifikasi dikirim setelah
    transaksi sukses; gunakan queue/outbox bila implementasi membutuhkan
    jaminan pengiriman.
7.  **Auditability:** keputusan penautan menyimpan alasan, tingkat
    keyakinan, dan referensi data yang mendasarinya.
8.  **Privacy by default:** tidak menyimpan nama atau identitas medis
    individual siswa; data demo sepenuhnya fiktif.
9.  **Fail safely:** laporan tetap diproses jika pengiriman tidak
    diketahui; tampilkan `UNCONFIRMED`, bukan mengarang hubungan.
10. **No causal claims:** antarmuka/API tidak menyatakan bahwa batch
    atau dapur menyebabkan gejala.

## 4. Struktur direktori

``` text
.
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/                  # cross-cutting generik
│   │   ├── errors/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── infra/                   # integrasi eksternal
│   │   ├── prisma/
│   │   └── redis/
│   ├── auth/                    # login, JWT, guard, decorator role
│   ├── users/
│   ├── regions/
│   ├── kitchens/
│   ├── schools/
│   ├── health-units/
│   ├── suppliers/
│   ├── kitchen-school-service/
│   ├── batches/
│   ├── deliveries/
│   ├── reports/
│   ├── linking/                 # fungsi murni, tanpa akses DB
│   ├── incidents/
│   ├── actions/
│   ├── notifications/
│   ├── audit/
│   ├── config/
│   ├── dev-scenario/
│   └── health/                  # endpoint health check
├── test/
│   ├── integration/
│   └── e2e/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   ├── architecture.md
│   ├── api-contract.md
│   ├── business-rules.md
│   ├── database.md
│   ├── domain-context.md
│   ├── erd.md
│   ├── prd.md
│   └── tasks.md
├── docker-compose.yml
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── eslint.config.mjs
├── .prettierrc
├── .env.example
└── README.md
```

Setiap module domain mengikuti pola yang sama:

``` text
src/<module-name>/
├── dto/
│   ├── create-<entity>.dto.ts
│   ├── update-<entity>.dto.ts
│   ├── list-<entity>.query.dto.ts
│   └── <entity>.response.dto.ts
├── interfaces/
│   ├── <entity>.repository.interface.ts
│   └── <entity>.service.interface.ts
├── <entity>.repository.ts
├── <entity>.repository.integration-spec.ts
├── <entity>.service.ts
├── <entity>.controller.ts
├── <entity>.routes.ts
├── <entity>.module.ts
└── __tests__/
    ├── <entity>.service.spec.ts
    └── <entity>.controller.spec.ts
```

Folder `routes/` berisi **konstanta path** yang dipakai controller
(`@Controller(ENTITY_ROUTES.base)`), bukan implementasi router. Route
sesungguhnya tetap dideklarasikan lewat decorator NestJS
(`@Controller`, `@Get`, `@Post`, dll.). Jangan membuat sistem routing
kedua yang menduplikasi decorator.

Test unit ada di `__tests__/` dengan repository di-mock. Test integrasi
berbentuk `<entity>.repository.integration-spec.ts` diletakkan sejajar
dengan repository, dijalankan lewat `pnpm test:integration`, dan
memukul database sungguhan tanpa mock.

## 5. Tanggung jawab setiap layer

### 5.1 `dto/` --- input/output schema

-   Definisikan schema Zod untuk body, path params, query params, dan
    response bila bermanfaat.
-   Validasi tipe, format, enum, batas angka, panjang string, dan aturan
    bentuk payload.
-   `Create` dan `Update` harus dipisah; update memakai field opsional
    tetapi menolak object kosong jika endpoint tidak mengizinkan no-op.
-   DTO tidak mengakses database dan tidak menjalankan business
    workflow.
-   Hindari menaruh validasi yang membutuhkan state database di DTO;
    lakukan di service.

Contoh:

``` ts
import { z } from 'zod';

export const CreateSymptomReportSchema = z.object({
  deliveryId: z.string().uuid().optional(),
  affectedCount: z.number().int().positive(),
  referredCount: z.number().int().nonnegative(),
  symptoms: z.array(z.enum([
    'NAUSEA', 'VOMITING', 'DIARRHEA', 'DIZZINESS',
    'FEVER', 'ABDOMINAL_PAIN', 'OTHER'
  ])).min(1),
  eatenAt: z.string().datetime().optional(),
  onsetAt: z.string().datetime().optional(),
  note: z.string().max(1000).optional()
}).refine(data => data.referredCount <= data.affectedCount, {
  message: 'referredCount tidak boleh melebihi affectedCount',
  path: ['referredCount']
});

export type CreateSymptomReportDto = z.infer<typeof CreateSymptomReportSchema>;
```

Contoh pipe konseptual:

``` ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodTypeAny) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Input tidak valid',
        details: result.error.flatten()
      });
    }
    return result.data;
  }
}
```

Pastikan implementasi pipe aktual menangani tipe generic dan pemetaan
error dengan benar. Jangan percaya input hanya karena TypeScript
memiliki type.

### 5.2 `interfaces/` --- contracts

-   `*.repository.interface.ts`: operasi persistence yang dibutuhkan
    service.
-   `*.service.interface.ts`: kemampuan use case/domain yang disediakan
    service.
-   Interface berisi signature dan tipe, bukan query Prisma atau
    business implementation.
-   Service menerima repository melalui dependency injection.
-   Interface tidak perlu dibuat untuk setiap class secara mekanis; buat
    untuk boundary yang bermanfaat untuk testing dan penggantian
    implementasi.

``` ts
export interface SymptomReportRepository {
  findRecentByIdempotencyKey(key: string): Promise<SymptomReport | null>;
  create(input: CreateSymptomReportRecord): Promise<SymptomReport>;
  updateCounts(id: string, input: UpdateReportCountsRecord): Promise<SymptomReport>;
}
```

### 5.3 `<entity>.repository.ts` --- persistence

-   Satu-satunya layer domain yang menjalankan query database melalui
    Prisma.
-   Mapping record database ke model domain/return type dilakukan di
    sini.
-   Tidak mengirim HTTP response, notifikasi, atau menentukan tingkat
    keyakinan penautan.
-   Sediakan operasi transaksi/port khusus untuk use case yang
    memerlukan atomicity.
-   Terapkan unique constraint, foreign key, dan index di database
    selain validasi aplikasi.
-   Hindari query N+1; gunakan select/include yang terukur.

### 5.4 `<entity>.service.ts` --- use cases dan business rules

-   Menjalankan validasi lintas-entitas, otorisasi tingkat resource,
    workflow, transaksi, dan koordinasi repository.
-   Menangani deduplikasi/idempotency, penautan laporan, penggabungan
    kejadian, severity, penerima terkait, rekomendasi, dan status
    tindakan.
-   Menghasilkan hasil domain, bukan `res.status()` atau object Express.
-   Menentukan side effect yang perlu dijalankan setelah commit.
-   Mesin penautan idealnya fungsi murni: input data eksplisit, output
    kandidat + alasan + confidence, mudah diuji.

### 5.5 `<entity>.controller.ts` --- HTTP adapter

-   Menerima request, memanggil DTO validation, mengambil actor dari
    auth context, memanggil service, dan mengembalikan response.
-   Tidak memuat query Prisma atau business rules.
-   Tidak mengembalikan stack trace atau detail internal.
-   Gunakan decorator Swagger (`@ApiTags`, `@ApiOperation`,
    `@ApiResponse`, `@ApiBearerAuth`).

### 5.6 `<entity>.routes.ts`

NestJS menggunakan decorator pada controller sebagai sumber route yang
sebenarnya. Isi `<entity>.routes.ts` hanya **konstanta path** yang dipakai
controller, bukan implementasi routing. Jangan menduplikasi definisi HTTP.
Semua route wajib tercakup di Swagger.

## 6. Module dan batas domain

  -----------------------------------------------------------------------
  Module (`src/`)                      Tanggung jawab utama
  ----------------------------------- ---------------------------------------
  `auth`                              Login, token, profil pengguna, JWT
                                      guard, decorator role

  `users`                             Akun, role, org reference

  `regions`                           Hierarki wilayah

  `kitchens`                          Master SPPG/dapur

  `schools`                           Master sekolah

  `health-units`                      Puskesmas/Dinkes; satu role HEALTH
                                      pada MVP

  `suppliers`                         Master pemasok

  `kitchen-school-service`            Relasi dapur yang melayani sekolah

  `batches`                           Batch, menu, waktu masak, bahan dan
                                      lot

  `deliveries`                        Pengiriman multi-batch, penerimaan,
                                      konsumsi

  `reports`                           Pelaporan gejala agregat,
                                      idempotency key, revisi

  `linking`                           Mesin penautan sebagai fungsi murni
                                      tanpa akses DB; diuji dengan kasus
                                      T1 sampai T12

  `incidents`                         Pembukaan, penautan, penerima
                                      terkait, severity, status

  `actions`                           Tugas tindak lanjut dan append-only
                                      history

  `notifications`                     In-app notification,
                                      read/acknowledge state

  `audit`                             Jejak perubahan dan tindakan
                                      penting

  `config`                            Parameter simulasi yang dapat
                                      diubah Admin

  `dev-scenario`                      Seed/reset skenario demo, khusus
                                      development

  `health`                            Endpoint health check tanpa akses
                                      database
  -----------------------------------------------------------------------

Modul `incidents` boleh mengorkestrasi domain report-linking pada MVP,
tetapi mesin penautan tetap berada di `src/linking/` sebagai fungsi murni
tanpa akses DB, dan diuji terpisah dengan kasus T1 sampai T12.

## 7. Aturan bisnis wajib

1.  Laporan pertama langsung membuka kejadian dan memicu notifikasi
    petugas wilayah; tidak menunggu laporan kedua.
2.  Waktu makan, waktu gejala pertama, dan waktu laporan dicatat
    terpisah.
3.  Penautan kuat didasarkan pada batch yang tercatat dalam pengiriman,
    bukan kemiripan menu.
4.  Satu pengiriman dapat memuat beberapa batch; semua batch menjadi
    kandidat.
5.  Sekolah lain yang menerima batch sama: `HIGH`. Dapur sama pada hari
    sama tetapi batch berbeda: paling tinggi `MEDIUM`/kemungkinan.
    Bahan/pemasok hanya menguatkan bila lot tercatat; tanpa lot tampil
    `UNCONFIRMED`.
6.  Laporan baru bergabung ke kejadian terbuka jika batch sama atau
    dapur sama dalam jendela penelusuran; dapur berbeda tidak digabung.
7.  Deduplikasi: sekolah dan pengiriman sama dalam 30 menit menjadi
    pembaruan. Nilai affected count adalah nilai terakhir, bukan
    penjumlahan berulang.
8.  Tanpa pengiriman terpilih, laporan tetap diproses dan hubungan
    ditandai belum terkonfirmasi.
9.  Rekomendasi mengikuti status konsumsi dan harus berupa imbauan
    sesuai SOP, bukan perintah.
10. Severity rendah/sedang/tinggi adalah indikator prioritas, bukan
    diagnosis.
11. Notifikasi terkirim tidak berarti diakui atau ditangani.
    Acknowledgement dan tindakan harus tercatat.
12. Audit trail dan riwayat tindakan bersifat append-only.
13. Perubahan status/consumption menyimpan waktu dan actor.
14. Parameter 72 jam, ambang severity, dan batas acknowledgement adalah
    parameter simulasi yang harus divalidasi dengan petugas kesehatan.

## 8. Transaksi, idempotency, dan notifikasi

Untuk `POST /reports`:

1.  Validasi payload dan autentikasi.
2.  Validasi actor hanya dapat melaporkan untuk sekolah yang berwenang.
3.  Dalam transaksi: cek idempotency key, cek kandidat laporan
    deduplikasi, buat atau perbarui laporan, tentukan batch kandidat,
    buat/temukan incident, simpan link reason/confidence, perbarui
    recipient snapshot dan audit log.
4.  Commit.
5.  Setelah commit, jadwalkan notifikasi. Bila memakai queue, gunakan
    outbox atau strategi retry agar commit sukses tidak kehilangan
    notifikasi.
6.  Response mengandung `reportId`, `incidentId`, status pemrosesan, dan
    hasil tautan ringkas.

`Idempotency-Key` harus disimpan dengan unique constraint yang sesuai
scope. Request ulang dengan key sama tidak membuat laporan/incident
baru. Untuk update laporan, gunakan `version` atau optimistic
concurrency jika dibutuhkan agar update lama tidak menimpa update baru.

## 9. Keamanan dan akses

Role MVP: `KITCHEN`, `SCHOOL`, `HEALTH`, `ADMIN`.

-   Kitchen hanya mengakses dapur dan data pengiriman miliknya.
-   School hanya mengakses sekolah, penerimaan, dan laporan miliknya.
-   Health hanya mengakses kejadian di wilayah yang ditugaskan.
-   Admin mengelola master/config dan skenario demo.
-   Lakukan authorization di server pada setiap resource, bukan hanya
    menyembunyikan UI.
-   Akses lintas role/resource ditolak dengan `403` dan dicatat di audit
    log.
-   Hash password dengan algoritma password hashing yang sesuai; jangan
    simpan plaintext.
-   Token sesuai PRD kedaluwarsa dalam 12 jam; simpan secret melalui
    environment/secret manager.
-   Rate-limit login dan endpoint laporan.
-   Jangan log token, password, atau data sensitif yang tidak
    diperlukan.
-   Endpoint seed/reset demo harus dinonaktifkan pada environment
    produksi.
-   Gunakan data agregat; jangan menambah nama siswa atau identitas
    medis individual.

## 10. Strategi testing

### Unit test service

Mock seluruh repository dan external dependency. Diletakkan di
`src/<module>/__tests__/<entity>.service.spec.ts`. Uji: - aturan bisnis,
authorization use case, validasi lintas-entitas; - deduplikasi 30 menit
dan idempotency; - penautan batch, confidence, merge/split incident; -
severity dan rekomendasi consumption; - error saat data tidak
ditemukan/akses tidak sah; - notifikasi hanya dijadwalkan setelah
operasi sukses.

### Unit test controller

Mock service. Uji: - request dipetakan ke service dengan parameter yang
benar; - status code dan response shape; - DTO/pipe validation dan error
mapping; - actor context diteruskan; - exception service diterjemahkan
tanpa membocorkan detail internal.

### Repository integration test

Berkas bernama `<entity>.repository.integration-spec.ts`, diletakkan
sejajar dengan repository di dalam `src/<module>/`. Jalan dengan
`pnpm test:integration` memakai koneksi `DATABASE_URL_TEST`.

`pnpm test` dan `pnpm verify` **tidak** menjalankan berkas ini.

Gunakan PostgreSQL test nyata dari Supabase pada schema terpisah
(`?schema=test`) dan Prisma. **Jangan mock repository dalam integration
test repository**; mock repository adalah strategi untuk unit test
service/controller. Integration test repository harus membuktikan query,
constraint, relasi, transaksi, unique idempotency key, dan rollback pada
DB nyata.

### API integration / E2E

Gunakan Supertest terhadap aplikasi NestJS dengan DB test. Uji login,
RBAC, alur kitchen → school → health, schema error, idempotency, serta
status 403. External queue/email boleh diganti adapter test, tetapi
database tidak di-mock untuk skenario yang menguji integrasi DB.

### Acceptance test inti

-   T1: menu sama tetapi batch berbeda tidak mendapat confidence HIGH.
-   T2: satu pengiriman dua batch menghasilkan dua kandidat.
-   T3: laporan duplikat dalam 30 menit menjadi pembaruan, bukan
    penambahan korban.
-   T4: tanpa pengiriman, incident tetap terbuka dengan hubungan
    UNCONFIRMED.
-   T5: laporan hari berikutnya bisa menaut ke makanan sebelumnya dalam
    jendela konfigurasi.
-   T6: waktu makan, onset, dan waktu laporan tersimpan terpisah.
-   T7: dapur berbeda tidak digabung.
-   T8: penerima belum menyajikan mendapat imbauan sesuai SOP.
-   T9: sekolah di luar relasi layanan tidak ditautkan otomatis.
-   T10: aksi lewat due time belum diakui memicu reminder/escalation
    sesuai fitur yang diaktifkan.
-   T11: retry jaringan tidak menggandakan laporan.
-   T12: akses lintas role ditolak.

## 11. Swagger / OpenAPI

-   Publikasikan Swagger UI pada `/docs` di development/staging.
-   OpenAPI JSON pada `/docs-json` atau path yang ditetapkan.
-   Definisikan bearer auth, tag per module, request/response schema,
    status code, error schema, enum, contoh payload, dan role yang
    diizinkan.
-   Pastikan Swagger tidak membuka endpoint internal atau secret.
-   Swagger adalah dokumentasi kontrak; perubahan breaking harus
    diperbarui bersama test.
-   Gunakan satu response envelope dan format error konsisten.

## 12. Definition of Done

Sebuah fitur dianggap selesai jika: - DTO Zod dan error validation
tersedia; - service dan repository contracts diperbarui; -
authorization/resource scope diterapkan; - query/constraint/migration
diperlukan telah dibuat; - unit test service dan controller lulus; -
repository integration test lulus bila ada perubahan persistence; -
API/E2E test relevan lulus; - Swagger dan contoh response diperbarui; -
audit log, idempotency, serta privasi ditangani bila relevan; - tidak
ada klaim kausalitas pada UI/API; - README/PRD status dan known
limitations diperbarui.
