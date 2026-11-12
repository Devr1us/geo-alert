import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, RefreshCw, Paperclip, Camera, ChevronDown,
  RotateCcw, Sparkles, ShieldCheck, Square, Copy, Check,
  ThumbsUp, ThumbsDown, AlertTriangle
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Konfigurasi renderer marked: link selalu target _blank dan rel noopener noreferrer
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

// Kumpulan 12 saran pertanyaan kebencanaan (Campuran semua jenis bencana)
const ALL_SUGGESTIONS = [
  { text: "Apa yang harus dilakukan saat gempa kuat terjadi di gedung tinggi?", category: "Gempa Bumi" },
  { text: "Kapan harus evakuasi setelah gempa di pantai? (Aturan 20-20-20)", category: "Tsunami" },
  { text: "Bagaimana cara melindungi diri dan keluarga dari kabut asap karhutla?", category: "Karhutla" },
  { text: "Langkah mematikan listrik dan evakuasi saat air banjir mulai masuk rumah", category: "Banjir" },
  { text: "Tanda-tanda lereng rawan longsor dan arah evakuasi yang benar", category: "Longsor" },
  { text: "Jenis masker apa yang wajib digunakan saat hujan abu vulkanik?", category: "Gunung Api" },
  { text: "Apa saja barang wajib dalam Tas Siaga Bencana (TSB) 72 jam?", category: "Kesiapsiagaan" },
  { text: "Nomor darurat bebas pulsa apa yang bisa dihubungi saat bencana?", category: "Nomor Darurat" },
  { text: "Perbedaan titik panas satelit NASA FIRMS dengan kebakaran aktif", category: "Karhutla" },
  { text: "Apakah gempa bumi bisa diprediksi tanggal dan jam terjadinya?", category: "Edukasi Sains" },
  { text: "Pertolongan pertama pada korban yang terkena serpihan kaca saat gempa", category: "P3K" },
  { text: "Bagaimana cara membaca status risiko pada peta GeoAlert?", category: "Panduan Aplikasi" }
];

// Deteksi kata kunci darurat untuk memunculkan Emergency Card
const EMERGENCY_KEYWORDS = [
  'sedang gempa', 'gempa kuat', 'terjebak', 'banjir masuk', 'kebakaran',
  'tolong', 'tertimbun', 'air naik', 'panik', 'sesak nafas asap', 'darurat'
];

function isEmergencyQuery(text) {
  const lower = (text || '').toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
}

