import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, RefreshCw, Paperclip, Camera, ChevronDown,
  RotateCcw, Sparkles, ShieldCheck
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Konfigurasi renderer marked: pastikan link selalu target _blank dan rel noopener noreferrer
const markedRenderer = new marked.Renderer();
markedRenderer.link = ({ href, title, text }) => {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
};

marked.setOptions({
  renderer: markedRenderer,
  breaks: true,
  gfm: true,
});

/**
 * Sanitasi HTML hasil render markdown dengan DOMPurify
 */
function renderMarkdown(rawText) {
  if (!rawText) return '';
  const rawHtml = marked.parse(rawText);
  return DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['target', 'rel'],
  });
}

// Keyword-based AI response engine with realistic logical reasoning (BMKG & BNPB Official Guidance)
const AI_RESPONSES = [
  {
    keywords: ['terima kasih', 'terimakasih', 'makasih', 'thanks', 'thank you', 'ok', 'oke', 'sip', 'mantap', 'keren'],
    answer: `Sama-sama! Tetap waspada dan utamakan keselamatan diri serta keluarga.\n\n💡 **Tips Keselamatan Hari Ini:**\n1. Simpan nomor darurat **112** dan **115** pada panggilan cepat ponsel Anda.\n2. Pastikan Tas Siaga Bencana (TSB) siap di dekat akses pintu keluar utama.\n\n*Jika ada pertanyaan mitigasi lainnya, saya siap membantu kapan saja!*`
  },
  {
    keywords: ['tidur', 'kasur', 'kamar', 'malam hari', 'tempat tidur'],
    answer: `🛌 **Panduan Keselamatan Gempa Saat di Tempat Tidur (SOP BMKG):**\n\nJangan panik berlari keluar di tengah guncangan karena risiko tinggi tertimpa reruntuhan plafon atau terjatuh.\n\n**Langkah Tindakan:**\n1. **Lindungi Kepala:** Tetap di tempat tidur, posisi tengkurap, lindungi kepala dan leher dengan bantal tebal.\n2. **Posisi Samping Kasur:** Jika atap ringkih, segera turun ke samping ranjang (posisi *triangle of life*).\n3. **Siapkan Senter:** Selalu letakkan senter kecil dekat tempat tidur untuk penerangan saat listrik padam.\n4. **Buka Pintu:** Setelah guncangan mereda, segera buka pintu kamar sebelum kusen terkunci akibat pergeseran dinding.`
  },
  {
    keywords: ['mobil', 'motor', 'kendaraan', 'jalan raya', 'mengemudi', 'menyetir'],
    answer: `🚗 **Prosedur Keselamatan Gempa Saat Mengemudi:**\n\n1. **Tepi & Hentikan Kendaraan:** Nyalakan lampu hazard, perlambat laju, dan berhenti di area terbuka (jauhi flyover, jembatan, tiang listrik, dan papan reklame).\n2. **Tarik Rem Tangan:** Matikan mesin, pasang rem tangan, dan tinggalkan kunci kontak di dalam agar mobil dapat digeser petugas evakuasi darurat.\n3. **Tetap di Dalam Kabin:** Lindungi diri di dalam kabin mobil sampai getaran berhenti total.\n4. **Waspada Pantai:** Jika berkendara di pesisir dan guncangan kuat, segera tinggalkan kendaraan dan evakuasi ke tempat tinggi.`
  },
  {
    keywords: ['gedung', 'bertingkat', 'lantai', 'lift', 'tangga darurat'],
    answer: `🏢 **Prosedur Keselamatan Gempa di Gedung Bertingkat:**\n\n⚠️ **DILARANG MENGGUNAKAN LIFT!** Lift berisiko macet seketika akibat pemadaman listrik otomatis atau deformasi rel sangkar.\n\n**Langkah Cepat:**\n1. **Drop, Cover, Hold On:** Merunduk di bawah meja kokoh, lindungi kepala, dan pegang erat kaki meja.\n2. **Jauhi Dinding Kaca:** Hindari jendela kaca luar yang rentan pecah akibat gaya geser guncangan.\n3. **Gunakan Tangga Darurat:** Setelah guncangan selesai, turun melalui tangga darurat secara tertib tanpa saling mendorong.\n4. **Menuju Titik Kumpul:** Jauhi area luar gedung untuk menghindari jatuhnya pecahan kaca dan dinding ornamen.`
  },
  {
    keywords: ['magnitudo', 'kedalaman', 'skala richter', 'dangkal', 'dalam', 'kerusakan'],
    answer: `📊 **Pengaruh Kedalaman Gempa Terhadap Tingkat Kerusakan:**\n\n1. 🔴 **Gempa Dangkal (< 50 km):** Energi gempa dilepaskan dekat permukaan tanah sehingga guncangan sangat merusak fondasi dan bangunan.\n2. 🟡 **Gempa Menengah (50 - 300 km):** Getaran dirasakan luas, namun dampak kerusakan fisik di permukaan relatif sedang.\n3. 🟢 **Gempa Dalam (> 300 km):** Sebagian besar energi seismik teredam oleh mantel bumi sehingga jarang menimbulkan kerusakan di permukaan.\n\n💡 **Kesimpulan:** Magnitudo mengukur energi di pusat gempa, sedangkan kedalaman dan jarak episentrum menentukan keparahan dampak di pemukiman.`
  },
  {
    keywords: ['tsunami', 'ombak', 'pantai', 'surut', '20-20-20'],
    answer: `🌊 **Prinsip Evakuasi Tsunami — Aturan Emas 20-20-20:**\n\nJika berada di pesisir pantai dan merasakan gempa bumi kuat:\n1. ⏱️ **20 Detik Guncangan:** Jika gempa berlangsung kuat selama 20 detik atau lebih hingga sulit berdiri.\n2. 🏃 **20 Menit Evakuasi:** Waktu emas evakuasi sekitar 20 menit sebelum gelombang pertama mencapai daratan.\n3. ⛰️ **20 Meter Ketinggian:** Segera lari menuju dataran dengan ketinggian minimal 20 meter dpl atau Tempat Evakuasi Sementara (TES).\n\n⚠️ **Penting:** Jika air laut surut tiba-tiba, jangan mendekat untuk melihat ikan terdampar. Segera evakuasi ke tempat tinggi tanpa menunggu sirine!`
  },
  {
    keywords: ['banjir', 'flood', 'listrik', 'ular', 'setrum', 'genangan'],
    answer: `🔵 **Langkah Keselamatan Bahaya Banjir:**\n\n1. ⚡ **Bahaya Listrik:** Matikan sakelar MCB utama meteran listrik sebelum air masuk ke dalam rumah.\n2. 🌊 **Arus Air Mengalir:** Hindari menerobos genangan air mengalir setinggi 15 cm ke atas karena sanggup menjatuhkan orang dewasa.\n3. 🐍 **Ancaman Hewan Berbisa:** Waspadai ular atau serangga yang mencari tempat kering di tumpukan perabotan basah. Gunakan tongkat kayu saat memeriksa.\n4. 📞 **Panggilan Darurat:** Hubungi **112** atau BPBD setempat jika air terus meningkat melampaui ambang batas aman.`
  },
  {
    keywords: ['longsor', 'tanah longsor', 'lereng', 'retakan', 'tebing', 'miring'],
    answer: `🟠 **Panduan Evakuasi Tanah Longsor:**\n\n**Tanda-Tanda Awal:**\n1. Muncul retakan tanah melengkung pada lereng atau jalan.\n2. Pintu/jendela rumah mendadak seret atau sulit dibuka karena fondasi bergeser.\n3. Air sumur mendadak keruh atau muncul mata air baru berlumpur.\n\n**Arah Evakuasi:**\n⚠️ **Lari Tegak Lurus (Menyamping) dari Jalur Luncuran!** Jangan berlari searah luncuran longsoran karena kecepatannya bisa mencapai lebih dari 50 km/jam.`
  },
  {
    keywords: ['cuaca', 'angin', 'puting beliung', 'petir', 'pohon', 'badai', 'topan'],
    answer: `⚡ **Langkah Keselamatan Cuaca Ekstrem & Petir:**\n\n1. 🚫 **Jauhi Pohon & Tiang:** Dilarang keras berteduh di bawah pohon tunggal atau tiang besi di tempat terbuka saat hujan deras.\n2. 🌪️ **Angin Puting Beliung:** Jika di luar ruangan, segera tiarap di cekungan tanah atau parit kering sambil melindungi kepala.\n3. 🔌 **Cabut Stopkontak:** Lepaskan kabel alat elektronik dan antena untuk menghindari bahaya lonjakan arus akibat petir.`
  },
  {
    keywords: ['gunung', 'erupsi', 'vulkanik', 'lahar', 'abu vulkanik', 'kawah', 'merapi', 'magma', 'wedhus gembel'],
    answer: `🌋 **Panduan Mitigasi Erupsi Gunung Api (SOP PVMBG & BNPB):**\n\n1. 😷 **Lindungi Saluran Napas:** Wajib kenakan masker khusus partikel debu (N95/KN95) atau kain basah untuk menyaring abu silika vulkanik yang berbahaya bagi paru-paru.\n2. 🥽 **Lindungi Mata & Kulit:** Kenakan kacamata pelindung (*goggles*) dan pakaian tertutup lengan panjang. Hindari menggunakan lensa kontak.\n3. 🚫 **Patuhi Radius Bahaya (KRB):** Dilarang beraktivitas di dalam radius Kawasan Rawan Bencana yang ditetapkan pos pemantauan PVMBG.\n4. 🌊 **Waspada Lahar Dingin:** Jauhi bantaran sungai yang berhulu di lereng gunung api saat terjadi hujan lebat di kawasan puncak.`
  },
  {
    keywords: ['karhutla', 'kebakaran hutan', 'kebakaran lahan', 'titik panas', 'hotspot', 'kabut asap', 'asap', 'ispa', 'manggala agni', 'sipongi', 'n95', 'gambut'],
    answer: `🔥 **Panduan Mitigasi Kebakaran Hutan & Lahan (Karhutla) & Kabut Asap:**\n\n📡 **Titik Panas Satelit vs Kebakaran:**\nData titik panas (*thermal hotspot*) dari satelit NASA FIRMS (VIIRS) mendeteksi anomali suhu permukaan bumi. Titik panas mengindikasikan potensi karhutla, namun perlu verifikasi lapangan oleh posko Manggala Agni / BPBD.\n\n😷 **Perlindungan Terhadap Kabut Asap (Bahaya PM2.5 & ISPA):**\n1. **Gunakan Masker N95 / KN95:** Masker kain atau bedah biasa tidak cukup rapat menyaring partikel mikro PM2.5 yang memicu ISPA.\n2. **Tutup Ventilasi Ruangan:** Tutup rapat jendela dan pintu, sumbat celah dengan handuk/kain basah untuk memerangkap asap.\n3. **Kurangi Aktivitas Luar Ruang:** Terutama bagi balita, ibu hamil, lansia, dan penderita asma/jantung.\n4. **Banyak Minum Air Putih:** Membantu mengencerkan lendir dan membersihkan partikel debu halus di saluran tenggorokan.\n\n🚨 **Nomor Darurat & Laporan Karhutla:**\n- 🚨 **112** — Layanan Darurat Terpadu Bebas Pulsa\n- 🚒 **113** — Pemadam Kebakaran\n- 🌲 **Manggala Agni KLHK / SiPongi:** Posko Pengendalian Kebakaran Hutan & Lahan`
  },
  {
    keywords: ['tas siaga', 'tas darurat', 'emergency kit', 'perlengkapan', 'tsb', '72 jam'],
    answer: `🎒 **Isi Wajib Tas Siaga Bencana (TSB) untuk 72 Jam Pertama:**\n\n1. 💧 **Air & Makanan:** Minimal 3 liter air/orang dan makanan siap santap berkalori tinggi (biskuit, makanan kaleng).\n2. 📄 **Dokumen Penting:** Salinan identitas, KK, dan ijazah dalam kantong plastik ziplock kedap air.\n3. 🩺 **Kotak P3K & Obat Khusus:** Obat pribadi untuk 7 hari (asma, hipertensi, diabetes) dan perban antiseptik.\n4. 🔦 **Peralatan Darurat:** Senter LED, baterai cadangan, peluit darurat, radio portabel, dan powerbank.\n\n💡 Gantung TSB di dekat pintu keluar agar mudah dibawa saat evakuasi mendesak.`
  },
  {
    keywords: ['nomor darurat', 'telepon darurat', 'kontak', 'hubungi', 'call center', '112', '115', '118', 'basarnas'],
    answer: `📞 **Daftar Nomor Panggilan Darurat Nasional Resmi Indonesia:**\n\n1. 🚨 **112** — Layanan Panggilan Darurat Tunggal Bebas Pulsa (Dapat dihubungi tanpa pulsa/SIM)\n2. 🌊 **115** — BASARNAS (Pencarian & Pertolongan Korban Bencana)\n3. 🏥 **118 / 119** — Ambulans & Layanan Kesehatan\n4. 🔥 **113** — Pemadam Kebakaran (Damkar)\n5. 👮 **110** — Kepolisian RI\n6. 🌋 **0800-1000-3000** — Posko BNPB Pusat\n7. 🌤️ **196** — Call Center BMKG`
  },
  {
    keywords: ['sumber data', 'bmkg', 'bnpb', 'inarisk', 'akurasi', 'aplikasi', 'geoalert'],
    answer: `📡 **Sumber Informasi & Standar Panduan GeoAlert:**\n\nGeoAlert mengintegrasikan panduan mitigasi resmi pemerintah:\n\n1. 🔴 **Data Gempa BMKG:** Menampilkan data gempa bumi resmi dari BMKG TEWS (*Tsunami Early Warning System*) yang diperbarui berkala pada peta dan tabel.\n2. 🗺️ **Indeks Risiko InaRISK BNPB:** Rujukan tingkat kerentanan bencana wilayah Indonesia.\n3. 🤖 **GeoAlert AI Advisory:** Panduan kesiapsiagaan terstruktur berdasarkan SOP mitigasi resmi BMKG dan BNPB.`
  }
];

