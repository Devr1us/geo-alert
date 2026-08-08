import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, RefreshCw, Paperclip, Camera, ChevronDown,
  RotateCcw, Sparkles, ShieldCheck
} from 'lucide-react';

// Keyword-based AI response engine (BMKG & BNPB Official Guidance)
const AI_RESPONSES = [
  {
    keywords: ['tas siaga', 'tas darurat', 'emergency kit', 'perlengkapan', 'tsb'],
    answer: `🎒 **Tas Siaga Bencana (TSB)** sebaiknya dipersiapkan untuk 3 hari pertama pasca-bencana:\n\n• 💧 **Air Minum:** Minimal 1 liter/orang/hari & makanan tahan lama (biskuit/makanan kaleng)\n• 🩺 **P3K & Obat:** Obat-obatan pribadi, kasa steril, antiseptik & plester\n• 🔦 **Penerangan & Komunikasi:** Senter LED, radio portabel, baterai cadangan\n• 📄 **Dokumen Penting:** KTP, KK, akte, surat tanah/tabungan dalam kantong plastik kedap air\n• 👕 **Pakaian & Perlindungan:** Pakaian ganti, selimut hangat, jas hujan lipat\n• 📱 **Daya:** Power bank terisi penuh & kabel charger\n• 🔑 **Alat Darurat:** Peluit darurat (signal), pisau lipat & uang tunai secukupnya\n\n*Simpan TSB di dekat pintu keluar utama agar mudah diambil saat evakuasi darurat.*`
  },
  {
    keywords: ['gempa', 'earthquake', 'seisme', 'guncangan', 'gedung'],
    answer: `🔴 **Prosedur Keselamatan Gempa Bumi (SOP BMKG):**\n\n**Saat Guncangan Terjadi:**\n1. **Duck, Cover, Hold On:** Merunduk, berlindung di bawah meja kuat, pegang kaki meja.\n2. **Jauhi Bahaya:** Jauhi jendela kaca, cermin, dan perabotan yang mudah roboh.\n3. **Jika di Gedung Tinggi:** Jangan gunakan lift! Gunakan tangga darurat setelah guncangan berhenti.\n4. **Jika di Luar Ruangan:** Cari area terbuka, jauhi gedung, tiang listrik, dan pohon besar.\n\n**Setelah Guncangan:**\n• Waspadai gempa susulan (*aftershocks*).\n• Periksa kebocoran gas dan matikan saluran listrik utama.\n• Untuk wilayah pesisir: Jika guncangan kuat & berlangsung lebih dari 1 menit, **segera lari ke dataran tinggi** (potensi tsunami).`
  },
  {
    keywords: ['banjir', 'flood', 'air', 'genangan', 'evakuasi banjir'],
    answer: `🔵 **Prosedur Keselamatan Banjir (SOP BNPB):**\n\n**Tindakan Cepat:**\n1. **Matikan Utilitas:** Segera putus aliran listrik dari meteran utama untuk mencegah tersetrum.\n2. **Amankan Barang:** Pindahkan dokumen penting & perangkat elektronik ke lantai atas atau tempat tinggi.\n3. **Evakuasi Jalur Darat:** Gunakan bot/sepatu karet. Hindari berjalan di aliran air yang deras (>15 cm dapat menjatuhkan orang dewasa).\n4. **Hubungi BPBD:** Telepon 112 atau kontak BPBD setempat untuk bantuan perahu karet.\n\n**Pasca Banjir:** Waspadai instalasi listrik basah, hewan berbisa yang terbawa arus, dan selalu gunakan air matang.`
  },
  {
    keywords: ['longsor', 'tanah longsor', 'landslide', 'bukit', 'lereng'],
    answer: `🟠 **Panduan Mitigasi Tanah Longsor:**\n\n**Tanda-tanda Bahaya Longsor:**\n• Muncul retakan baru di tanah/lereng atau dinding rumah.\n• Air sumur/mata air mendadak keruh atau mengering secara tiba-tiba.\n• Terdengar suara gemuruh atau pohon tumbang dari arah lereng.\n\n**Tindakan Darurat:**\n• Lari tegak lurus mengindari arah luncuran longsoran (jangan berlari searah luncuran).\n• Jauhi kawasan lembah dan dasar lereng terjal.\n• Segera laporkan ke posko BPBD terdekat.`
  },
  {
    keywords: ['tsunami', 'ombak', 'pantai', 'surut'],
    answer: `🌊 **Peringatan Dini & Prosedur Tsunami:**\n\n**Tanda Alam Tsunami:**\n1. Gempa bumi kuat di pesisir pantai (>6.0 M).\n2. Air laut mendadak surut secara drastis hingga ikan terdampar.\n3. Terdengar suara gemuruh seperti pesawat jet dari arah laut.\n\n**Tindakan Kunci:**\n• **Lari ke Tempat Tinggi!** Evakuasi mandiri ke ketinggian minimal 20-30 meter di atas permukaan laut atau ke *Evacuation Building*.\n• **Jangan Menunggu Sirine!** Jika merasakan gempa kuat di pantai, segera evakuasi tanpa menunggu konfirmasi.`
  },
  {
    keywords: ['cuaca ekstrem', 'angin', 'topan', 'badai', 'puting beliung', 'hujan deras'],
    answer: `💨 **Prosedur Keselamatan Cuaca Ekstrem:**\n\n• Segera masuk ke dalam bangunan permanen yang kokoh.\n• Hindari berteduh di bawah pohon rindang, baliho, atau tiang listrik.\n• Cabut stop kontak perangkat elektronik saat terjadi badai petir.\n• Pantau informasi cuaca terkini dari radar BMKG via aplikasi GeoAlert.`
  },
  {
    keywords: ['nomor darurat', 'telepon darurat', 'kontak', 'hubungi', 'call center'],
    answer: `📞 **Daftar Nomor Darurat Bencana Indonesia:**\n\n• 🚨 **Panggilan Darurat Nasional:** 112 (Bebas Pulsa)\n• 🌊 **BASARNAS (Search & Rescue):** 115\n• 🏥 **Ambulans / Kemenkes:** 118 / 119\n• 🔥 **Pemadam Kebakaran:** 113\n• ⛑️ **PMI (Palang Merah):** 021-7992325\n• 🌋 **BPBD Pusat BNPB:** 0800-1000-3000\n• 🌤️ **Call Center BMKG:** 196 / 021-6546315\n\n*Simpan nomor-nomor ini di kontak cepat ponsel Anda!*`
  },
  {
    keywords: ['sumber data', 'bmkg', 'bnpb', 'inarisk', 'akurasi'],
    answer: `📡 **Integrasi Data Resmi GeoAlert:**\n\nGeoAlert terhubung secara langsung via API resmi dengan:\n• **BMKG:** Data real-time gempa bumi terkini & dirasakan di Indonesia (otomatis disinkronkan setiap 5 menit).\n• **BNPB & InaRISK:** Peta potensi risiko bencana wilayah Indonesia.\n\nSemua panduan AI diproses berdasarkan dokumen SOP resmi keselamatan bencana nasional.`
  }
];

const DEFAULT_RESPONSE = `Terima kasih atas pertanyaan Anda. GeoAlert AI dapat memberikan panduan resmi terkait:\n\n• 🎒 **Tas Siaga Bencana (TSB):** Daftar perlengkapan darurat keluarga\n• 🔴 **Gempa Bumi:** Prosedur Duck, Cover, Hold On & evakuasi gedung\n• 🔵 **Banjir & Tsunami:** Langkah evakuasi mandiri & peringatan dini\n• 🟠 **Tanah Longsor & Cuaca Ekstrem:** Tanda-tanda bahaya & tindakan awal\n• 📞 **Nomor Darurat:** Kontak resmi BASARNAS, BPBD, BMKG & Ambulans\n\n*Coba klik salah satu kartu saran di atas atau ketik pertanyaan spesifik Anda!*`;

function getAIResponse(message) {
  const lower = message.toLowerCase();
  const match = AI_RESPONSES.find(r => r.keywords.some(kw => lower.includes(kw)));
  return match ? match.answer : DEFAULT_RESPONSE;
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
