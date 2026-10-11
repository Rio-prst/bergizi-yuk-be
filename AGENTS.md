# AGENTS.md

Panduan kerja untuk AI agent di repositori **BergiziYuk Backend**. Baca file ini dulu, lalu baca dokumen yang relevan dengan tugasmu sebelum menulis kode.

## Ringkasan proyek

BergiziYuk adalah backend API untuk sistem yang menelusuri laporan gejala dari sekolah ke batch makanan MBG. Satu laporan gejala langsung membuka kejadian, menautkan laporan ke batch yang benar-benar diterima sekolah, menemukan sekolah penerima terkait, memberi tahu petugas kesehatan, dan mencatat tindak lanjut sampai selesai.

Konteks: prototipe Hackathon JOINTS UGM 2026 (tema Healthcare). Semua data demo fiktif. Hasil penelusuran adalah **sinyal untuk diinvestigasi, bukan penentu penyebab keracunan**.

Stack: Node.js 22, NestJS, TypeScript, PostgreSQL 16 + Prisma, Redis 7 + BullMQ, Zod + nestjs-zod, Swagger (`@nestjs/swagger`), Jest, pnpm, Docker Compose (PostgreSQL dan Redis).

## Dokumen yang harus dibaca

| Kalau tugasmu menyangkut | Baca |
|---|---|
| Istilah, pengguna, batasan produk | `docs/domain-context.md` |
| Aturan penautan, status, parameter, kasus uji | `docs/business-rules.md` |
| Struktur module, layer, pola kode, strategi test | `docs/architecture.md` |
| Perilaku endpoint, akses per peran, format error | `docs/api-contract.md` |
| Urutan kerja, backlog, prioritas | `docs/tasks.md` |
| Model data (sumber kebenaran) | `prisma/schema.prisma` |
| Skema request/response per endpoint | Swagger di `/docs` (dihasilkan dari skema Zod) |

## Perintah

```bash
docker compose up -d            # Redis only (PostgreSQL is hosted on Supabase)
pnpm install
pnpm exec prisma migrate dev    # apply migrations
pnpm start:dev                  # dev server (http://localhost:3000, Swagger at /docs)

pnpm typecheck                  # typecheck without emit
pnpm lint
pnpm test                       # unit tests (service, controller, linking engine)
pnpm test:integration           # repository tests, needs DATABASE_URL_TEST
pnpm verify                     # typecheck + lint + test
```

## Arsitektur singkat

Setiap module di `src/<name>/` memakai layer yang sama:

```text
dto/               Zod schemas (nestjs-zod) for input validation
interfaces/        Contracts for repository and service (+ injection tokens)
<name>.repository.ts            DB queries only (Prisma)
<name>.repository.integration-spec.ts   Real DB, never mocked
<name>.service.ts                Business rules
<name>.controller.ts             HTTP handlers + Swagger decorators
<name>.routes.ts                 Route path constants
<name>.module.ts                 Wiring (DI)
__tests__/                       Unit tests (repository is mocked)
```

Arah dependensi: `controller -> service (via interface) -> repository (via interface)`. Detail dan contoh kode ada di `docs/architecture.md`.

## Aturan wajib

**Produk dan domain**
- Jangan mengubah aturan R1 sampai R10 di `docs/business-rules.md` tanpa bertanya. Itu keputusan produk, bukan keputusan implementasi.
- Keluaran penelusuran tidak boleh menyebut penyebab keracunan (mis. "bahan X penyebab"). Pakai redaksi di `docs/business-rules.md`.
- Jangan menyimpan nama atau identitas siswa. Hanya jumlah dan kategori gejala.
- Imbauan ke sekolah bersifat saran sesuai SOP, bukan perintah dari sistem. Imbauan baru dikirim ke sekolah setelah petugas kesehatan menyetujuinya.
- Penautan memakai **batch yang tercatat diterima**, bukan kesamaan nama menu.

**Kode**
- Validasi input memakai **Zod lewat nestjs-zod**. Jangan pakai class-validator.
- Controller tidak berisi business rules. Service tidak memanggil Prisma langsung. Repository tidak berisi business rules.
- Service dan controller bergantung pada **interface** (lewat injection token), bukan class konkret.
- Mesin penautan (`linking/`) adalah **fungsi murni** tanpa akses DB. Tulis test-nya lebih dulu dari kasus di `docs/business-rules.md`.
- Tidak ada Prisma seed. Data awal dibuat lewat bootstrap admin dan endpoint `dev-scenario` (lihat `docs/architecture.md`).
- Jangan mengubah migrasi yang sudah di-commit. Buat migrasi baru.
- Jangan menambah dependency baru tanpa bertanya.
- Lakukan perubahan kecil dan terarah. Jangan menulis ulang file yang tidak terkait dengan tugas.
- Komentar kode memakai bahasa Inggris. Waktu disimpan dan dikirim dalam UTC (ISO 8601).
- Jangan commit `.env` atau rahasia apa pun.

## Alur kerja per tugas

1. Ambil satu tugas dari `docs/tasks.md`. Kerjakan satu tugas sekali jalan.
2. Baca dokumen yang relevan (tabel di atas).
3. Tulis test dulu untuk perilaku yang berubah (unit untuk service/controller, integration untuk repository, kasus T1 sampai T12 untuk mesin penautan).
4. Implementasi sampai test lulus.
5. Perbarui dekorator Swagger bila endpoint berubah.
6. Jalankan `pnpm verify` (dan `pnpm test:integration` bila menyentuh repository).
7. Perbarui dokumen di `docs/` bila perilaku, aturan, atau keputusan berubah.

## Definition of done

- `pnpm verify` lulus. `pnpm test:integration` lulus bila repository berubah.
- Test baru mencakup jalur sukses dan minimal satu jalur gagal.
- Endpoint baru atau yang berubah punya dekorator Swagger (ringkasan, skema, respons error, autentikasi).
- Tidak ada pelanggaran aturan di bagian "Aturan wajib".
- Dokumen terkait sudah diperbarui.

## Kalau ragu

Jangan menebak. Tanyakan dulu bila ada yang ambigu, terutama soal aturan bisnis, redaksi hasil penelusuran, atau cakupan tugas. Jika tugas membutuhkan keputusan produk yang belum ada di dokumen, tulis asumsimu secara eksplisit dan minta konfirmasi.