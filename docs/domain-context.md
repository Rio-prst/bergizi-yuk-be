# Domain Context

Dokumen ini menjelaskan dunia nyata di balik BergiziYuk supaya agent tidak menebak istilah atau batasan produk. Sumber lengkap: PRD BergiziYuk v1.0 (bagian 2, 5, 7).

## Masalah yang diselesaikan

Program Makan Bergizi Gratis (MBG) dijalankan lewat dapur-dapur penyedia (SPPG). Ketika terjadi keracunan makanan, satu dapur bisa memengaruhi banyak sekolah sekaligus, dan gejalanya bisa muncul tertunda. Laporan gejala dari sekolah, catatan produksi dapur, dan tindak lanjut petugas berada di kanal berbeda, sehingga menghubungkannya sering dikerjakan manual setelah kejadian membesar.

BergiziYuk menghubungkan tiga pihak dalam satu alur: **dapur** (apa yang dimasak dan dikirim), **sekolah** (siapa yang menerima, makan, dan bergejala), dan **petugas kesehatan** (siapa yang bertindak). Yang dijawab setelah laporan pertama masuk:

1. Makanan (batch) mana yang perlu ditelusuri?
2. Sekolah mana yang menerima makanan terkait?
3. Siapa yang bertanggung jawab?
4. Apakah mereka sudah bertindak?

## Posisi produk

- Prototipe mandiri yang **melengkapi** SKDR Kemenkes dan Radar MBG BGN, bukan menggantikannya.
- Sistem yang sudah ada: Radar MBG (portal publik menu dan dapur), monitoring produksi BGN, SKDR (pelaporan KLB yang datanya dibagikan ke BGN), serta aplikasi dapur swasta (checklist HACCP, pelacakan pengiriman).
- Pembeda yang diuji (**hipotesis, belum terbukti**): laporan gejala awal dari sekolah langsung terhubung ke catatan makanan yang diterima di level batch, menemukan penerima terkait, dan mencatat tindak lanjut tiap pihak sampai selesai.
- Jangan pernah menulis klaim "belum ada sistem seperti ini" di kode, teks UI, atau dokumentasi.

## Glosarium

| Istilah | Arti |
|---|---|
| MBG | Program Makan Bergizi Gratis |
| BGN | Badan Gizi Nasional, penyelenggara program |
| SPPG | Satuan Pelayanan Pemenuhan Gizi: dapur penyedia MBG. Di kode disebut `kitchen` |
| Batch | Satu kali proses masak di satu dapur (menu, jam selesai masak, bahan). Bukan sama dengan menu: menu yang sama bisa dimasak dalam batch berbeda |
| Pengiriman (`delivery`) | Apa yang dikirim dapur ke **satu** sekolah pada satu waktu. Satu pengiriman bisa memuat **banyak batch** (`delivery_items`) |
| Status konsumsi | Kondisi makanan di sekolah: `NOT_SERVED`, `PARTIAL`, `CONSUMED`, `UNKNOWN` |
| PIC Sekolah | Guru atau kepala sekolah yang menerima, melapor, dan menindaklanjuti. Di kode peran `SCHOOL` |
| Petugas Kesehatan | Puskesmas dan Dinkes (digabung jadi satu peran di MVP). Peran `HEALTH` |
| Laporan gejala (`symptom_report`) | Laporan jumlah anak bergejala dari sekolah, tanpa identitas siswa |
| Kejadian (`incident`) | Berkas kasus yang dibuka sistem dari laporan, memuat tautan, penerima terkait, aksi, dan linimasa |
| Tautan (`link`) | Hubungan antara laporan dan batch, beserta alasan dan tingkat keyakinan |
| Penerima terkait | Sekolah lain yang menerima batch yang sama (atau kemungkinan terkait) |
| Aksi (`action`) | Tindak lanjut yang ditugaskan, dengan status dan catatan |
| Lot | Identitas pengiriman bahan baku. Opsional di MVP |
| SKDR | Sistem Kewaspadaan Dini dan Respons milik Kemenkes |
| KLB | Kejadian Luar Biasa |
| Dinkes | Dinas Kesehatan |

## Peran pengguna