// Daftar kata kunci darurat & panik
const EMERGENCY_KEYWORDS = [
  'tolong', 'terjebak', 'darurat', 'gempa sekarang', 'tsunami datang',
  'air naik', 'banjir parah', 'tertimbun', 'evakuasi darurat', 'bantuan segera',
  'panik', 'posko darurat', 'korban'
];

// Daftar kata kunci sapaan
const GREETING_KEYWORDS = [
  'halo', 'hai', 'helo', 'pagi', 'siang', 'sore', 'malam', 'siapa kamu',
  'siapa anda', 'tentang ai', 'siapa ini', 'apa kabar'
];

/**
 * Logika respons AI dengan penanganan riwayat percakapan dan situasi darurat
 * @param {string} message - Pesan saat ini dari user
 * @param {Array} history - Riwayat pesan sebelumnya [{ role: 'user'|'ai', text: string }]
 */
function getAIResponse(message, history = []) {
  const lower = message.toLowerCase().trim();
  const hasHistory = Array.isArray(history) && history.length > 0;
  const hasIntroduced = hasHistory && history.some(m => m.role === 'ai');

  // 1. PRIORITAS TERTINGGI: SITUASI DARURAT ATAU PANIK
  const isEmergency = EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
  if (isEmergency) {
    return `🚨 **SEGERA HUBUNGI NOMOR DARURAT 112 (BEBAS PULSA) ATAU BASARNAS 115!**\n\nJika Anda sedang dalam ancaman bahaya langsung, lakukan langkah keselamatan cepat berikut:\n\n1. 🛡️ **Lindungi Diri:** Merunduk di bawah meja kokoh (*Drop, Cover, Hold On*) jika terjadi gempa. Jika di pesisir, segera lari ke tempat tinggi (>20 meter).\n2. ⚡ **Amankan Jalur:** Matikan MCB listrik utama dan jauhi dinding kaca serta barang yang mudah roboh.\n3. 📞 **Panggilan Darurat Langsung:**\n   - **112** — Layanan Darurat Bebas Pulsa (Semua operator)\n   - **115** — BASARNAS (Pencarian & Pertolongan)\n   - **118 / 119** — Ambulans & Pertolongan Medis\n   - **113** — Pemadam Kebakaran\n4. 📢 **Beri Sinyal Suara:** Jika terjebak, tiup peluit atau ketuk benda padat untuk memandu tim evakuasi tanpa membuang energi berteriak.`;
  }

  // 2. DETEKSI SAPAAN (Anti-Pengulangan)
  const isGreeting = GREETING_KEYWORDS.some(kw => lower.includes(kw));
  if (isGreeting) {
    if (hasIntroduced) {
      // Sapaan lanjutan dibalas singkat dan ramah
      return `Halo kembali! Ada informasi keselamatan, panduan gempa/tsunami, atau nomor darurat yang perlu kami bantu?`;
    }

    // Perkenalan pertama (ringkas, tanpa klaim data real-time)
    return `Salam! Saya **GeoAlert AI**, asisten kesiapsiagaan dan panduan mitigasi bencana alam Indonesia berbasis SOP resmi BMKG & BNPB.\n\nSaya siap membantu Anda dengan:\n1. 🚨 **Prosedur Keselamatan:** Panduan evakuasi gempa, tsunami, banjir, longsor, cuaca ekstrem, & erupsi gunung api.\n2. 🎒 **Kesiapsiagaan:** Penyusunan Tas Siaga Bencana (TSB) 72 jam & rencana evakuasi keluarga.\n3. 📞 **Nomor Darurat Resmi:** Informasi nomor telepon 112, 115 (BASARNAS), 118, dan 113.\n\n*Ada situasi atau pertanyaan mitigasi yang ingin Anda konsultasikan?*`;
  }

  // 3. MATCH KNOWLEDGE BASE MITIGASI
  const match = AI_RESPONSES.find(r => r.keywords.some(kw => lower.includes(kw)));
  if (match) return match.answer;

  // 4. CONTEXTUAL REASONING ENGINE (FALLBACK)
  const isQuestion = lower.includes('apakah') || lower.includes('kenapa') || lower.includes('mengapa') || lower.includes('bagaimana') || lower.includes('berapa') || lower.includes('dimana');
  const isSafetyRelated = lower.includes('aman') || lower.includes('bahaya') || lower.includes('selamat') || lower.includes('evakuasi') || lower.includes('korban');

  if (isSafetyRelated || isQuestion) {
    return `🧠 **Panduan Keselamatan GeoAlert AI:**\n\nMengenai pertanyaan Anda: *"_${message}_"*\n\n1. 🛡️ **Prioritas Keselamatan Jiwa:** Keselamatan diri dan keluarga adalah hal utama. Jangan menunda evakuasi demi menyelamatkan barang berharga.\n2. 📋 **Cek Informasi Resmi:** Pantau data peringatan resmi BMKG pada peta dan tabel GeoAlert.\n3. 📞 **Hubungi Bantuan Segera:** Jika terjadi bahaya mendesak, segera hubungi **112** (Darurat Bebas Pulsa) atau **115** (BASARNAS).\n\n*Ketik topik spesifik seperti "gempa", "tsunami", "banjir", "gunung api", atau "tas siaga" untuk panduan langkah demi langkah.*`;
  }

  return `Terima kasih atas pertanyaan Anda. **GeoAlert AI** siap membantu dengan panduan mitigasi bencana terstruktur:\n\n1. 🎒 **Tas Siaga Bencana (TSB):** Perlengkapan wajib 72 jam pertama\n2. 🔴 **Gempa Bumi:** Prosedur perlindungan di gedung, rumah, dan mobil\n3. 🌊 **Tsunami:** Aturan evakuasi 20-20-20 & tanda air laut surut\n4. 🔵 **Banjir, Longsor & Gunung Api:** Penanganan arus listrik, arah lari tebing, & masker abu\n5. 📞 **Nomor Darurat:** Kontak cepat 112, 115 (BASARNAS), 118, dan 113\n\n*Silakan ketik pertanyaan spesifik Anda seputar mitigasi bencana di atas.*`;
}

