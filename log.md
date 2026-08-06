Buatkan website sistem peringatan dini bencana alam Indonesia bernama GeoAlert, terdiri dari 2 halaman: Landing Page dan Halaman Peta Bencana.

Konteks produk. GeoAlert menampilkan informasi bencana alam di Indonesia secara real-time dengan menarik data dari API BMKG dan sumber publik lainnya. Target pengguna adalah masyarakat umum Indonesia yang ingin tahu kondisi bencana di wilayahnya sekaligus tahu apa yang harus dilakukan saat terjadi bencana.

Arah desain. Palet warna: navy tua 
#0E2A5C sebagai warna utama, oranye-terracotta 
#C0492B khusus untuk elemen peringatan dan bahaya, krem 
#F7F2EA sebagai latar terang, biru muda 
#4A90D9 untuk status siaga. Warna oranye HANYA dipakai untuk alert, tombol aksi utama, dan angka statistik penting — jangan dipakai sebagai dekorasi, supaya saat ada bencana sungguhan warnanya langsung menarik perhatian. Gunakan font serif untuk judul besar agar terasa resmi dan terpercaya, font sans-serif untuk isi teks, dan font monospace untuk data seperti waktu, koordinat, dan magnitudo gempa. Nuansa keseluruhan harus terasa seperti sistem pemantauan resmi yang bisa dipercaya, bukan aplikasi marketing: bersih, lapang, dengan hierarki teks yang tegas. Wajib responsif sampai layar ponsel, kontras teks memenuhi standar keterbacaan, dan hormati

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
The user wants me to build a comprehensive disaster early warning system website called GeoAlert for Indonesia. This is a complex project with two pages: a Landing Page and a Disaster Map Page. Let me analyze the requirements carefully.

This is a major project that warrants a plan. Let me first explore the workspace, then create an implementation plan.

Let me start by examining the workspace structure and the Figma designs they've shared (from the screenshots).
This is a complex, multi-page web application. Let me first explore the workspace and then create a detailed implementation plan.

content.md#L1-11
Now I have all the information I need. Let me create a comprehensive implementation plan.

Implementation Plan
Rencana implementasi sudah siap untuk direview. Beberapa poin penting:

Vanilla CSS sebagai pengganti Tailwind — design system lengkap dengan custom properties sesuai palet warna yang diminta
Leaflet.js (via CDN) untuk peta interaktif di halaman Peta Bencana
Data real-time BMKG (gempa terkini + gempa dirasakan) di-fetch langsung dari client-side, dengan auto-refresh 5 menit
Data contoh realistis (berlabel "contoh tampilan data") untuk filter non-gempa (banjir, longsor, cuaca ekstrem)
Semua konten berbahasa Indonesia tanpa lorem ipsum
Aksesibilitas: prefers-reduced-motion, focus visible, ARIA labels
Total: 4 file baru, 5 file dimodifikasi
I now have a clear picture of the project. It's a Laravel project with Tailwind CSS and Vite. The user wants to replace the default Laravel welcome page with a comprehensive GeoAlert disaster warning system. Let me also check the BMKG API to understand the data structure.
Now the landing page Blade template — the largest file:
The user wants me to continue with the implementation. I need to create the welcome.blade.php (landing page), peta.blade.php (map page), and the Indonesia SVG. Let me continue.

Continuing with the Blade templates. Let me create the landing page first:
