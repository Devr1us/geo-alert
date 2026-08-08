# Conversation Prompts Log — GeoAlert

Dokumentasi riwayat seluruh prompt pengguna (*user request*) dalam sesi pengembangan GeoAlert.

## Prompt 1

```text
Lengkapi kekurangan-kekurangan berikut pada website GeoAlert (Laravel + React SPA) tanpa mengubah desain visual yang sudah ada. Kerjakan per bagian, dan setiap bagian yang butuh data yang belum tersedia harus tetap jujur ke pengguna (beri label kecil "data contoh" / "belum tersedia"), jangan berpura-pura live padahal statis.

1. Lokasi & status wilayah nyata
Ganti kartu "Lokasi Anda" di hero (LandingPage.jsx) yang saat ini hardcoded "Jakarta Selatan / Aman" dengan data nyata: minta izin geolocation browser (navigator.geolocation), reverse-geocode jadi nama kota/kabupaten, lalu hitung status wilayah (Aman/Waspada/Bahaya) berdasarkan jarak pengguna ke titik bencana aktif dari data yang sudah difetch di MapPage. Tangani kasus izin ditolak dengan fallback yang jelas (misal "Aktifkan lokasi untuk melihat status wilayah Anda").

2. Notifikasi aktif
Implementasikan langkah "Aktifkan Notifikasi" yang saat ini hanya teks di timeline: minta izin Notification API browser, dan jika ada bencana baru dengan risiko warning/danger di radius wilayah pengguna, tampilkan browser notification. Simpan preferensi (aktif/nonaktif) di localStorage.

3. Sumber data bencana selain gempa
Untuk banjir, longsor, dan cuaca ekstrem di MapPage.jsx yang sekarang 100% data contoh statis: cari dan integrasikan API publik resmi yang tersedia (misalnya data BNPB/InaRISK, atau BMKG untuk cuaca ekstrem/peringatan dini cuaca). Buat proxy endpoint Laravel seperti pola /api/bmkg/* yang sudah ada di routes/web.php. Jika suatu jenis bencana memang tidak punya API publik yang bisa diakses, biarkan sebagai data contoh tapi label "(contoh tampilan data)" harus selalu terlihat jelas, bukan tersembunyi.

4. Statistik landing page dari data asli
Ganti angka statis "12 peringatan aktif" dan "38 provinsi terpantau" di LandingPage.jsx dengan angka yang dihitung dari data bencana aktif hasil fetch (jumlah kejadian aktif, jumlah provinsi unik yang punya kejadian).

5. Pencarian lokasi dengan geocoding
Kolom pencarian di MapPage.jsx saat ini hanya filte
<truncated 1618 bytes>
n. Sesuaikan isinya dengan konten GeoAlert.

11. Dukungan offline untuk panduan mitigasi
FAQ mengklaim panduan mitigasi bisa jadi "referensi offline" tapi tidak ada service worker. Tambahkan service worker sederhana (via Vite PWA plugin) yang meng-cache halaman panduan mitigasi (MitigationModal.jsx) agar benar-benar bisa dibuka tanpa koneksi.

12. Caching & rate limiting proxy BMKG
Endpoint /api/bmkg/* di routes/web.php saat ini set header Cache-Control tapi tidak benar-benar cache di server — setiap request selalu hit BMKG langsung. Tambahkan Cache::remember dengan TTL yang sesuai (misalnya 60–300 detik sesuai endpoint) dan rate limiting dasar (Laravel throttle middleware) supaya proxy tidak disalahgunakan.

13. Testing
Tambahkan test dasar (Feature test) untuk endpoint proxy BMKG (routes/web.php) dan untuk endpoint subscribe newsletter (poin 7), menggantikan/menambah tests/Feature/ExampleTest.php yang masih bawaan Laravel.

Kerjakan bertahap dan konfirmasi ke saya sebelum pindah ke bagian berikutnya jika suatu bagian butuh keputusan (misalnya pilihan API pihak ketiga atau API key yang perlu saya sediakan).
```