// Interactive Prompt Suggestion Sets for "Refresh Prompts"
const PROMPT_SETS = [
  [
    { text: "Cara melindungi diri dari kabut asap karhutla", category: "Karhutla" },
    { text: "Apa saja barang wajib dalam Tas Siaga Bencana (TSB)?", category: "Kesiapsiagaan" },
    { text: "Prosedur keselamatan saat terjadi gempa bumi di gedung tinggi", category: "Gempa Bumi" },
    { text: "Cara mengetahui potensi tsunami setelah guncangan kuat di pantai", category: "Tsunami" }
  ],
  [
    { text: "Langkah evakuasi mandiri saat timbul tanda-tanda banjir", category: "Banjir" },
    { text: "Tanda-tanda awal tanah longsor di kawasan perbukitan", category: "Longsor" },
    { text: "Apa yang harus dilakukan saat terjadi angin puting beliung?", category: "Cuaca Ekstrem" },
    { text: "Perlindungan diri dan masker apa yang wajib saat erupsi gunung api?", category: "Gunung Api" }
  ],
  [
    { text: "Berapa liter air minum yang harus disiapkan per orang saat bencana?", category: "Perlengkapan" },
    { text: "Apakah aman menggunakan lift saat evakuasi gedung pasca gempa?", category: "Prosedur Evakuasi" },
    { text: "Tindakan pertama jika melihat air laut mendadak surut drastis", category: "Tsunami" },
    { text: "Nomor darurat ambulans dan pemadam kebakaran nasional", category: "Nomor Darurat" }
  ]
];

