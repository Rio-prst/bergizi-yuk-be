# BergiziYuk --- API Contract

-   **Versi kontrak:** v1
-   **Base path:** `/api/v1`
-   **Format:** REST/JSON
-   **Auth:** Bearer token
-   **Dokumentasi interaktif:** Swagger UI `/docs`
-   **Status:** Draft turunan dari PRD BergiziYuk v1.0

> Kontrak ini memperjelas rancangan endpoint pada PRD. Field tambahan
> yang belum ditentukan eksplisit di PRD ditandai sebagai keputusan
> implementasi yang perlu dikonfirmasi tim. Semua data demo harus
> fiktif.

## 1. Konvensi umum

### 1.1 Headers

``` http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
Idempotency-Key: <unique-client-generated-key>
```

`Idempotency-Key` wajib untuk `POST /reports`. Client harus memakai key
yang sama ketika mengulang request akibat timeout/jaringan putus. Key
baru dipakai untuk laporan baru.

### 1.2 Response sukses

``` json
{
  "data": {},
  "meta": {
    "requestId": "req_01..."
  }
}
```

Untuk list:

``` json
{
  "data": [],
  "meta": {
    "requestId": "req_01...",
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

### 1.3 Response error

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input tidak valid",
    "details": [
      {
        "field": "affectedCount",
        "message": "Harus berupa integer positif"
      }
    ],
    "requestId": "req_01..."
  }
}
```

### 1.4 Status code

  -----------------------------------------------------------------------
  Status                              Makna
  ----------------------------------- -----------------------------------
  `200`                               Request sukses

  `201`                               Resource dibuat

  `202`                               Request diterima untuk pemrosesan
                                      async

  `400`                               Input tidak valid

  `401`                               Belum login/token tidak valid

  `403`                               Role atau scope resource tidak
                                      berwenang

  `404`                               Resource tidak ditemukan atau tidak
                                      dapat diakses sesuai kebijakan
                                      keamanan

  `409`                               Konflik status/versi atau
                                      idempotency conflict

  `422`                               Request valid secara bentuk, tetapi
                                      melanggar aturan domain

  `429`                               Rate limit

  `500`                               Kesalahan internal generik
  -----------------------------------------------------------------------

Jangan mengirim stack trace atau query DB pada response.

## 2. Enum kontrak

``` ts
type Role = 'KITCHEN' | 'SCHOOL' | 'HEALTH' | 'ADMIN';

type ConsumptionStatus =
  | 'NOT_SERVED'
  | 'PARTIALLY_CONSUMED'
  | 'CONSUMED'
  | 'UNKNOWN';

type Confidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCONFIRMED';

type IncidentStatus =
  | 'INITIAL_REPORT'
  | 'UNDER_INVESTIGATION'
  | 'OFFICER_VERIFIED'
  | 'INVESTIGATION_COMPLETED'
  | 'NOT_FOOD_POISONING_INDICATION';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

type ActionStatus = 'OPEN' | 'ACKNOWLEDGED' | 'DONE' | 'CANCELLED';

type ActionType =
  | 'CONFIRM_SYMPTOMS'
  | 'DELAY_SERVING'
  | 'MONITOR_RECIPIENTS'
  | 'COLLECT_SAMPLE'
  | 'INSPECT_KITCHEN'
  | 'CLOSE_INCIDENT';

type Symptom =
  | 'NAUSEA'
  | 'VOMITING'
  | 'DIARRHEA'
  | 'DIZZINESS'
  | 'FEVER'
  | 'ABDOMINAL_PAIN'
  | 'OTHER';
```

Enum pada API menggunakan uppercase stabil. Label UI boleh berbahasa
Indonesia. Status incident di atas adalah pemetaan kontrak dari istilah
PRD; tim perlu menyepakati label final sebelum implementasi.