---

## Prompt 2

```text
Buatkan website sistem peringatan dini bencana alam Indonesia bernama GeoAlert, terdiri dari 2 halaman: Landing Page dan Halaman Peta Bencana.

Konteks produk. GeoAlert menampilkan informasi bencana alam di Indonesia secara real-time dengan menarik data dari API BMKG dan sumber publik lainnya. Target pengguna adalah masyarakat umum Indonesia yang ingin tahu kondisi bencana di wilayahnya sekaligus tahu apa yang harus dilakukan saat terjadi bencana.

Arah desain. Palet warna: navy tua #0E2A5C sebagai warna utama, oranye-terracotta #C0492B khusus untuk elemen peringatan dan bahaya, krem #F7F2EA sebagai latar terang, biru muda #4A90D9 untuk status siaga. Warna oranye HANYA dipakai untuk alert, tombol aksi utama, dan angka statistik penting — jangan dipakai sebagai dekorasi, supaya saat ada bencana sungguhan warnanya langsung menarik perhatian. Gunakan font serif untuk judul besar agar terasa resmi dan terpercaya, font sans-serif untuk isi teks, dan font monospace untuk data seperti waktu, koordinat, dan magnitudo gempa. Nuansa keseluruhan harus terasa seperti sistem pemantauan resmi yang bisa dipercaya, bukan aplikasi marketing: bersih, lapang, dengan hierarki teks yang tegas. Wajib responsif sampai layar ponsel, kontras teks memenuhi standar keterbacaan, dan hormati

Struktur Landing Page, urut dari atas ke bawah:

Navbar sticky - logo GeoAlert, menu (Beranda, Tentang, Cara Penggunaan, Tanya AI, Peta Bencana, Kontak), tombol "Pantau Sekarang" warna oranye di kanan. Di layar ponsel berubah jadi menu hamburger.

Hero - judul besar "GeoAlert", subjudul "Deteksi Dini, Lindungi Diri", satu paragraf penjelasan singkat, dan dua tombol: primer "Cek Bencana Terdekat" dan sekunder "Pelajari Lebih Lanjut". Di bawah tombol, tambahkan kartu status langsung berisi lokasi pengguna, status wilayah (Aman / Waspada / Bahaya), dan waktu pembaruan terakhir.

Trust bar - baris tipis berisi badge "BMKG", "BNPB", "InaRISK" dengan label "Terhubung dengan sumber data resmi".

Statistik ringkas - empat angka besar: jumlah peringatan aktif, provinsi terpantau, kecepatan notifikasi, dan pemantauan 24/7. Angka menghitung naik saat pertama kali terlihat di layar.

Tentang GeoAlert - penjelasan singkat produk didampingi preview peta Indonesia versi statis (bukan peta interaktif penuh), ditambah empat kartu fitur: Data Real-time, Peringatan Dini, AI Assistant, dan Peta Interaktif.

Cara Menggunakan - timeline empat langkah dengan nomor jelas 01 sampai 04: pilih lokasi, lihat status bencana, aktifkan notifikasi, dan tanya AI.

Daftar bencana terkini - tabel atau daftar lima kejadian terbaru berisi waktu, jenis bencana, lokasi, dan label tingkat risiko berwarna.

Panduan mitigasi singkat - tiga kartu berisi langkah darurat untuk gempa, banjir, dan cuaca ekstrem, masing-masing dengan tombol "Selengkapnya".

Edukasi bencana - penjelasan singkat tiap jenis bencana yang umum terjadi di Indonesia.

Section Tanya AI - latar navy penuh, berisi judul, deskripsi, preview percakapan contoh (satu pertanyaan pengguna dan satu jawaban AI), kolom input, dan tombol menuju halaman chat penuh.

FAQ - lima pertanyaan yang sering ditanyakan warga tentang kesiapsiagaan bencana.

CTA penutup - ajakan singkat untuk mengaktifkan pemantauan wilayah.

Footer - deskripsi singkat GeoAlert, tautan cepat, mitra strategis, kebijakan privasi, dan form berlangganan email.

Struktur Halaman Peta Bencana: Header dengan kolom pencarian kota atau provinsi. Peta Indonesia interaktif sebagai elemen dominan, dengan penanda titik bencana yang berdenyut seperti radar sesuai tingkat risiko. Di atas peta ada chip filter: Semua, Gempa, Banjir, Cuaca Ekstrem, dan Longsor. Sidebar kanan berisi legenda tingkat risiko (Bahaya Tinggi, Waspada, Siaga) dan log peringatan aktif dengan waktu, lokasi, serta label berwarna. Saat penanda di peta diklik, muncul detail berisi jenis bencana, waktu kejadian, magnitudo atau tingkat keparahan, dan langkah yang disarankan. Di layar ponsel, sidebar berubah menjadi panel yang bisa digeser dari bawah dan peta tetap bisa di-pinch zoom.

Integrasi data: Hubungkan halaman peta ke API BMKG untuk data gempa terkini di https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json dan data gempa dirasakan di https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json. Tampilkan magnitudo, kedalaman, waktu, dan wilayah kejadian. Tambahkan auto-refresh setiap 5 menit disertai indikator "terakhir diperbarui". Sediakan tampilan loading berupa skeleton dan pesan error yang jelas jika API gagal dimuat, jangan biarkan halaman kosong.

Ketentuan konten: Semua bagian harus terisi konten nyata berbahasa Indonesia, jangan gunakan lorem ipsum atau menyisakan bagian kosong. Jika data dari API belum tersedia, tampilkan data contoh yang realistis dengan label kecil dan samar bertuliskan "contoh tampilan data".

Animasi: Tambahkan animasi halus: penanda peta yang berdenyut, angka statistik yang menghitung naik, dan bagian yang muncul perlahan saat di-scroll. Jaga tetap ringan dan nonaktifkan seluruhnya jika pengguna mengaktifkan reduced motion.

Aksesibilitas: Pastikan semua tombol dan ikon punya label yang jelas untuk pembaca layar, fokus keyboard terlihat, dan seluruh teks tetap terbaca di layar kecil.

masukkan ini kedalam prompt untuk prompt pertama, jika bisa log md yg pertama kali itu jangan di hapus, tapi prompt nya ditambahkan saja jangan pernah menghapus log.md yang ada tambahkan saja
```