// Generator 4 saran acak
function getRandomSuggestions(count = 4) {
  const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function AIChat({ isFloating = false, initialMessage = '' }) {
  // Session storage untuk persistensi percakapan
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('geoalert_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState(initialMessage);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState(() => getRandomSuggestions(4));
  const [selectedModel, setSelectedModel] = useState("Mode Cepat (Flash)");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [reactions, setReactions] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastUserMessage, setLastUserMessage] = useState('');

  // Auto-scroll control
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const scrollAreaRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isInitialMount = useRef(true);

  // Simpan riwayat percakapan ke sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('geoalert_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('[GeoAlert AI] Gagal menyimpan history ke sessionStorage:', e);
    }
  }, [messages]);

  // Deteksi scroll manual pengguna (hentikan auto-scroll jika user scroll ke atas)
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setUserScrolledUp(!isAtBottom);
  };

  // Scroll otomatis hanya kontainer chat internal saat ada pesan baru atau streaming aktif,
  // TIDAK menggulir window/halaman utama agar user tetap melihat peta bencana
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!userScrolledUp && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isStreaming, userScrolledUp]);

  // Sapaan ramah sesuai jam WIB
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  // Kirim initialMessage jika disediakan via props
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setInput(initialMessage);
      handleSend(initialMessage);
    }
  }, [initialMessage]);

  /**
   * Eksekusi pengiriman pesan ke LLM backend via Server-Sent Events
   */
  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    setErrorMessage(null);
    setLastUserMessage(query);
    setInput('');
    setUserScrolledUp(false); // Reset auto-scroll saat mengirim pesan baru

    const userMsg = { role: 'user', content: query, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Siapkan placeholder pesan asisten dengan indikator streaming
    const assistantIndex = newMessages.length;
    const assistantMsg = {
      role: 'assistant',
      content: '',
      isStreaming: true,
      isEmergency: isEmergencyQuery(query),
      timestamp: Date.now()
    };
    setMessages([...newMessages, assistantMsg]);
    setIsStreaming(true);

    // Filter dan sanitasi riwayat percakapan: buang pesan error/fallback, batasi 8 pesan terakhir
    const cleanHistory = newMessages
      .filter(m => !m.isError && m.content && !m.content.startsWith('⚠️'))
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Timeout otomatis 50 detik untuk permintaan
    const timeoutId = setTimeout(() => {
      controller.abort(new Error('Batas waktu koneksi terlampaui.'));
    }, 50000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({
          messages: cleanHistory,
          session_id: 'sess_' + (sessionStorage.getItem('geoalert_session_id') || Math.random().toString(36).substring(7)),
          lokasi_kota: 'Indonesia',
          model: selectedModel.includes('Pro') ? 'gemini-3.5-flash' : 'gemini-3.5-flash'
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Kuota penyedia AI sedang mencapai batas sesaat (Rate Limit 429). Silakan tunggu sebentar.');
        }
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server merespons error (HTTP ${response.status})`);
      }

      // Baca stream SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.token) {
                accumulatedContent += data.token;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated[assistantIndex]) {
                    updated[assistantIndex] = {
                      ...updated[assistantIndex],
                      content: accumulatedContent,
                      isStreaming: true
                    };
                  }
                  return updated;
                });
              }
            } catch (e) {
              // Line json parse exception ignored
            }
          } else if (trimmed === 'event: done') {
            // Selesai streaming
          }
        }
      }

      // Selesai streaming penuh
      setMessages(prev => {
        const updated = [...prev];
        if (updated[assistantIndex]) {
          updated[assistantIndex] = {
            ...updated[assistantIndex],
            isStreaming: false
          };
        }
        return updated;
      });

    } catch (err) {
      if (err.name === 'AbortError' && !err.message.includes('Batas waktu')) {
        // User menekan tombol "Hentikan"
        setMessages(prev => {
          const updated = [...prev];
          if (updated[assistantIndex]) {
            updated[assistantIndex] = {
              ...updated[assistantIndex],
              content: updated[assistantIndex].content + '\n\n*(Pesan dihentikan oleh pengguna)*',
              isStreaming: false
            };
          }
          return updated;
        });
      } else {
        // Tampilkan pesan error ramah
        console.error('[GeoAlert AI] Stream error:', err);
        const errMsg = err.message || 'Gagal terhubung ke layanan GeoAlert AI.';
        setErrorMessage(errMsg);
        setMessages(prev => {
          const updated = [...prev];
          if (updated[assistantIndex]) {
            updated[assistantIndex] = {
              ...updated[assistantIndex],
              content: `⚠️ **Maaf, terjadi kendala koneksi.**\n\n${errMsg}\n\nUntuk bantuan darurat segera hubungi **112** atau BPBD setempat.`,
              isStreaming: false,
              isError: true
            };
          }
          return updated;
        });
      }
    } finally {
      clearTimeout(timeoutId);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Hentikan streaming yang sedang berjalan
  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Keyboard navigation: Enter kirim, Shift+Enter baris baru
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Muat ulang 4 saran pertanyaan acak
  const handleRefreshPrompts = () => {
    setActiveSuggestions(getRandomSuggestions(4));
  };

  // Percakapan Baru (Reset)
  const handleResetChat = () => {
    if (isStreaming) handleStopStream();
    setMessages([]);
    setInput('');
    setErrorMessage(null);
    try {
      sessionStorage.removeItem('geoalert_chat_history');
    } catch {}
  };

  // Salin jawaban AI ke clipboard
  const handleCopy = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // Reaksi jempol suka / tidak
  const handleReaction = (idx, type) => {
    setReactions(prev => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type
    }));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--chat-bg, #FFFFFF)',
        color: 'var(--chat-text, #0F1E3D)',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid var(--chat-border, rgba(15, 23, 42, 0.08))',
        boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)'
      }}
    >
      {/* ================= HEADER BAR ================= */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--chat-border, rgba(15, 23, 42, 0.08))',
        background: '#FFFFFF',
        zIndex: 10,
        flexShrink: 0
      }}>
        {/* Logo & Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284C7 0%, #4A90D9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
          }}>
            <Sparkles size={18} color="#FFFFFF" />
          </div>
          <span style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.01em', color: 'var(--chat-text, #0F1E3D)' }}>
            GeoAlert AI
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '20px',
            background: '#EAF4FF', border: '1px solid #BAE6FD',
            fontSize: '0.72rem', color: '#0B5CAD', fontWeight: '600'
          }}>
            <ShieldCheck size={13} color="#0B5CAD" />
            Berbasis panduan BMKG &amp; BNPB
          </span>
        </div>

        {/* Action: Percakapan Baru */}
        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '20px',
              background: '#F1F5F9', border: '1px solid #CBD5E1',
              color: '#334155', fontSize: '0.8rem', fontWeight: '500',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
            title="Mulai percakapan baru"
          >
            <RotateCcw size={14} /> Percakapan Baru
          </button>
        )}
      </div>

      {/* ================= MAIN SCROLL AREA ================= */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="ai-chat-scroll-area dark-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* MODE 1: WELCOME DASHBOARD (Saat belum ada pesan) */}
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem 1rem 1rem', textAlign: 'center',
            width: '100%', boxSizing: 'border-box'
          }}>
            {/* Glowing Orb */}
            <div style={{ position: 'relative', marginBottom: '1rem', flexShrink: 0 }}>
              <div style={{
                position: 'absolute', inset: '-10px', borderRadius: '50%',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                animation: 'orb-pulse-ring 3s infinite ease-in-out',
                pointerEvents: 'none'
              }} />
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #00D2FF 40%, #4A90D9 70%, #0E2A5C 100%)',
                animation: 'orb-glow 6s infinite ease-in-out',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={30} color="#FFFFFF" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }} />
              </div>
            </div>

            {/* Greeting Headline */}
            <h2 style={{
              fontSize: 'clamp(1.4rem, 2.5vw, 2.1rem)', fontWeight: '700',
              lineHeight: '1.25', color: 'var(--chat-text, #0F1E3D)', marginBottom: '0.35rem',
              letterSpacing: '-0.02em'
            }}>
              {getGreeting()}, Pengunjung
            </h2>
            <p style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)', fontWeight: '600',
              color: '#1E293B', marginBottom: '0.35rem'
            }}>
              Ada yang bisa GeoAlert AI bantu hari ini?
            </p>
            <p style={{
              fontSize: '0.85rem', color: 'var(--chat-muted, #475569)',
              maxWidth: '520px', marginBottom: '1.25rem', lineHeight: '1.5'
            }}>
              Pilih salah satu saran di bawah atau ketik langsung pertanyaan Anda seputar gempa, karhutla, banjir, atau panduan mitigasi lainnya.
            </p>

            {/* Suggestion Cards Grid */}
            <div className="thinkai-prompts-container">
              {activeSuggestions.map((p, idx) => (
                <button
                  key={idx}
                  className="thinkai-prompt-card"
                  onClick={() => handleSend(p.text)}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--chat-text, #0F1E3D)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.text}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: '700', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                color: 'var(--chat-muted, #475569)', fontSize: '0.8rem',
                cursor: 'pointer', transition: 'color 0.2s', padding: '6px 12px', marginTop: '8px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--chat-text, #0F1E3D)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--chat-muted, #475569)'; }}
            >
              <RefreshCw size={13} /> Muat ulang saran pertanyaan
            </button>
          </div>
        ) : (
          /* MODE 2: ACTIVE CONVERSATION TRAJECTORY */
          <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                {/* AI Avatar */}
                {msg.role === 'assistant' && (
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284C7 0%, #4A90D9 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                  }}>
                    <Bot size={20} color="#FFFFFF" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  
                  {/* Emergency Alert Card (jika kondisi darurat terdeteksi) */}
                  {msg.role === 'assistant' && msg.isEmergency && (
                    <div style={{
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      marginBottom: '4px',
                      animation: 'fadeIn 0.3s ease-out'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontWeight: '700', fontSize: '0.82rem', marginBottom: '6px' }}>
                        <AlertTriangle size={15} color="#EF4444" /> SITUASI DARURAT — SEGERA HUBUNGI:
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <a href="tel:112" style={{ background: '#EF4444', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>🚨 112 (Nasional)</a>
                        <a href="tel:115" style={{ background: '#0284C7', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>🌊 115 (Basarnas)</a>
                        <a href="tel:117" style={{ background: '#D97706', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>🌋 117 (BNPB)</a>
                        <a href="tel:113" style={{ background: '#DC2626', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>🚒 113 (Damkar)</a>
                      </div>
                    </div>
                  )}

                  {/* Bubble Body */}
                  <div
                    role={msg.role === 'assistant' ? 'status' : undefined}
                    aria-live={msg.role === 'assistant' ? 'polite' : undefined}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '20px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #0E2A5C 0%, #1e5bb8 100%)'
                        : '#F8FAFC',
                      border: msg.role === 'user'
                        ? '1px solid rgba(14, 42, 92, 0.4)'
                        : '1px solid #E2E8F0',
                      color: msg.role === 'user' ? '#FFFFFF' : 'var(--chat-text, #0F1E3D)',
                      fontSize: '0.92rem',
                      lineHeight: '1.65',
                      boxShadow: msg.role === 'user'
                        ? '0 4px 14px rgba(14, 42, 92, 0.25)'
                        : '0 2px 8px rgba(15, 23, 42, 0.04)'
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      msg.content ? (
                        <div
                          className="ai-chat-bubble-markdown"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />
                      ) : (
                        /* Typing indicator saat menunggu token pertama */
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '4px 0' }}>
                          {[0, 1, 2].map(dot => (
                            <div key={dot} style={{
                              width: '7px', height: '7px', borderRadius: '50%',
                              background: '#0284C7',
                              animation: `typing-dot 1.2s ease-in-out ${dot * 0.2}s infinite`
                            }} />
                          ))}
                        </div>
                      )
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </div>
                    )}
                  </div>

                  {/* Action Toolbar on Assistant Response (Copy, Feedback & Coba Lagi) */}
                  {msg.role === 'assistant' && msg.content && !msg.isStreaming && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px', marginTop: '2px' }}>
                      <button
                        onClick={() => handleCopy(msg.content, i)}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: copiedIndex === i ? '#16A34A' : '#64748B',
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px'
                        }}
                        title="Salin jawaban"
                      >
                        {copiedIndex === i ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedIndex === i ? 'Tersalin' : 'Salin'}</span>
                      </button>

                      <button
                        onClick={() => handleReaction(i, 'like')}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: reactions[i] === 'like' ? '#0284C7' : '#94A3B8',
                          padding: '2px 4px'
                        }}
                        title="Membantu"
                      >
                        <ThumbsUp size={13} />
                      </button>

                      <button
                        onClick={() => handleReaction(i, 'dislike')}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: reactions[i] === 'dislike' ? '#EF4444' : '#94A3B8',
                          padding: '2px 4px'
                        }}
                        title="Kurang membantu"
                      >
                        <ThumbsDown size={13} />
                      </button>

                      {msg.isError && lastUserMessage && (
                        <button
                          onClick={() => handleSend(lastUserMessage)}
                          style={{
                            background: '#FEE2E2', border: '1px solid #FCA5A5',
                            color: '#DC2626', padding: '2px 8px', borderRadius: '6px',
                            fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <RefreshCw size={11} /> Coba lagi
                        </button>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ================= INPUT FOOTER BAR ================= */}
      <div className="thinkai-bottom-container" style={{ flexShrink: 0 }}>
        <div className="thinkai-input-box">
          {/* Main Input Textarea */}
          <textarea
            ref={inputRef}
            rows={messages.length === 0 ? 2 : 1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={
              isStreaming
                ? "GeoAlert AI sedang merespons..."
                : messages.length === 0
                ? "Tanyakan seputar gempa, karhutla, banjir, atau panduan evakuasi..."
                : "Ketik pertanyaan Anda..."
            }
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--chat-text, #0F1E3D)', fontSize: '0.95rem', resize: 'none', fontFamily: 'inherit',
              lineHeight: '1.5'
            }}
          />

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
            
            {/* Model Indicator Pill */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '20px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#334155', fontSize: '0.76rem',
                  fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <ShieldCheck size={13} color="#0284C7" />
                {selectedModel} <ChevronDown size={12} />
              </button>

              {showModelDropdown && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
                  background: '#FFFFFF', border: '1px solid #E2E8F0',
                  borderRadius: '14px', padding: '6px', width: '210px',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)', zIndex: 50
                }}>
                  {[
                    { label: "Mode Cepat (Flash)", desc: "Respon instan standar (Gemini Flash)" },
                    { label: "Mode Teliti (Pro)", desc: "Analisis mitigasi mendalam" }
                  ].map(m => (
                    <button
                      key={m.label}
                      onClick={() => { setSelectedModel(m.label); setShowModelDropdown(false); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 10px',
                        borderRadius: '8px', background: 'transparent', border: 'none',
                        color: 'var(--chat-text, #0F1E3D)', fontSize: '0.76rem', cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ fontWeight: 600 }}>{m.label}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Attachment (disabled with tooltip), Stop & Send Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="thinkai-icon-btn"
                title="Fitur lampirkan dokumen (Segera hadir)"
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                disabled
              >
                <Paperclip size={16} />
              </button>

              <button
                className="thinkai-icon-btn"
                title="Fitur analisis foto bencana (Segera hadir)"
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                disabled
              >
                <Camera size={16} />
              </button>

              {/* Tombol Hentikan (saat streaming) ATAU Tombol Kirim */}
              {isStreaming ? (
                <button
                  onClick={handleStopStream}
                  aria-label="Hentikan Jawaban"
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: '#FFFFFF', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
                  }}
                  title="Hentikan respon"
                >
                  <Square size={14} fill="#FFFFFF" />
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  aria-label="Kirim Pesan"
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                    background: input.trim()
                      ? 'linear-gradient(135deg, #0284C7 0%, #0E2A5C 100%)'
                      : '#E2E8F0',
                    color: input.trim() ? '#FFFFFF' : '#94A3B8',
                    cursor: input.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: input.trim() ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
                  }}
                >
                  <Send size={16} />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Footer Disclaimer & Hint */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '8px', padding: '0 4px',
          fontSize: '0.72rem', color: '#64748B'
        }}>
          <span>GeoAlert AI dapat membuat kekeliruan. Selalu verifikasi informasi dengan BMKG &amp; BNPB.</span>
          <span style={{ display: 'none', md: 'inline' }}>Shift + Enter untuk baris baru</span>
        </div>
      </div>
    </div>
  );
}