export default function AIChat({ isFloating = false, initialMessage = '' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(initialMessage);
  const [isTyping, setIsTyping] = useState(false);
  const [promptSetIndex, setPromptSetIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState("GeoAlert AI 2.0");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
      handleSend(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const currentHistory = [...messages];
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'ai', text: getAIResponse(query, currentHistory) }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRefreshPrompts = () => {
    setPromptSetIndex((prev) => (prev + 1) % PROMPT_SETS.length);
  };

  const handleResetChat = () => {
    setMessages([]);
    setInput('');
    setIsTyping(false);
  };

  const activePrompts = PROMPT_SETS[promptSetIndex];

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: messages.length === 0 ? '600px' : '550px',
        background: 'linear-gradient(135deg, #0E2A5C 0%, #0a1f44 60%, #061530 100%)',
        color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 20px 50px rgba(14, 42, 92, 0.25)'
      }}
    >

      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(14, 42, 92, 0.3)',
        backdropFilter: 'blur(12px)',
        zIndex: 10
      }}>
        {/* App Logo / Badge Top-Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00D2FF 0%, #4A90D9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)'
          }}>
            <Sparkles size={18} color="#FFFFFF" />
          </div>
          <span style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.01em', color: '#FFFFFF' }}>
            GeoAlert AI
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '2px 10px', borderRadius: '20px',
            background: 'rgba(46, 125, 50, 0.2)', border: '1px solid rgba(46, 125, 50, 0.4)',
            fontSize: '0.72rem', color: '#4CAF50', fontWeight: '600'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50', boxShadow: '0 0 8px #4CAF50' }} />
            BMKG Verified
          </span>
        </div>

        {/* Header Action: Reset Chat when active */}
        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.8rem', fontWeight: '500',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <RotateCcw size={14} /> Percakapan Baru
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="ai-chat-scroll-area dark-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative', zIndex: 1 }}>

        {/* INITIAL DASHBOARD MODE (ThinkAI Style) */}
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem 1rem 1rem', textAlign: 'center',
            width: '100%', boxSizing: 'border-box'
          }}>
            {/* Center 3D Glowing Orb */}
            <div className={`ai-orb-wrapper ${inView ? 'animate-orb-enter' : ''}`} style={{ position: 'relative', marginBottom: '1rem' }}>
              {/* Outer Pulse Ring */}
              <div style={{
                position: 'absolute', inset: '-10px', borderRadius: '50%',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                animation: 'orb-pulse-ring 3s infinite ease-in-out',
                pointerEvents: 'none'
              }} />
              {/* 3D Glowing Sphere */}
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #00D2FF 40%, #4A90D9 70%, #0E2A5C 100%)',
                animation: 'orb-glow 6s infinite ease-in-out',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={30} color="#FFFFFF" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
              </div>
            </div>

            {/* Hero Greeting Typography */}
            <h2 className={`ai-greeting-title ${inView ? 'animate-greeting-enter' : ''}`} style={{
              fontSize: 'clamp(1.4rem, 2.5vw, 2.1rem)', fontWeight: '700',
              lineHeight: '1.25', color: '#FFFFFF', marginBottom: '0.35rem',
              letterSpacing: '-0.02em', textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              {getGreeting()}, Pengunjung
            </h2>
            <p className={`ai-greeting-sub ${inView ? 'animate-sub-enter' : ''}`} style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.2rem)', fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.35rem'
            }}>
              Ada yang bisa GeoAlert AI bantu hari ini?
            </p>
            <p className={`ai-greeting-sub ${inView ? 'animate-sub-enter' : ''}`} style={{
              fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)',
              maxWidth: '520px', marginBottom: '1.25rem', lineHeight: '1.5'
            }}>
              Pilih salah satu saran pertanyaan di bawah atau ketik pertanyaan Anda sendiri seputar mitigasi bencana.
            </p>

            {/* Prompt Suggestion Cards Container */}
            <div className="thinkai-prompts-container">
              {activePrompts.map((p, idx) => (
                <button
                  key={idx}
                  className={`thinkai-prompt-card ${inView ? 'animate-card-stagger' : ''}`}
                  style={{ animationDelay: `${idx * 100 + 200}ms` }}
                  onClick={() => handleSend(p.text)}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.text}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(74, 144, 217, 0.9)', fontWeight: '600', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {p.category} →
                  </span>
                </button>
              ))}
            </div>

            {/* Refresh Prompts Button */}
            <button
              onClick={handleRefreshPrompts}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'transparent', border: 'none',
                color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.8rem',
                cursor: 'pointer', transition: 'color 0.2s', padding: '4px 8px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              <RefreshCw size={13} /> Muat ulang saran
            </button>
          </div>
        ) : (
          /* ACTIVE CHAT TRAJECTORY MODE */
          <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                {msg.role === 'ai' && (
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00D2FF 0%, #4A90D9 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxShadow: '0 0 15px rgba(0, 210, 255, 0.3)'
                  }}>
                    <Bot size={20} color="#FFFFFF" />
                  </div>
                )}
                <div style={{
                  maxWidth: '82%',
                  padding: '14px 18px',
                  borderRadius: '20px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #0E2A5C 0%, #1e5bb8 100%)'
                    : 'rgba(14, 42, 92, 0.45)',
                  backdropFilter: 'blur(16px)',
                  border: msg.role === 'user' ? '1px solid rgba(74, 144, 217, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  lineHeight: '1.65',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                }}>
                  {msg.role === 'ai' ? (
                    <div
                      className="ai-chat-bubble-markdown"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                    />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00D2FF 0%, #4A90D9 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Bot size={20} color="#FFFFFF" />
                </div>
                <div style={{
                  padding: '12px 18px', borderRadius: '20px',
                  background: 'rgba(14, 42, 92, 0.45)', border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex', gap: '6px', alignItems: 'center'
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#4A90D9',
                      animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* THINKAI BOTTOM CHAT BOX CONTAINER */}
      <div className={`thinkai-bottom-container ${inView ? 'animate-input-enter' : ''}`}>
        <div className="thinkai-input-box">
          {/* Main Input Textarea/Field */}
          <textarea
            ref={inputRef}
            rows={messages.length === 0 ? 2 : 1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={messages.length === 0 ? "Bagaimana GeoAlert AI dapat membantu Anda hari ini?" : "Ketik pertanyaan Anda..."}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: '#FFFFFF', fontSize: '0.95rem', resize: 'none', fontFamily: 'inherit',
              lineHeight: '1.5'
            }}
          />

          {/* Bottom Action Bar inside Input Container */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
            
            {/* Left: Model Selector Badge Pill */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.78rem',
                  fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <ShieldCheck size={14} color="#00D2FF" />
                {selectedModel} <ChevronDown size={12} />
              </button>

              {/* Model Dropdown Popup */}
              {showModelDropdown && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
                  background: '#0E2A5C', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '16px', padding: '6px', width: '220px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 50
                }}>
                  {[
                    "GeoAlert AI 2.0 — BMKG SOP",
                    "GeoAlert Fast — Respon Instan",
                    "GeoAlert Pro — Mitigasi Lengkap"
                  ].map(m => (
                    <button
                      key={m}
                      onClick={() => { setSelectedModel(m.split(' — ')[0]); setShowModelDropdown(false); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 12px',
                        borderRadius: '10px', background: 'transparent', border: 'none',
                        color: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Attachment Icons & Send Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="thinkai-icon-btn"
                title="Lampirkan Dokumen"
                onClick={() => alert("Fitur unggah dokumen panduan evakuasi segera hadir!")}
              >
                <Paperclip size={16} />
              </button>
              <button
                className="thinkai-icon-btn"
                title="Kamera / Foto"
                onClick={() => alert("Fitur analisis foto kerusakan bencana segera hadir!")}
              >
                <Camera size={16} />
              </button>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                aria-label="Kirim Pesan"
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  background: input.trim()
                    ? 'linear-gradient(135deg, #00D2FF 0%, #4A90D9 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: input.trim() ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                  cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', boxShadow: input.trim() ? '0 0 15px rgba(0, 210, 255, 0.4)' : 'none'
                }}
              >
                <Send size={16} />
              </button>
            </div>

          </div>
        </div>

        {/* ThinkAI Footer Notes */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '8px', padding: '0 4px',
          fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)'
        }}>
          <span>GeoAlert AI dapat membuat kekeliruan. Selalu verifikasi informasi dengan BMKG &amp; BNPB.</span>
          <span style={{ display: 'none', md: 'inline' }}>Tekan Shift + Enter untuk baris baru</span>
        </div>
      </div>

    </div>
  );
}