---

## Prompt 3

```text
Perbaiki bug scroll-anchor pada GeoAlert. Saat ini navbar bersifat sticky (position: sticky, tinggi ~71px, z-index: 1000, background blur) di resources/css/components.css. Section dengan id "tentang", "cara-penggunaan", "tanya-ai", dan "kontak" (dipakai sebagai target anchor link di Navbar.jsx dan Footer.jsx) tidak punya scroll-margin-top, sehingga ketika pengguna klik menu tersebut atau membuka URL yang mengandung hash tersebut (misal dari bookmark atau tab yang di-restore browser), konten section tertutup sebagian oleh navbar.

Tambahkan scroll-margin-top pada semua section yang jadi target anchor (nilainya harus mengikuti tinggi navbar aktual, termasuk saat navbar berubah tinggi di breakpoint mobile) supaya lompatan anchor berhenti tepat di bawah navbar, bukan tertutup olehnya. Terapkan lewat CSS (scroll-margin-top), bukan JavaScript, agar tetap konsisten dengan scroll-behavior: smooth yang sudah ada di index.css.

Perbaiki dua bug data di landing page (LandingPage.jsx):

1. Fungsi fetchBmkgEvents() tidak menyertakan field waktu kejadian dari respons BMKG, sehingga kolom "Waktu" di tabel "Kejadian Terkini" selalu menampilkan "—". Tambahkan field time (gabungan g.Tanggal dan g.Jam) mengikuti pola yang sudah benar di MapPage.jsx.

2. Perhitungan jumlah "Provinsi Terpantau" mengekstrak provinsi dengan Wilayah.split(',').pop(), tapi field Wilayah dari BMKG tidak memakai koma (formatnya "<jarak> km <arah> <KOTA>-<PROVINSI>"). Perbaiki ekstraksi provinsi agar mengambil bagian setelah tanda "-" terakhir (atau parsing yang sesuai format asli BMKG), supaya statistik provinsi terpantau akurat.
```