| Peran | Enum | Siapa | Kebutuhan utama |
|---|---|---|---|
| Petugas Dapur | `KITCHEN` | Kepala atau staf SPPG | Mencatat batch dan pengiriman dengan sesedikit mungkin isian; melihat kejadian yang melibatkan dapurnya |
| PIC Sekolah | `SCHOOL` | Guru atau kepala sekolah | Konfirmasi terima, mengatur status konsumsi, melapor gejala dengan cepat dari ponsel, menerima arahan tindak lanjut |
| Petugas Kesehatan | `HEALTH` | Puskesmas dan Dinkes | Menerima peringatan, mengonfirmasi laporan, melihat keterkaitan dan penerima terkait, menugaskan dan mencatat tindakan, membuat ringkasan investigasi |
| Admin | `ADMIN` | Pengelola sistem | Master data, parameter, dan skenario demo |

Akses data dibatasi per peran dan per wilayah. Detail di `docs/api-contract.md`.

## Alur utama

1. **Pagi:** Petugas Dapur membuat batch dan pengiriman ke tiap sekolah.
2. **Terima:** PIC Sekolah mengonfirmasi terima dan mengatur status konsumsi.
3. **Gejala muncul:** PIC Sekolah memilih pengiriman, mengisi jumlah anak, gejala, waktu makan, dan waktu gejala pertama, lalu mengirim laporan.
4. **Kejadian terbuka:** sistem langsung membuat kejadian, menautkan ke batch, mencari penerima terkait, dan memberi tahu Petugas Kesehatan wilayah.
5. **Tindak lanjut:** Petugas Kesehatan mengonfirmasi laporan, melihat saran sistem, lalu menugaskan aksi atau mengirim imbauan ke sekolah terkait. Pihak terkait mengonfirmasi dan mencatat tindakannya.
6. **Laporan susulan:** sekolah lain melapor dan digabung ke kejadian yang sama tanpa hitung ganda.
7. **Penutupan:** Petugas Kesehatan mengubah status kejadian dan mencetak ringkasan investigasi.

## Situasi nyata yang memengaruhi desain

- Guru melapor **dalam kondisi mendesak dari ponsel** dengan sinyal yang bisa buruk. Karena itu form laporan pendek, boleh tanpa pengiriman terpilih, dan pengiriman ulang tidak boleh membuat laporan ganda (idempotent).
- Satu laporan bisa mewakili banyak anak yang butuh pertolongan. Karena itu **laporan pertama langsung memicu respons**; laporan kedua bukan syarat.
- Gejala keracunan bisa muncul dari beberapa jam sampai beberapa hari setelah makan. Karena itu waktu makan, waktu gejala pertama, dan waktu lapor dicatat terpisah, dan tidak ada penolakan berdasarkan satu jendela jam.
- Sekolah lain yang menerima batch yang sama belum tentu sudah makan. Karena itu status konsumsi menentukan jenis saran.
- Pesan terkirim belum berarti masalah ditangani. Setiap peringatan butuh pengakuan dan tindakan tercatat.

## Batasan produk (tidak boleh dilanggar)

- Tidak menentukan penyebab keracunan. Keluaran hanya menyatakan keterkaitan dan hal yang perlu diperiksa. Redaksi yang boleh dan dilarang ada di `docs/business-rules.md`.
- Tidak mendiagnosis siswa dan tidak menyimpan identitas atau data medis individual siswa.
- Imbauan ke sekolah bukan perintah. Kewenangan menunda penyajian ada pada pihak berwenang menurut SOP, bukan pada sistem.
- Tidak menggantikan SKDR atau Radar MBG. Integrasi langsung dengan keduanya di luar MVP.
- Tidak ada sensor IoT, machine learning, atau WhatsApp Business API resmi di MVP.
- Data demo sepenuhnya fiktif.

## Urgensi (untuk bahan narasi, bukan logika sistem)

- Sejak 22 Juli 2026, BGN mencatat 5.482 korban dalam 71 kejadian dari 62 dapur (laporan 4 September 2026).
- Kejadian besar: 707 orang di Semarang, 566 di Sidoarjo, 411 di Batang. Di Sidoarjo, siswa dari 19 lembaga lain juga mengeluh setelah makan menu yang sama.
- BGN menaikkan status keracunan MBG menjadi "kejadian fatal" pada 3 Agustus 2026.

Referensi sumber ada di PRD bagian 24.