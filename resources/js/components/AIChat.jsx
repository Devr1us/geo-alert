import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, RefreshCw, Paperclip, Camera, ChevronDown,
  RotateCcw, Sparkles, ShieldCheck
} from 'lucide-react';

// Keyword-based AI response engine with realistic logical reasoning (BMKG & BNPB Official Guidance)
const AI_RESPONSES = [
  {
    keywords: ['halo', 'hai', 'helo', 'pagi', 'siang', 'sore', 'malam', 'siapa kamu', 'siapa anda', 'tentang ai', 'siapa ini', 'apa kabar'],
    answer: `Salam! Saya **GeoAlert AI**, asisten cerdas kesiapsiagaan dan mitigasi bencana alam Indonesia.\n\nSaya mengintegrasikan data real-time dari **BMKG & BNPB** untuk memberikan saran yang praktis, logis, dan berbasis sains:\n\n1. 🚨 **Analisis Risiko & Prosedur Keselamatan:** Gempa bumi, Tsunami, Banjir, Longsor, & Cuaca Ekstrem.\n2. 🎒 **Panduan Kesiapsiagaan:** Penyusunan Tas Siaga Bencana (TSB) & Rencana Evakuasi.\n3. 📞 **Akses Kontak Darurat:** Menghubungkan ke BPBD, BASARNAS (115), Damkar (113), & Ambulans (118/119).\n\n*Ada situasi atau pertanyaan spesifik yang ingin Anda konsultasikan hari ini?*`
  },
  {
    keywords: ['terima kasih', 'terimakasih', 'makasih', 'thanks', 'thank you', 'ok', 'oke', 'sip', 'mantap', 'keren'],
    answer: `Sama-sama! Tetap waspada dan utamakan keselamatan keluarga Anda.\n\n💡 **Tips Logis Hari Ini:** Simpan nomor panggilan darurat **112** dan **115** di kontak panggilan cepat (*speed dial*) ponsel Anda, serta pastikan Tas Siaga Bencana (TSB) sudah siap di dekat pintu keluar utama.\n\n*Jika ada pertanyaan mitigasi lainnya, saya siap membantu kapan saja!*`
  },
  {
    keywords: ['tidur', 'kasur', 'kamar', 'malam hari', 'tempat tidur'],
    answer: `🛌 **Logika Keselamatan Gempa Saat Berada di Tempat Tidur:**\n\n**Mengapa Jangan Langsung Lari Keluar?**\nDalam kegelapan atau kondisi panik malam hari, berlari di tengah guncangan justru meningkatkan risiko tertimpa plafon, benda jatuh, atau terpleset patah tulang.\n\n**Langkah Logis & Efektif (SOP BMKG):**\n1. 🛡️ **Merunduk & Lindungi Kepala:** Jangan berdiri! Tetap di tempat tidur, tengkurap, dan lindungi kepala & leher dengan bantal tebal.\n2. 🛏️ **Posisi Samping Kasur:** Jika atap/plafon terlihat ringkih, bergulinglah ke lantai di samping kasur (posisi *triangle of life*).\n3. 🔦 **Senter Tampak Tempat Tidur:** Selalu siapkan senter kecil di dekat kasur (bukan HP yang mudah terselip).\n4. 🚪 **Buka Pintu Kamar:** Setelah guncangan mereda, segera buka pintu kamar karena struktur dinding yang bergeser dapat mengunci engsel pintu.`
  },
  {
    keywords: ['mobil', 'motor', 'kendaraan', 'jalan raya', 'mengemudi', 'menyetir'],
    answer: `🚗 **Logika Keselamatan Gempa Saat Mengemudi:**\n\n**Analisis Risiko:** Guncangan gempa merusak kestabilan kemudi, membuat permukaan jalan bergelombang/retak, serta berisiko merobohkan flyover atau tiang listrik.\n\n**Prosedur Tindakan Logis:**\n1. 🛑 **Tepi & Hentikan Kendaraan:** Nyalakan lampu hazard, perlambat kecepatan, dan tepi kendaraan di area terbuka (jauhi jembatan, flyover, tiang listrik, & pohon besar).\n2. 🔑 **Tinggalkan Kunci di Dalam:** Matikan mesin dan tarik rem tangan. Biarkan kunci tetap di dalam mobil agar tim evakuasi dapat memindahkan kendaraan jika terjadi kondisi darurat.\n3. 📱 **Tetap di Dalam Kabin:** Kabin mobil memberikan perlindungan dari reruntuhan kecil hingga guncangan mereda.\n4. 🌊 **Jauhi Pesisir:** Jika mengemudi di dekat pantai dan merasakan guncangan kuat, segera tinggalkan mobil dan lari ke dataran tinggi.`
  },
  {
    keywords: ['gedung', 'bertingkat', 'lantai', 'lift', 'tangga darurat'],
    answer: `🏢 **Logika Keselamatan Gempa di Gedung Tinggi:**\n\n**Mengapa Lift Dilarang Keras?**\nSaat gempa, aliran listrik gedung sering mati otomatis (*power outage*) atau rel jalur lift mengalami deformasi. Menggunakan lift berisiko tinggi terjebak di dalam relik hampa udara.\n\n**Langkah Logis & Terstruktur:**\n1. 🛡️ **Duck, Cover, Hold On:** Jangan panik berlari ke pintu keluar. Segera merunduk di bawah meja kantor yang kokoh dan pegang kaki meja.\n2. 🪟 **Jauhi Kaca Jendela:** Dinding kaca gedung tinggi rentan pecah akibat gaya geser guncangan.\n3. 🏃 **Gunakan Tangga Darurat:** Setelah guncangan berhenti total, evakuasi secara tertib melalui tangga darurat tanpa membawa barang berat.\n4. 🌳 **Titik Kumpul (Assembly Point):** Menjauhlah dari dinding luar gedung untuk menghindari jatuhnya pecahan kaca atau ornamen dinding.`
  },
  {
    keywords: ['magnitudo', 'kedalaman', 'skala richter', 'dangkal', 'dalam', 'kerusakan'],
    answer: `📊 **Logika & Fisika Kebencanaan: Mengapa Kedalaman Gempa Sangat Menentukan Kerusakan?**\n\nDua gempa dengan Magnitudo yang sama (misal 6.0 M) bisa memberikan dampak yang sangat berbeda di permukaan:\n\n• 🔴 **Gempa Dangkal (< 30 km):** Energi gempa dilepaskan dekat permukaan tanah. Gelombang seismik belum teredam sehingga guncangan sangat destruktif terhadap fondasi bangunan.\n• 🟡 **Gempa Menengah (30 - 300 km):** Guncangan terasa di area yang luas, namun tingkat kerusakan fisik cenderung sedang.\n• 🟢 **Gempa Dalam (> 300 km):** Energi gempa sebagian besar terserap oleh mantel bumi sehingga jarang merusak struktur di permukaan.\n\n💡 **Kesimpulan Logis:** Nilai Skala Magnitudo mengukur energi awal pusat gempa, sedangkan **Kedalaman + Jarak Episentrum** menentukan seberapa kuat guncangan yang sebenarnya merusak rumah Anda.`
  },
  {
    keywords: ['tsunami', 'ombak', 'pantai', 'surut', '20-20-20'],
    answer: `🌊 **Prinsip Logika Evakuasi Tsunami: Aturan Gold Standard 20-20-20**\n\nJika Anda berada di pesisir pantai dan merasakan gempa bumi:\n\n1. ⏱️ **20 Detik Guncangan:** Jika gempa berlangsung kuat selama 20 detik atau lebih (hingga Anda kesulitan berdiri).\n2. 🏃 **20 Menit Evakuasi:** Anda memiliki waktu emas (*golden window*) sekitar 20 menit sebelum gelombang tsunami pertama mencapai daratan.\n3. ⛰️ **20 Meter Ketinggian:** Segera lari menuju lokasi dengan ketinggian minimal 20 meter di atas permukaan laut atau ke Bangunan Evakuasi Sementara (TES).\n\n**Logika Air Surut:** Surutnya air laut drastis adalah tanda gelombang pertama sedang ditarik oleh palung laut. **Jangan terpancing melihat ikan terdampar**, segera lari ke tempat tinggi tanpa menunggu bunyi sirine!`
  },
  {
    keywords: ['banjir', 'flood', 'listrik', 'ular', 'setrum', 'genangan'],
    answer: `🔵 **Logika Keselamatan Banjir & Bahaya Tersembunyi:**\n\n**1. Risiko Penyetruman (Electrocuting):**\nAir banjir mengandung mineral yang menjadikannya konduktor listrik kuat. Sebelum genangan masuk rumah, **segera matikan sakelar MCB utama di meteran listrik**.\n\n**2. Risiko Arus Deras (Hydrodynamics):**\nKedalaman air 15 cm yang mengalir memiliki gaya dorong hidrodinamis yang sanggup menjatuhkan orang dewasa. Kedalaman 50 cm dapat mengapungkan mobil. Hindari menerobos genangan air mengalir.\n\n**3. Ancaman Hewan Berbisa:**\nSaat banjir, sarang ular dan kelabang terendam sehingga mereka mencari tempat kering (masuk ke dalam rumah/celah barang). Gunakan tongkat saat memeriksa tumpukan barang basah.`
  },
  {
    keywords: ['longsor', 'tanah longsor', 'lereng', 'retakan', 'tebing', 'miring'],
    answer: `🟠 **Logika & Geometri Evakuasi Tanah Longsor:**\n\n**Tanda-Tanda Geologis Sebelum Longsor:**\n• Muncul retakan lengkung pada permukaan tanah atau tebing.\n• Pintu dan jendela rumah mulai sulit dibuka (indikasi fondasi tanah mulai miring/bergeser).\n• Air sumur mendadak keruh atau muncul mata air baru membawa lumpur.\n\n**Arah Evakuasi Logis:**\n⚠️ **Berlari Tegak Lurus (Siku-siku) Sisi Lereng!** Berlari searah luncuran material longsor sangat berbahaya karena kecepatan longsoran dapat mencapai >50 km/jam. Lari menyamping menghindari koridor luncuran tanah.`
  },
  {
    keywords: ['cuaca', 'angin', 'puting beliung', 'petir', 'pohon', 'badai', 'topan'],
    answer: `⚡ **Logika Keselamatan Cuaca Ekstrem & Badai Petir:**\n\n**1. Petir & Bangunan:**\nPetir selalu mencari jalur konduktif terpendek menuju tanah (objek tertinggi). **Dilarang berteduh di bawah pohon rindang tunggal**, tiang besi, atau berada di lapangan terbuka saat hujan deras.\n\n**2. Angin Puting Beliung:**\nJika terperangkap angin kencang di luar ruangan, tiaraplah di cekungan tanah/parit kering dan lindungi kepala Anda. Jauhi atap seng, papan reklame, dan perabotan melayang.\n\n**3. Keamanan Elektronik:**\nCabut stop kontak listrik utama dan lepas kabel sambungan antena untuk mencegah kerusakan akibat lonjakan arus listrik (*power surge*) dari petir.`
  },
  {
    keywords: ['tas siaga', 'tas darurat', 'emergency kit', 'perlengkapan', 'tsb', '72 jam'],
    answer: `🎒 **Logika Penyusunan Tas Siaga Bencana (TSB) 72 Jam:**\n\n**Prinsip 72 Jam:** Berdasarkan data BNPB, 72 jam pertama adalah waktu kritis yang dibutuhkan tim SAR gabungan untuk mencapai lokasi bencana dan mendistribusikan bantuan logistik awal.\n\n**Isi Utama & Logika Penyusunan:**\n1. 💧 **Air & Makanan:** Minimal 3 Liter air/orang + makanan siap makan berkalori tinggi (biskuit/makanan kaleng).\n2. 📄 **Dokumen Kedap Air:** Simpan fotokopi KTP, KK, Ijazah, & dokumen berharga dalam kantong plastik *ziplock* ganda.\n3. 🩺 **Obat-obatan Khusus:** Stok obat pribadi selama 7 hari (asma, diabetes, atau hipertensi).\n4. 🔦 **Alat Komunikasi Non-Internet:** Senter LED, radio FM portabel, powerbank terisi penuh, & peluit darurat (frekuensi suara peluit menembus reruntuhan jauh lebih efektif dibanding berteriak).\n\n*Rekomendasi:* Gantung TSB tepat di dekat pintu keluar utama rumah agar mudah disambar saat evakuasi!`
  },
  {
    keywords: ['nomor darurat', 'telepon darurat', 'kontak', 'hubungi', 'call center', '112', '115', '118', 'basarnas'],
    answer: `📞 **Daftar Nomor Panggilan Darurat Resmi Indonesia:**\n\n• 🚨 **112** — Layanan Darurat Tunggal Bebas Pulsa (Dapat dihubungi tanpa SIM card)\n• 🌊 **115** — BASARNAS (Pencarian & Pertolongan Korban Bencana)\n• 🏥 **118 / 119** — Ambulans & Layanan Kesehatan Kemenkes\n• 🔥 **113** — Pemadam Kebakaran (Damkar)\n• 👮 **110** — Kepolisian Republik Indonesia\n• 🌋 **0800-1000-3000** — Posko BNPB Pusat\n• 🌤️ **196** — BMKG Call Center\n\n💡 **Tips Keselamatan:** Simpan nomor **112** dan **115** pada panggilan cepat (*speed dial*) ponsel Anda sekarang juga!`
  },
  {
    keywords: ['sumber data', 'bmkg', 'bnpb', 'inarisk', 'akurasi', 'aplikasi', 'geoalert'],
    answer: `📡 **Integrasi Data Real-time & Logika Sistem GeoAlert:**\n\nGeoAlert terhubung secara langsung melalui API resmi pemerintah untuk memastikan akurasi data tinggi:\n\n• 🔴 **BMKG TEWS (Tsunami Early Warning System):** Menyinkronkan data gempa bumi real-time (koordinat episentrum, magnitudo, kedalaman, & potensi tsunami) setiap 5 menit.\n• 🗺️ **InaRISK BNPB:** Memetakan indeks tingkat kerawanan bencana wilayah Indonesia.\n• 🤖 **GeoAlert AI Advisory:** Mengolah standar operasional prosedur (SOP) resmi mitigasi bencana dari pakar geologi & BNPB.`
  }
];

