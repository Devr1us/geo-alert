import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Minimize2, Maximize2, Activity, ChevronDown } from 'lucide-react';

// Keyword-based AI response engine (Prototype)
const AI_RESPONSES = [
  {
    keywords: ['tas siaga', 'tas darurat', 'emergency kit', 'perlengkapan'],
    answer: `Tas Siaga Bencana (TSB) sebaiknya berisi keperluan untuk 3 hari pertama:\n\n• 💧 Air minum (1 liter/orang/hari) & makanan tahan lama\n• 🩺 Kotak P3K & obat-obatan pribadi\n• 🔦 Senter, radio portabel & baterai cadangan\n• 📄 Dokumen penting (KTP, akte, buku tabungan) dalam plastik kedap air\n• 👕 Pakaian ganti & jas hujan lipat\n• 📱 Power bank terisi penuh\n• 🔑 Peluit darurat & uang tunai secukupnya\n\nSimpan tas ini di tempat yang mudah dijangkau dan semua anggota keluarga mengetahui lokasinya.`
  },
  {
    keywords: ['gempa', 'earthquake', 'seisme', 'guncangan'],
    answer: `🔴 Prosedur Keselamatan saat Gempa Bumi:\n\n**Saat Gempa Terjadi:**\n• Berlindung di bawah meja kuat (Duck, Cover, Hold)\n• Jauhi jendela, kaca, dan perabotan berat\n• Jika di luar ruangan: jauhi pohon, tiang listrik & gedung\n• Jangan gunakan lift\n\n**Setelah Gempa:**\n• Waspada gempa susulan\n• Keluar dari gedung dengan hati-hati\n• Periksa gas dan matikan jika mencium bau\n• Pantau informasi dari BMKG: bmkg.go.id\n\nUntuk wilayah pesisir: segera evakuasi ke dataran tinggi untuk menghindari potensi tsunami.`
  },
  {
    keywords: ['banjir', 'flood', 'air', 'genangan'],
    answer: `🔵 Prosedur Keselamatan saat Banjir:\n\n**Sebelum Banjir:**\n• Pantau informasi cuaca dari BMKG\n• Siapkan tas siaga dan dokumen penting di tempat tinggi\n• Kenali jalur evakuasi di wilayah Anda\n\n**Saat Banjir:**\n• Matikan arus listrik dari meteran utama\n• Jangan mencoba menyeberangi aliran air yang deras\n• Naik ke lantai atas atau tempat yang lebih tinggi\n• Hubungi BPBD: 0800-1000-3000\n\n**Setelah Banjir:**\n• Hati-hati dengan hewan berbisa yang terbawa arus\n• Gunakan air bersih/matang untuk minum\n• Waspada penyakit kulit dan diare`
  },
  {
    keywords: ['longsor', 'tanah longsor', 'landslide'],
    answer: `🟠 Prosedur Keselamatan saat Longsor:\n\n**Tanda-tanda Akan Terjadi Longsor:**\n• Suara retakan tanah atau pohon tumbang\n• Air sumur/sungai mendadak keruh\n• Tanah terasa bergetar tanpa gempa\n\n**Saat Longsor:**\n• Segera lari menjauhi jalur longsor (berlari ke arah tegak lurus dari jalur)\n• Jangan mendekati lokasi longsor\n• Hubungi BPBD segera\n\n**Wilayah Rawan:** Daerah perbukitan dengan curah hujan tinggi di Jawa Barat, Sumatra, Sulawesi.`
  },
  {
    keywords: ['cuaca ekstrem', 'angin', 'topan', 'badai', 'puting beliung', 'tornado'],
    answer: `💨 Prosedur Keselamatan saat Cuaca Ekstrem:\n\n• Segera masuk ke dalam bangunan yang kokoh\n• Hindari berlindung di bawah pohon besar atau tiang listrik\n• Jauhi area terbuka dan pinggir pantai\n• Matikan peralatan elektronik yang tidak perlu\n• Pantau peringatan BMKG secara berkala\n\n**Nomor Darurat:**\n• BMKG Info: 021-6546315\n• Basarnas: 115\n• PMI: 021-7992325`
  },
  {
    keywords: ['tsunami', 'ombak besar', 'gelombang'],
    answer: `🌊 Prosedur Keselamatan saat Tsunami:\n\n**Tanda-tanda Tsunami:**\n• Gempa kuat di dekat pantai\n• Air laut mendadak surut jauh\n• Terdengar suara gemuruh dari laut\n\n**Saat Peringatan Tsunami:**\n• Segera berlari ke dataran tinggi minimal 30 meter dari permukaan laut\n• Jangan menunggu melihat gelombang\n• Jauhi pantai meski air terlihat tenang\n• Ikuti arahan sirine peringatan\n\n**Jangan kembali ke pantai** sampai petugas menyatakan aman!`
  },
  {
    keywords: ['evakuasi', 'mengungsi', 'jalur', 'escape'],
    answer: `🚨 Panduan Evakuasi Darurat:\n\n1. **Tetap tenang** dan jangan panik\n2. Ikuti jalur evakuasi yang telah ditentukan pemerintah daerah\n3. Bawa **hanya tas siaga** — jangan buang waktu untuk barang lain\n4. Bantu lansia, anak-anak, dan penyandang disabilitas di sekitar Anda\n5. Matikan gas, air, dan listrik sebelum meninggalkan rumah\n6. Jangan gunakan kendaraan saat jalur macet akibat bencana\n7. Hubungi anggota keluarga untuk memberitahukan keberadaan Anda\n\n**Titik Kumpul Aman:** Hubungi BPBD setempat untuk mengetahui lokasi posko darurat.`
  },
  {
    keywords: ['bmkg', 'api', 'data', 'sumber', 'informasi', 'update', 'pembaruan'],
    answer: `📡 Sumber Data GeoAlert:\n\nGeoAlert mengintegrasikan data dari sumber resmi:\n\n• **BMKG** (Badan Meteorologi, Klimatologi, dan Geofisika): Data gempa terkini & gempa dirasakan di seluruh Indonesia, diperbarui otomatis setiap 5 menit\n• **BNPB** (Badan Nasional Penanggulangan Bencana): Data bencana nasional\n• **InaRISK**: Peta risiko bencana berdasarkan wilayah\n\nData peta bencana diperbarui setiap 5 menit secara otomatis. Anda juga dapat menyegarkan data secara manual dengan menekan tombol "Segarkan" di sidebar peta.`
  },
  {
    keywords: ['halo', 'hai', 'hello', 'hi', 'selamat', 'pagi', 'siang', 'malam', 'sore'],
    answer: `Halo! 👋 Selamat datang di GeoAlert AI Assistant.\n\nSaya siap membantu Anda dengan informasi seputar:\n\n• 🔴 Prosedur keselamatan saat gempa bumi\n• 🔵 Panduan evakuasi saat banjir\n• 🟠 Mitigasi tanah longsor\n• 💨 Keselamatan saat cuaca ekstrem\n• 🌊 Peringatan dan prosedur tsunami\n• 🎒 Cara menyiapkan tas siaga bencana\n• 📡 Informasi sumber data BMKG & BNPB\n\nSilakan tanyakan apa saja tentang keselamatan dan kesiapsiagaan bencana di Indonesia!`
  },
  {
    keywords: ['nomor darurat', 'telepon darurat', 'kontak', 'hubungi'],
    answer: `📞 Nomor Darurat Bencana Indonesia:\n\n• 🚨 **Nomor Darurat Nasional:** 112\n• 🏥 **Ambulans:** 118 / 119\n• 🔥 **Pemadam Kebakaran:** 113\n• 🌊 **Basarnas (SAR):** 115\n• ⛑️ **PMI (Palang Merah):** 021-7992325\n• 🌋 **BPBD Nasional:** 0800-1000-3000 (bebas pulsa)\n• 🌤️ **BMKG Info Cuaca:** 021-6546315\n\nSimpan nomor-nomor ini di ponsel Anda sebelum bencana terjadi!`
  },
];