## 3. Endpoint matrix

  ----------------------------------------------------------------------------------------------
  Method            Endpoint                        Role              Tujuan
  ----------------- ------------------------------- ----------------- --------------------------
  `POST`            `/auth/login`                   Public            Login

  `GET`             `/me`                           Semua role        Profil actor

  `GET`             `/kitchens`                     Semua role sesuai Daftar dapur
                                                    scope             

  `GET`             `/schools`                      Semua role sesuai Daftar sekolah
                                                    scope             

  `POST`            `/batches`                      `KITCHEN`         Buat batch

  `GET`             `/batches`                      `KITCHEN`, role   Daftar/detail batch
                                                    sesuai scope      

  `POST`            `/deliveries`                   `KITCHEN`         Buat pengiriman

  `GET`             `/deliveries`                   `KITCHEN`,        Daftar pengiriman
                                                    `SCHOOL` sesuai   
                                                    scope             

  `POST`            `/deliveries/:id/receive`       `SCHOOL`          Konfirmasi penerimaan

  `PATCH`           `/deliveries/:id/consumption`   `SCHOOL`          Ubah status konsumsi

  `POST`            `/reports`                      `SCHOOL`          Buat laporan gejala

  `PATCH`           `/reports/:id`                  `SCHOOL` pemilik  Perbarui laporan

  `GET`             `/incidents`                    `HEALTH`, `ADMIN` Daftar kejadian
                                                    sesuai scope      

  `GET`             `/incidents/:id`                `HEALTH`, `ADMIN` Detail kejadian
                                                    sesuai scope      

  `PATCH`           `/incidents/:id/status`         `HEALTH`          Ubah status kejadian

  `POST`            `/incidents/:id/actions`        `HEALTH`          Tugaskan tindakan

  `PATCH`           `/actions/:id`                  `HEALTH` atau     Akui/selesaikan/batalkan
                                                    assignee sesuai   tindakan
                                                    policy            

  `GET`             `/incidents/:id/summary`        `HEALTH`          Ringkasan HTML siap cetak

  `GET`             `/notifications`                Semua role sesuai Daftar notifikasi
                                                    scope             

  `PATCH`           `/notifications/:id`            Pemilik           Tandai dibaca/diakui
                                                    notifikasi        

  `GET`             `/config`                       `ADMIN`           Baca parameter

  `PUT`             `/config`                       `ADMIN`           Ubah parameter

  `POST`            `/dev/scenario/seed`            `ADMIN`,          Seed demo
                                                    non-production    

  `POST`            `/dev/scenario/reset`           `ADMIN`,          Reset demo
                                                    non-production    
  ----------------------------------------------------------------------------------------------

Endpoint detail/filter yang belum tercantum secara eksplisit di PRD
(misalnya `GET /batches/:id`) adalah rekomendasi implementasi dan dapat
disesuaikan tanpa mengubah kemampuan inti.

## 4. Auth

### `POST /auth/login`

Request:

``` json
{
  "email": "guru.s1@example.test",
  "password": "demo-password"
}
```

Response `200`:

``` json
{
  "data": {
    "accessToken": "<jwt>",
    "tokenType": "Bearer",
    "expiresIn": 43200,
    "user": {
      "id": "uuid",
      "name": "PIC Sekolah A",
      "email": "guru.s1@example.test",
      "role": "SCHOOL",
      "orgRef": "school-uuid"
    }
  },
  "meta": { "requestId": "req_01..." }
}
```

Token berlaku 12 jam sesuai PRD. Kredensial salah menghasilkan
`401 INVALID_CREDENTIALS` tanpa membocorkan apakah email terdaftar.

### `GET /me`

Response `200`: user object yang sama tanpa password/hash/token.

## 5. Master data

### `GET /kitchens`, `GET /schools`

Query opsional: `page`, `limit`, `search`, `regionId`. Hasil dibatasi
role dan wilayah actor. Jangan mengandalkan filter dari client sebagai
authorization.

Response item minimal: - Kitchen: `id`, `name`, `regionId`,
`capacityPortions` - School: `id`, `name`, `regionId`, `level`,
`studentCount` (bila dibutuhkan), `picUserId` (jangan tampilkan ke role
yang tidak membutuhkan)

## 6. Batch

### `POST /batches` --- `KITCHEN`