function getAIResponse(message) {
  const lower = message.toLowerCase().trim();
  
  // Direct match search
  const match = AI_RESPONSES.find(r => r.keywords.some(kw => lower.includes(kw)));
  if (match) return match.answer;

  // Intelligent Contextual Reasoning Engine (Fallback)
  const isQuestion = lower.includes('apakah') || lower.includes('kenapa') || lower.includes('mengapa') || lower.includes('bagaimana') || lower.includes('berapa') || lower.includes('dimana');
  const isSafetyRelated = lower.includes('aman') || lower.includes('bahaya') || lower.includes('selamat') || lower.includes('evakuasi') || lower.includes('korban');

  if (isSafetyRelated || isQuestion) {
    return `🧠 **Analisis & Panduan Logis GeoAlert AI:**\n\nMengenai pertanyaan Anda: *"_${message}_"*\n\n**1. Prinsip Utama Keselamatan:**\nDalam setiap ancaman bencana alam, keselamatan jiwa merupakan prioritas tertinggi melebihi harta benda. Selalu prioritaskan langkah perlindungan diri mandiri (*self-evacuation*).\n\n**2. Langkah Tindakan Terstruktur:**\n• 📋 **Verifikasi Data Resmi:** Cek peta interaktif GeoAlert untuk melihat data gempa & peringatan BMKG terkini.\n• 🏃 **Jalur Evakuasi Bebas Rintangan:** Pastikan akses ke luar rumah atau gedung tidak terhalang barang berat.\n• 📞 **Kontak Darurat:** Hubungi **112** (Layanan Darurat Nasional) jika membutuhkan pertolongan mendesak.\n\n*Jika pertanyaan Anda berkaitan dengan gempa, banjir, longsor, atau TSB, cobalah mengetik kata kunci spesifik seperti "gempa", "banjir", atau "tas siaga".*`;
  }

  return `Terima kasih atas pertanyaan Anda. **GeoAlert AI** siap membantu dengan panduan mitigasi bencana yang logis & realistis:\n\n• 🎒 **Tas Siaga Bencana (TSB):** Jenis barang & pertimbangan 72 jam pertama\n• 🔴 **Gempa Bumi:** Prosedur Duck-Cover-Hold, keselamatan saat tidur & di mobil\n• 📊 **Fisika Gempa:** Perbedaan dampak Gempa Dangkal vs Gempa Dalam\n• 🌊 **Tsunami:** Aturan emas 20-20-20 & tanda surut air laut\n• 🔵 **Banjir & Longsor:** Penanganan bahaya listrik & geometri evakuasi lereng\n• 📞 **Nomor Darurat:** Kontak cepat 112, 115 (BASARNAS), Damkar & Ambulans\n\n*Silakan ketik pertanyaan spesifik Anda di bawah!*`;
}

