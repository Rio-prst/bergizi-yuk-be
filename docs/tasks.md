# Tasks

Backlog implementasi BergiziYuk. Satu tugas dikerjakan sekali jalan, mengikuti
alur kerja di `AGENTS.md`.

Status: `todo` | `in-progress` | `done` | `blocked`

## Fondasi

| ID | Task | Status | Catatan |
|---|---|---|---|
| F0 | Scaffold aplikasi (config build, env, docker, app module, health check) | done | Struktur `src/<module>/`, integrasi di dalam module sebagai `<name>.repository.integration-spec.ts` |
| F0.1 | Tulis `prisma/schema.prisma` | todo | Tertahan open decision `docs/database.md` bagian 8 |
| F0.2 | Tulis migrasi awal | todo | Setelah F0.1, `pnpm exec prisma migrate dev` oleh developer |
| F0.3 | Bootstrap admin | todo | Data awal dibuat lewat bootstrap admin, bukan seed |
| F0.4 | Tulis `test/jest-e2e.json` | todo | Butuh DB test aktif |

## Fitur

Estimasi dan kriteria selesai mengikuti PRD bagian 14.

| ID | Task | Estimasi | Status | Ketergantungan |
|---|---|---|---|---|
| F1 | Auth dan role | 8 jam | todo | F0.2, keputusan scope ADMIN lintas wilayah |
| F2 | Master data (regions, kitchens, schools, health-units, suppliers, kitchen-school-service) | 10 jam | todo | F0.2 |
| F3 | Batch dan pengiriman | 24 jam | todo | F2 |
| F4 | Receipt dan status konsumsi | 8 jam | todo | F3 |
| F5 | Laporan gejala (idempotent) | 22 jam | todo | F0.4, keputusan strategi idempotency |
| F6 | Linking engine | 28 jam | todo | F3, keputusan bentuk final confidence |
| F7 | Related recipients | 10 jam | todo | F6 |
| F8 | Notification dan actions | 22 jam | todo | F5, keputusan outbox |
| F9 | Dashboard dan detail | 26 jam | todo | F7 |
| F10 | Audit log | 8 jam | todo | F0.2 |
| F11 | Config dan simulasi | 8 jam | todo | F2, keputusan ambang severity |

##Open decisions yang memblokir

Nomor rujukan: `C` = `docs/api-contract.md` bagian 14, `D` = `docs/database.md` bagian 8.

| ID | Keputusan | Blokir | Ref |
|---|---|---|---|
| Q1 | Bentuk final `IncidentStatus` dan transisi status | F5, F8 | C1 |
| Q2 | Strategi idempotency key: TTL, scope, penyimpanan response | F5 | C2, D8 |
| Q3 | Aturan pasti severity dan ambang parametris | F11 | C3, D9 |
| Q4 | Optimistic concurrency via `version` pada update report | F5 | C4 |
| Q5 | Scope akses ADMIN lintas wilayah | F1 | C5 |
| Q6 | Format response pagination dan error final | F2 | C6 |
| Q7 | Endpoint summary HTML saja atau plus PDF server-side | F9 | C7 |
| Q8 | Apakah outbox diperlukan untuk notifikasi setelah commit | F8 | C8 |
| Q9 | Apakah `routes/` dipertahankan sebagai manifest | selesai | C9 |
| Q10 | `users.org_ref` polymorphic atau FK eksplisit | F0.1 | D1 |
| Q11 | Satu laporan boleh punya beberapa delivery; bedakan pilihan user vs hasil mesin | F5 | D2 |
| Q12 | Confidence berupa label atau skor numerik | F6 | D3 |
| Q13 | Daftar final status kejadian, jenis tindakan, jenis unit kesehatan, status lot, kategori gejala | F0.1 | D4 |
| Q14 | Apakah perubahan status konsumsi perlu tabel history | F4 | D5 |
| Q15 | Setiap perubahan action dicatat di `action_events` atau cukup audit log | F8 | D6 |
| Q16 | `incident_recipients` boleh punya beberapa delivery per sekolah | F7 | D7 |

## Definition of done

Lihat `docs/architecture.md` bagian 12.