---

## Prompt 4

```text
Perbaiki bug posisi scroll awal pada GeoAlert (Laravel + React SPA, react-router-dom v7, BrowserRouter di resources/js/main.jsx). Gejalanya: saat website dibuka atau tab di-reload, halaman kadang langsung mendarat di tengah halaman (misalnya di section "Tanya AI") alih-alih di paling atas (hero section), meskipun URL di address bar tidak mengandung hash apa pun. Ini disebabkan oleh browser (Firefox) yang mengingat dan me-restore posisi scroll terakhir dari riwayat/sesi tab tersebut, dan aplikasi React saat ini tidak punya logika apa pun untuk mengambil alih kontrol posisi scroll saat halaman pertama kali dimuat.

Perbaiki dengan menambahkan kontrol scroll restoration eksplisit di level aplikasi (bukan mengandalkan default browser):

-Set `window.history.scrollRestoration = 'manual'` sedini mungkin (misalnya di resources/js/main.jsx sebelum render, atau di dalam App.jsx saat mount), supaya browser berhenti otomatis me-restore posisi scroll bawaan.

-Tambahkan komponen/logic yang berjalan setiap kali pathname berubah (pakai useLocation dari react-router-dom): jika URL tidak mengandung hash, paksa scroll ke posisi paling atas (window.scrollTo(0, 0)); jika URL mengandung hash (misalnya dari klik menu navbar seperti #tanya-ai, #tentang, dll di Navbar.jsx dan Footer.jsx), scroll ke elemen dengan id yang sesuai.

-Pastikan logic ini juga berlaku saat aplikasi pertama kali dimuat (initial mount), bukan cuma saat berpindah route, supaya reload/buka tab baru selalu konsisten mulai dari atas kecuali pengguna memang mengklik salah satu link anchor tersebut.

-Jangan ubah bagian desain/visual lain yang sudah ada — fokus hanya pada kontrol posisi scroll ini.
```

---

## Prompt 5

```text
kenapa malah white screen websitenya?? benarkan errornya
```

---

## Prompt 6

```text
lanjutkan promptnya
```

---

## Prompt 7

```text
Ubah perilaku navbar pada GeoAlert (Navbar.jsx + components.css) agar tidak diam total saat di-scroll. Saat ini navbar bersifat position: sticky; top: 0 sehingga selalu menempel di atas viewport tanpa reaksi terhadap arah scroll, sehingga terasa mengganggu konten yang sedang dibaca.

Tambahkan perilaku "auto-hide on scroll":
1. Saat pengguna scroll ke BAWAH (menjauh dari atas halaman), navbar bergerak/geser ke atas hingga tersembunyi dari viewport (translateY(-100%)) dengan transisi halus (transition: transform 0.3s ease).
2. Saat pengguna scroll ke ATAS (walau sedikit), navbar langsung muncul kembali dengan animasi geser turun ke posisi semula.
3. Saat posisi scroll berada tepat di paling atas halaman (scrollY mendekati 0), navbar harus selalu terlihat penuh, tidak tersembunyi.
4. Implementasikan menggunakan scroll event listener yang di-throttle/pakai requestAnimationFrame di Navbar.jsx (state untuk menyimpan arah scroll terakhir), dan tambahkan class CSS (misalnya .navbar-hidden) di components.css yang mengatur transform.
5. Tetap pertahankan position: sticky (atau ganti ke fixed jika diperlukan agar transform bekerja mulus) dan tetap pertahankan variabel --navbar-height serta scroll-margin-top pada section-section yang sudah ada, supaya anchor link (Tentang, Cara Penggunaan, Tanya AI, Kontak) tetap berhenti di posisi yang benar.
6. Hormati prefers-reduced-motion: jika pengguna mengaktifkannya, navbar cukup diam seperti sekarang tanpa animasi hide/show.
7. Pastikan perilaku ini tetap responsif dan tidak merusak tampilan menu hamburger di layar mobile (saat menu mobile terbuka, navbar jangan sampai tersembunyi di tengah interaksi pengguna).
```