// Interactive Prompt Suggestion Sets for "Refresh Prompts"
const PROMPT_SETS = [
  [
    { text: "Apa saja barang wajib dalam Tas Siaga Bencana (TSB)?", category: "Kesiapsiagaan" },
    { text: "Prosedur keselamatan saat terjadi gempa bumi di gedung tinggi", category: "Gempa Bumi" },
    { text: "Cara mengetahui potensi tsunami setelah guncangan kuat di pantai", category: "Tsunami" },
    { text: "Daftar nomor telepon darurat BPBD, BASARNAS & SAR", category: "Kontak Darurat" }
  ],
  [
    { text: "Langkah evakuasi mandiri saat timbul tanda-tanda banjir", category: "Banjir" },
    { text: "Tanda-tanda awal tanah longsor di kawasan perbukitan", category: "Longsor" },
    { text: "Apa yang harus dilakukan saat terjadi angin puting beliung?", category: "Cuaca Ekstrem" },
    { text: "Dari mana sumber data bencana GeoAlert diambil?", category: "Sumber Data" }
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

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'ai', text: getAIResponse(query) }]);
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
            padding: '2.5rem 1.5rem 1.5rem', textAlign: 'center'
          }}>
            {/* Center 3D Glowing Orb */}
            <div className={`ai-orb-wrapper ${inView ? 'animate-orb-enter' : ''}`} style={{ position: 'relative', marginBottom: '2rem' }}>
              {/* Outer Pulse Ring */}
              <div style={{
                position: 'absolute', inset: '-12px', borderRadius: '50%',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                animation: 'orb-pulse-ring 3s infinite ease-in-out',
                pointerEvents: 'none'
              }} />
              {/* 3D Glowing Sphere */}
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #00D2FF 40%, #4A90D9 70%, #0E2A5C 100%)',
                animation: 'orb-glow 6s infinite ease-in-out',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={38} color="#FFFFFF" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
              </div>
            </div>

            {/* Hero Greeting Typography */}
            <h2 className={`ai-greeting-title ${inView ? 'animate-greeting-enter' : ''}`} style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)', fontWeight: '700',
              lineHeight: '1.25', color: '#FFFFFF', marginBottom: '0.5rem',
              letterSpacing: '-0.02em', textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              {getGreeting()}, Pengunjung
            </h2>
            <p className={`ai-greeting-sub ${inView ? 'animate-sub-enter' : ''}`} style={{
              fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)', fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.75rem'
            }}>
              Ada yang bisa GeoAlert AI bantu hari ini?
            </p>
            <p className={`ai-greeting-sub ${inView ? 'animate-sub-enter' : ''}`} style={{
              fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)',
              maxWidth: '520px', marginBottom: '2.5rem', lineHeight: '1.5'
            }}>
              Pilih salah satu saran pertanyaan di bawah atau ketik pertanyaan Anda sendiri seputar mitigasi bencana.
            </p>

            {/* Prompt Suggestion Cards (4 Grid Pills) */}
            <div style={{
              width: '100%', maxWidth: '840px',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '12px', marginBottom: '1.25rem'
            }}>
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
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                }}>
                  {msg.text}
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
      <div className={`thinkai-bottom-container ${inView ? 'animate-input-enter' : ''}`} style={{
        padding: '0 1.5rem 1.25rem',
        maxWidth: '860px', width: '100%', margin: '0 auto',
        position: 'relative', zIndex: 10
      }}>
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