``` json
{
  "menu": "Nasi, ayam, sayur",
  "cookedAt": "2026-10-11T03:15:00.000Z",
  "ingredients": [
    {
      "name": "Ayam",
      "supplierId": "supplier-uuid",
      "lotRef": "LOT-2026-1011-A"
    },
    {
      "name": "Beras"
    }
  ]
}
```

`kitchenId` dan `createdBy` ditentukan dari actor login, bukan dipercaya
dari body.

Response `201` berisi batch dengan `id`, `code`, `kitchenId`, `menu`,
`cookedAt`, `ingredients`, `createdAt`.

### `GET /batches`

Query: `page`, `limit`, `from`, `to`. Hanya batch dalam scope dapur yang
berwenang.

## 7. Delivery / pengiriman

### `POST /deliveries` --- `KITCHEN`

``` json
{
  "schoolId": "school-uuid",
  "dispatchedAt": "2026-10-11T04:00:00.000Z",
  "items": [
    { "batchId": "batch-uuid", "portions": 120 },
    { "batchId": "batch-uuid-2", "portions": 30 }
  ]
}
```

Aturan: - sekolah tujuan harus berada dalam relasi layanan dapur; -
seluruh batch harus dimiliki dapur actor; - satu pengiriman dapat memuat
satu atau lebih batch; - perubahan dicatat pada audit log.

Response `201` memuat `id`, `schoolId`, `kitchenId`, `dispatchedAt`,
`receivedAt`, `consumptionStatus` (`UNKNOWN` sebagai default), dan
`items`.

### `GET /deliveries`

Query: `schoolId`, `kitchenId`, `from`, `to`, `page`, `limit`. Scope
tetap ditentukan server.

### `POST /deliveries/:id/receive` --- `SCHOOL`

``` json
{
  "receivedAt": "2026-10-11T04:20:00.000Z"
}
```

Actor sekolah berasal dari token. Server memvalidasi bahwa delivery
ditujukan ke sekolah actor. Jika timestamp tidak dikirim, server memakai
waktu server. Simpan `receivedBy` dan waktu penerimaan.

### `PATCH /deliveries/:id/consumption` --- `SCHOOL`

``` json
{
  "consumptionStatus": "NOT_SERVED",
  "servedAt": null
}
```

`servedAt` opsional dan hanya relevan jika konsumsi telah dimulai.
Setiap perubahan menyimpan actor, waktu, dan audit log. Status boleh
diperbarui sebelum/sesudah laporan sesuai PRD.

## 8. Laporan gejala

### `POST /reports` --- `SCHOOL`

Headers wajib: `Idempotency-Key`.

``` json
{
  "deliveryId": "delivery-uuid",
  "affectedCount": 8,
  "referredCount": 1,
  "symptoms": ["NAUSEA", "ABDOMINAL_PAIN"],
  "eatenAt": "2026-10-11T05:00:00.000Z",
  "onsetAt": "2026-10-11T07:15:00.000Z",
  "note": "Beberapa siswa mengeluh mual"
}
```

`deliveryId` boleh tidak ada bila sekolah tidak mengetahui pengiriman.
`schoolId`, `reportedBy`, `reportedAt`, `idempotencyKey`, dan `version`
ditentukan/diatur server.

Validasi: - `affectedCount` integer positif; - `referredCount` integer
non-negatif dan tidak lebih besar dari `affectedCount`; - `symptoms`
berisi satu atau lebih enum yang diizinkan; - `note` singkat, tanpa
nama/identitas siswa; - `onsetAt` lebih awal daripada `eatenAt` memicu
warning non-blocking, bukan penolakan otomatis; - laporan tidak menunggu
persetujuan dapur.

Response `201`:

``` json
{
  "data": {
    "report": {
      "id": "report-uuid",
      "schoolId": "school-uuid",
      "affectedCount": 8,
      "referredCount": 1,
      "symptoms": ["NAUSEA", "ABDOMINAL_PAIN"],
      "eatenAt": "2026-10-11T05:00:00.000Z",
      "onsetAt": "2026-10-11T07:15:00.000Z",
      "reportedAt": "2026-10-11T07:20:00.000Z",
      "version": 1
    },
    "incident": {
      "id": "incident-uuid",
      "status": "INITIAL_REPORT",
      "severity": "MEDIUM"
    },
    "linkage": {
      "confidence": "HIGH",
      "reason": "BATCH_RECEIVED_BY_SCHOOL",
      "candidateBatchIds": ["batch-uuid"],
      "relatedSchoolIds": ["school-b-uuid", "school-c-uuid"],
      "warnings": []
    },
    "deduplicated": false
  },
  "meta": { "requestId": "req_01..." }
}
```

Contoh di atas adalah bentuk kontrak, bukan hasil penilaian medis.
`confidence` dan `reason` harus dijelaskan sebagai hubungan data
tercatat; tidak boleh menyimpulkan penyebab.

Perilaku idempotency: - key sama + payload sama: kembalikan hasil
resource yang sama, jangan buat record baru; - key sama + payload
berbeda: `409 IDEMPOTENCY_KEY_REUSED`; - sekolah dan delivery sama dalam
30 menit: proses sebagai pembaruan sesuai aturan deduplikasi, bukan
menambahkan korban ke jumlah sebelumnya; - nilai jumlah terbaru
menggantikan nilai sebelumnya.

### `PATCH /reports/:id`

Request:

``` json
{
  "affectedCount": 10,
  "referredCount": 2,
  "symptoms": ["NAUSEA", "VOMITING"],
  "note": "Pembaruan jumlah laporan"
}
```

Field yang boleh diubah perlu dibatasi pada field laporan yang memang
dapat diperbarui. Actor harus pemilik sekolah laporan. Perubahan
menaikkan `version`, memperbarui hasil penautan/incident bila perlu, dan
dicatat di audit log. Konflik versi dapat menghasilkan
`409 VERSION_CONFLICT`.

## 9. Incidents / kejadian

### `GET /incidents`

Query: `status`, `regionId`, `severity`, `page`, `limit`, `from`, `to`.
Role HEALTH hanya melihat wilayah kewenangannya; ADMIN mengikuti policy
admin.

Response item list: `id`, `code`, `status`, `severity`, `openedAt`,
`closedAt`, `primaryKitchen`, `affectedCount`, `schoolCount`,
`unconfirmedInformationCount`.

### `GET /incidents/:id`

Detail meliputi: - ringkasan laporan dan angka agregat; - timeline; -
daftar laporan yang ditautkan, beserta `linkReason` dan `confidence`; -
batch dan pengiriman terkait; - penerima terkait, status konsumsi, dan
dasar keterkaitan; - actions dan notifications; - informasi yang belum
lengkap.

Contoh redaksi: "Sekolah A dan B tercatat menerima batch yang sama."
Hindari: "Batch ini menyebabkan keracunan."

### `PATCH /incidents/:id/status` --- `HEALTH`

``` json
{
  "status": "UNDER_INVESTIGATION",
  "note": "Laporan dikonfirmasi untuk ditindaklanjuti"
}
```

Perubahan status harus mengikuti transisi yang diizinkan dan menyimpan
actor, waktu, note, serta audit log.

### `POST /incidents/:id/actions` --- `HEALTH`

``` json
{
  "type": "MONITOR_RECIPIENTS",
  "assigneeUserId": "user-uuid",
  "dueAt": "2026-10-11T08:00:00.000Z",
  "note": "Pantau penerima terkait sesuai SOP"
}
```

Response `201`: action dengan status `OPEN`, assignee, dueAt,
timestamps, dan catatan.

### `PATCH /actions/:id`

``` json
{
  "status": "ACKNOWLEDGED",
  "note": "Tugas diterima"
}
```

Status yang didukung: `OPEN`, `ACKNOWLEDGED`, `DONE`, `CANCELLED`.
Perubahan status wajib mencatat actor dan waktu. Hanya HEALTH atau
assignee yang berwenang boleh melakukan transisi sesuai policy. Riwayat
tidak dihapus; buat event riwayat baru untuk setiap perubahan.

### `GET /incidents/:id/summary`