---

## Prompt 8

```text
Perbaiki bug horizontal overflow di landing page GeoAlert (resources/js/pages/LandingPage.jsx dan resources/css/index.css). Gejalanya: pada zoom browser 100%, beberapa section dengan layout grid 2 kolom (misalnya section "Cara Menggunakan GeoAlert" yang berisi kartu gelap "Siaga Kapan Saja") terpotong/overflow keluar dari batas viewport, padahal di zoom lain terlihat normal.

Penyebabnya: class .grid-cols-2, .md\:grid-cols-2, dan .lg\:grid-cols-2 di resources/css/index.css tidak mengatur min-width: 0 pada item grid-nya, sehingga item grid dengan konten/padding besar (seperti kartu dengan inline style padding: 4rem 3rem di LandingPage.jsx) tidak bisa menyusut mengikuti lebar kolom dan malah mendorong keluar dari .container, menyebabkan overflow horizontal pada seluruh halaman.

Perbaiki dengan:
1. Menambahkan min-width: 0 (dan min-height: 0 jika relevan) pada semua item langsung dari class .grid di resources/css/index.css, supaya item grid selalu mengikuti lebar kolom yang tersedia, bukan lebar konten instrinsiknya.
2. Menambahkan overflow-x: hidden pada html, body sebagai pengaman tambahan supaya tidak ada elemen mana pun di masa depan yang bisa membuat halaman scroll horizontal secara tidak sengaja.
3. Meninjau ulang semua kartu/section dengan padding besar dalam inline style di LandingPage.jsx (terutama section "Cara Menggunakan GeoAlert" dan "Tanya Asisten AI") agar tetap responsif — gunakan clamp() atau ukuran padding relatif jika perlu, supaya tidak bergantung pada perbaikan grid saja.
4. Setelah perbaikan, uji ulang tampilan landing page persis di zoom 100% (bukan zoom lain) di lebar desktop umum (1366px dan 1280px) untuk memastikan tidak ada lagi elemen yang terpotong di tepi kanan.
5. Jangan ubah desain visual/warna yang sudah ada — fokus hanya pada perbaikan overflow ini.

Pindahkan section "Tanya Asisten AI" dari landing page ke halaman Peta Bencana pada GeoAlert.

Saat ini section "Tanya Asisten AI" (berlatar navy penuh, berisi AIChat.jsx versi non-floating) berada di resources/js/pages/LandingPage.jsx dengan id="tanya-ai", dan MapPage.jsx sudah punya versi AIChat lain di dalam tab sidebar "Tanya AI" (resources/js/pages/MapPage.jsx).

Lakukan perubahan berikut:
1. Hapus seluruh section "Tanya Asisten AI" (id="tanya-ai", termasuk badge "FITUR BARU", judul, deskripsi, tombol "Buka Peta + AI", dan komponen AIChat inline) dari LandingPage.jsx.
2. Tambahkan section baru di MapPage.jsx yang diletakkan DI BAWAH peta bencana (bukan di dalam tab sidebar yang sudah ada), berisi konten "Tanya Asisten AI" yang dipindahkan tadi — gunakan komponen AIChat yang sama, disesuaikan agar pas ditampilkan sebagai section penuh di bawah peta (bukan floating/sidebar).
3. Perbarui link navigasi yang sebelumnya mengarah ke "#tanya-ai" di landing page (menu navbar "Tanya AI" pada Navbar.jsx, dan link "Buka Peta + AI" lain jika ada) supaya sekarang mengarah ke halaman /peta dan otomatis scroll ke section Tanya AI yang baru di sana.
4. Pastikan tab "Tanya AI" yang sudah ada di sidebar MapPage.jsx tidak duplikat secara membingungkan dengan section baru ini — jika dirasa redundan, sesuaikan agar salah satunya (sidebar atau section di bawah peta) menjadi satu-satunya titik akses "Tanya AI" di halaman peta, sesuai penilaianmu terhadap UX terbaik.
5. Jangan ubah bagian desain/style lain di luar perubahan struktural ini.
```