const DEFAULT_RESPONSE = `Terima kasih atas pertanyaan Anda. Saya dapat membantu dengan topik:\n\n• Prosedur keselamatan saat **gempa bumi**\n• Panduan evakuasi saat **banjir**\n• Mitigasi **tanah longsor** dan **tsunami**\n• Keselamatan saat **cuaca ekstrem**\n• Cara menyiapkan **tas siaga bencana**\n• **Nomor darurat** yang perlu disimpan\n• Informasi **sumber data** BMKG & BNPB\n\nCoba tanyakan salah satunya, contoh: *"Apa yang harus saya lakukan saat gempa?"*`;

function getAIResponse(message) {
  const lower = message.toLowerCase();
  const match = AI_RESPONSES.find(r => r.keywords.some(kw => lower.includes(kw)));
  return match ? match.answer : DEFAULT_RESPONSE;
}

function MessageBubble({ msg }) {
  const lines = msg.text.split('\n');

  return (
    <div style={{
      display: 'flex',
      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
      gap: '10px',
      marginBottom: '16px',
      alignItems: 'flex-start',
    }}>
      {msg.role === 'ai' && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), #1e5bb8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Bot size={18} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: '80%',
        padding: '12px 16px',
        borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
        background: msg.role === 'user'
          ? 'linear-gradient(135deg, var(--color-alert), #A33A1F)'
          : 'var(--color-white)',
        color: msg.role === 'user' ? 'white' : 'var(--color-text-main)',
        boxShadow: 'var(--shadow-sm)',
        border: msg.role === 'ai' ? '1px solid var(--color-border)' : 'none',
        fontSize: '0.9rem',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-primary), #1e5bb8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Bot size={18} color="white" />
      </div>
      <div style={{
        padding: '12px 16px', borderRadius: '20px 20px 20px 4px',
        background: 'var(--color-white)', border: '1px solid var(--color-border)',
        display: 'flex', gap: '4px', alignItems: 'center'
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--color-text-muted)',
            animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function AIChat({ isFloating = false, initialMessage = '' }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Halo! 👋 Saya GeoAlert AI Assistant. Saya dapat membantu Anda dengan panduan keselamatan bencana, prosedur evakuasi, atau informasi seputar mitigasi bencana di Indonesia.\n\nAda yang bisa saya bantu?'
    }
  ]);
  const [input, setInput] = useState(initialMessage);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'ai', text: getAIResponse(text) }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isFloating) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', background: '#F7F2EA',
      }}>
        {/* AI Header */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, var(--color-primary), #1e5bb8)',
          color: 'white',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem' }}>GeoAlert AI</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>● Online • Siap membantu</div>
            </div>
          </div>
          {/* Disclaimer — poin 6 */}
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.72rem',
            opacity: 0.9,
            lineHeight: '1.4',
          }}>
            ℹ️ Asisten berbasis panduan resmi, bukan AI generatif. Jawaban diambil dari SOP BMKG & BNPB.
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <style>{`
            @keyframes typing-dot {
              0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
              30% { transform: translateY(-8px); opacity: 1; }
            }
          `}</style>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0 }}>
          {['Tas siaga bencana', 'Prosedur gempa', 'Nomor darurat'].map(q => (
            <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
              style={{ whiteSpace: 'nowrap', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--color-border)', background: 'white', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: '500' }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px', flexShrink: 0, background: 'white' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pertanyaan Anda..."
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '24px',
              border: '1px solid var(--color-border)', outline: 'none',
              fontSize: '0.9rem', background: 'var(--color-bg)',
            }}
          />
          <button onClick={sendMessage} disabled={!input.trim()} aria-label="Kirim pesan"
            style={{
              width: '44px', height: '44px', borderRadius: '50%', border: 'none',
              background: input.trim() ? 'var(--color-alert)' : 'var(--color-border)',
              color: 'white', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Standalone / Landing page version
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
      {/* Disclaimer — poin 6 */}
      <div style={{
        padding: '6px 14px',
        background: 'rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        fontSize: '0.72rem',
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        ℹ️ Asisten berbasis panduan resmi BMKG &amp; BNPB — bukan AI generatif
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: '8px' }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya sesuatu tentang bencana..."
          style={{
            flex: 1, padding: '12px 20px', borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)', color: 'white',
            outline: 'none', fontSize: '0.95rem',
          }}
        />
        <button onClick={sendMessage} disabled={!input.trim()} aria-label="Kirim pesan"
          style={{
            width: '48px', height: '48px', borderRadius: '50%', border: 'none',
            background: input.trim() ? 'var(--color-alert)' : 'rgba(255,255,255,0.2)',
            color: 'white', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', flexShrink: 0,
          }}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