Menghasilkan halaman HTML siap cetak dengan kronologi, tautan beserta
alasannya, data belum lengkap, tindakan dan pelaku, serta penafian bahwa
tautan merupakan sinyal investigasi. PDF dapat dibuat melalui fitur
print browser pada MVP.

## 10. Notifications

### `GET /notifications`

Query: `status`, `page`, `limit`. Hanya notifikasi milik actor.

### `PATCH /notifications/:id`

``` json
{
  "state": "ACKNOWLEDGED"
}
```

`state`: `READ` atau `ACKNOWLEDGED`. Jangan menyamakan `SENT`, `READ`,
dan `ACKNOWLEDGED`. Pengakuan notifikasi tidak otomatis menyelesaikan
action terkait.

## 11. Config dan simulasi

### `GET /config` --- `ADMIN`

Response berisi parameter yang aman ditampilkan, misalnya:

``` json
{
  "data": {
    "traceWindowHours": 72,
    "severityThresholds": {
      "mediumAffectedCount": 5,
      "highAffectedCount": 10
    },
    "actionAcknowledgementMinutes": 30
  }
}
```

Angka ambang severity di atas hanyalah contoh bentuk payload dan **bukan
nilai resmi**. Semua parameter simulasi harus dikonfirmasi dengan
petugas kesehatan.

### `PUT /config` --- `ADMIN`

``` json
{
  "traceWindowHours": 72,
  "severityThresholds": {
    "mediumAffectedCount": 5,
    "highAffectedCount": 10
  },
  "actionAcknowledgementMinutes": 30
}
```

Validasi rentang nilai, simpan actor/waktu, dan tulis audit log.
Parameter yang tidak didukung tidak boleh diterima diam-diam.

### `POST /dev/scenario/seed` dan `/dev/scenario/reset`

Khusus Admin di development/demo. Harus dinonaktifkan di production.
Seed/reset idempotent, target selesai dalam 10 detik atau kurang sesuai
target PRD, dan hasilnya hanya data fiktif.

## 12. Zod schema requirements

Setiap endpoint memiliki schema untuk: - path params (`:id` UUID); -
query params (pagination, filter, sort allowlist); - request body; -
response DTO bila diperlukan untuk mencegah kebocoran field internal.

Aturan umum: - tolak field tak dikenal (`.strict()`) untuk request
sensitif, atau dokumentasikan strategi strip secara konsisten; - parse
angka query dari string secara eksplisit; - validasi ISO datetime dan
timezone; - batasi pagination, panjang teks, jumlah array; - `PATCH`
memakai schema parsial yang menolak payload kosong; - validasi
cross-field seperti `referredCount <= affectedCount`; - validasi
resource ownership dan relasi service dilakukan di service, bukan hanya
Zod.

## 13. Swagger checklist

Untuk setiap endpoint dokumentasikan: - tag/module; - ringkasan dan
deskripsi; - auth bearer dan role; - path/query/body schema; - response
sukses dan setiap error relevan; - enum dan contoh request/response; -
header `Idempotency-Key` untuk laporan; - catatan bahwa hasil penautan
adalah sinyal, bukan diagnosis.

## 14. Open decisions

1.  Bentuk final `IncidentStatus` dan transisi status.
2.  Detail strategi idempotency key: TTL, scope, dan penyimpanan
    response.
3.  Aturan pasti severity dan ambang parametris.
4.  Apakah update report memerlukan optimistic concurrency via
    `version`.
5.  Scope akses ADMIN lintas wilayah.
6.  Format response pagination dan error final.
7.  Apakah endpoint summary menggunakan HTML saja atau juga file PDF
    server-side.
8.  Apakah outbox diperlukan untuk menjamin notifikasi setelah transaksi
    commit.
9.  ~~Apakah `routes/` dipertahankan sebagai manifest atau route cukup
    didefinisikan di controller NestJS.~~ **Selesai:** `<entity>.routes.ts`
    berisi konstanta path yang dipakai controller. Route tetap
    dideklarasikan lewat decorator NestJS. Lihat `docs/architecture.md`.