---

## Prompt 9

```text
buatkan prompt ketika di scroll nav bar nya tidak stack atau diam saja, jadi ada gerakannya tidak diam dan mengganggu ui yang discroll
```

---

## Prompt 10

```text
1
```

---

## Prompt 11

```text
Ubah perilaku navbar pada GeoAlert (Navbar.jsx + components.css) agar tidak diam total saat di-scroll. Saat ini navbar bersifat position: sticky; top: 0 sehingga selalu menempel di atas viewport tanpa reaksi terhadap arah scroll, sehingga terasa mengganggu konten yang sedang dibaca.

Tambahkan perilaku "auto-hide on scroll":
1. Saat pengguna scroll ke BAWAH (menjauh dari atas halaman), navbar bergerak/geser ke atas hingga tersembunyi dari viewport (translateY(-100%)) dengan transisi halus (transition: transform 0.3s ease).
2. Saat pengguna scroll ke ATAS (walau sedikit), navbar langsung muncul kembali dengan animasi geser turun ke posisi semula.
3. Saat posisi scroll berada tepat di paling atas halaman (scrollY mendekati 0), navbar harus selalu terlihat penuh, tidak tersembunyi.
4. Implementasikan menggunakan scroll event listener yang di-throttle/pakai requestAnimationFrame di Navbar.jsx (state untuk menyimpan arah scroll terakhir), dan tambahkan class CSS (misalnya .navbar-hidden) di components.css yang mengatur transform.
5. Tetap pertahankan position: sticky (atau ganti ke fixed jika diperlukan agar transform bekerja mulus) dan tetap pertahankan variabel --navbar-height serta scroll-margin-top pada section-section yang sudah ada, supaya anchor link (Tentang, Cara Penggunaan, Tanya AI, Kontak) tetap berhenti di posisi yang benar.
6. Hormati prefers-reduced-motion: jika pengguna mengaktifkannya, navbar cukup diam seperti sekarang tanpa animasi hide/show.
7. Pastikan perilaku ini tetap responsif dan tidak merusak tampilan menu hamburger di layar mobile (saat menu mobile terbuka, navbar jangan sampai tersembunyi di tengah interaksi pengguna).
```

---

## Prompt 12

```text
belum berjalan kodenya, perbaiki lagi, nav barnya masih diam saja
```

---

## Prompt 13

```text
benarkan kenapa bisa white screen
```

---

## Prompt 14

```text
benarkan juga ketika menekan nav bar peta bencana kenapa yang muncul malah tanya Ai.
```

---

## Prompt 15

```text
Berikut prompt gabungan untuk 7 poin kekurangan desain yang saya sebutkan sebelumnya — tinggal tempel ke sesi AI/Claude Code Anda, saya tidak mengubah kode apa pun di sini:

```
Perbaiki 7 kekurangan desain/kerapihan berikut pada GeoAlert (fokus utama di resources/js/pages/LandingPage.jsx, resources/js/components/AIChat.jsx, resources/js/components/Navbar.jsx, resources/js/components/Footer.jsx, dan file CSS terkait). Jangan ubah struktur fungsional/fitur yang sudah berjalan — ini murni perbaikan visual dan konsistensi.

1. Disiplinkan penggunaan warna oranye/alert (--color-alert)
Saat ini --color-alert dipakai di banyak tempat yang tidak terkait bahaya: ikon logo brand di Navbar.jsx dan Footer.jsx, bubble chat milik USER di AIChat.jsx, dan ikon fitur "Data Real-time" di LandingPage.jsx. Ganti semua penggunaan --color-alert yang TIDAK terkait status bahaya/CTA utama/statistik penting ke warna lain (--color-primary atau --color-standby sesuai konteks). Sisakan --color-alert HANYA untuk: badge tingkat bahaya (BAHAYA/WASPADA), tombol CTA utama, dan angka statistik yang butuh perhatian instan.

2. Ganti elemen yang masih terasa placeholder
- Ganti ikon Map dalam lingkaran gradient di section "Mengapa Memilih GeoAlert" (LandingPage.jsx, label "Peta Interaktif Indonesia") dengan preview visual yang lebih nyata — bisa berupa versi mini/statis dari peta Leaflet yang sudah ada di halaman /peta, atau ilustrasi peta Indonesia dengan titik-titik penanda, bukan sekadar satu ikon generik.
- Ganti badge trust bar (BMKG/BNPB/InaRISK) yang saat ini semua memakai ikon Shield identik yang diulang, jadi lebih representatif — beri pembeda visual per instansi (styling/inisial berbeda) supaya tidak terlihat seperti template yang sama diulang tiga kali.

3. Kurangi pengulangan pola kartu antar section
Section "Mengapa Memilih GeoAlert", "Edukasi Bencana", dan "Panduan Mitigasi Instan" semua memakai pola kartu ikon+judul+paragraf yang identik secara berurutan. Berikan variasi layout/visual pada minimal
<truncated 827 bytes>
al di tiap section, padahal sudah ada class global (h1-h4, .text-muted, dll) di index.css. Refactor pengulangan inline style ini menjadi class CSS reusable di LandingPage.css/components.css, supaya tipografi dan spacing konsisten di semua section tanpa duplikasi nilai manual.

6. Tambahkan animasi reveal-on-scroll di seluruh section
Saat ini animasi fade-in-up hanya ada di hero. Tambahkan animasi reveal-on-scroll yang halus (via IntersectionObserver) untuk section-section utama lain (Tentang, Cara Menggunakan, Kejadian Terkini, Edukasi Bencana, Mitigasi, Tanya AI, FAQ, CTA penutup) supaya halaman terasa lebih hidup saat di-scroll. Pastikan animasi ringan dan sepenuhnya nonaktif saat prefers-reduced-motion diaktifkan pengguna.

7. Samakan ritme spacing vertikal antar section
Beberapa section meng-override padding class .section lewat inline style ad hoc (misalnya CTA penutup dengan padding: '6rem 0 8rem'). Audit seluruh override padding manual ini dan standarkan — jika memang butuh varian jarak lebih besar/kecil untuk section tertentu, buat class resmi (misalnya .section-lg) di CSS alih-alih inline style, supaya ritme scroll antar section terasa konsisten di seluruh halaman.

Kerjakan satu per satu secara berurutan dan pastikan tidak ada regresi pada fungsionalitas yang sudah ada (geolocation, notifikasi, data BMKG, newsletter, dsb) setelah tiap perubahan visual ini.
```
```

---

## Prompt 16

```text
apakah ini bisa di beri gambar peta indonesia karna itu cuma ada titik saja tidak ada gambar peta nya
```

---

## Prompt 17

```text
ganti menggunakan yang in
```

---

## Prompt 18

```text
kenapa white screen, benarkan
```

---

