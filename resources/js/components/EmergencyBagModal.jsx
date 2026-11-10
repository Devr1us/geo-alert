import React, { useState, useEffect } from 'react';
import { Briefcase, Printer, CheckSquare, Square, X, Download, ShieldCheck, AlertCircle } from 'lucide-react';

const TSB_ITEMS = [
  { id: 'water', category: 'Kebutuhan Pokok', label: 'Air Minum Bersih', desc: 'Minimal 3 liter per orang per hari (cukup untuk 72 jam pertama)' },
  { id: 'food', category: 'Kebutuhan Pokok', label: 'Makanan Siap Santap', desc: 'Makanan kaleng, biskuit berkalori tinggi, makanan instan tidak mudah basi' },
  { id: 'docs', category: 'Dokumen Penting', label: 'Dokumen Penting Kedap Air', desc: 'Fotokopi KTP, KK, Akta Kelahiran, Ijazah, & surat tanah dalam kantong ziplock' },
  { id: 'p3k', category: 'Kesehatan & Medis', label: 'Kotak P3K & Obat Pribadi', desc: 'Perban, antiseptik, parasetamol, plus obat resep rutin untuk 7 hari (asma/darah tinggi)' },
  { id: 'light', category: 'Peralatan Darurat', label: 'Senter LED & Baterai Cadangan', desc: 'Alat penerangan utama saat jaringan listrik PLN padam total pasca bencana' },
  { id: 'whistle', category: 'Peralatan Darurat', label: 'Peluit Darurat Frekuensi Tinggi', desc: 'Sinyal suara penolong jika terjebak reruntuhan tanpa membuang energi berteriak' },
  { id: 'radio', category: 'Peralatan Darurat', label: 'Radio Portabel FM/AM', desc: 'Memantau informasi resmi siaran darurat BMKG & BNPB tanpa jaringan internet' },
  { id: 'powerbank', category: 'Peralatan Darurat', label: 'Powerbank Terisi Penuh', desc: 'Menjaga baterai ponsel tetap aktif untuk komunikasi panggilan darurat 112/115' },
  { id: 'clothes', category: 'Sandang & Hangat', label: 'Pakaian Ganti & Selimut', desc: 'Baju lengan panjang, celana panjang, pakaian dalam, jas hujan, & selimut termal' },
  { id: 'cash', category: 'Finansial Darurat', label: 'Uang Tunai Pecahan Kecil', desc: 'Untuk transaksi darurat saat mesin ATM dan pembayaran digital mati listrik' },
  { id: 'hygiene', category: 'Sanitasi & Kebersihan', label: 'Masker & Perlengkapan Higienis', desc: 'Masker medis/N95 (melindungi debu/abu), hand sanitizer, sabun, & kantong sampah' },
  { id: 'special', category: 'Kebutuhan Khusus', label: 'Kebutuhan Bayi / Lansia (Jika Ada)', desc: 'Popok, susu formula, makanan khusus lansia, atau kacamata cadangan' },
];

export default function EmergencyBagModal({ onClose }) {
  // State checklist tersimpan di localStorage
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('geoalert_tsb_checked');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('geoalert_tsb_checked', JSON.stringify(checkedItems));
    } catch {}
  }, [checkedItems]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const toggleItem = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / TSB_ITEMS.length) * 100);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="tsb-modal-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(14, 42, 92, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fade-in-up 0.3s ease',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tsb-modal-title"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="tsb-print-container"
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(14, 42, 92, 0.4)',
          border: '1px solid rgba(14, 42, 92, 0.15)'
        }}
      >
        {/* Modal Header */}
        <div className="no-print" style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to right, #F8FAFC, #EFF6FF)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #0E2A5C 0%, #1e5bb8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14, 42, 92, 0.25)'
            }}>
              <Briefcase size={22} color="#FFFFFF" />
            </div>
            <div>
              <h3 id="tsb-modal-title" style={{ margin: 0, fontSize: '1.25rem', color: '#0E2A5C', fontWeight: '800' }}>
                Checklist Tas Siaga Bencana (TSB)
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                Panduan Perlengkapan Kritis 72 Jam Mandiri — Standar Resmi BNPB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup checklist"
            style={{
              background: 'rgba(14,42,92,0.06)', border: 'none', cursor: 'pointer',
              color: 'var(--color-primary)', padding: '8px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Tracker Bar */}
        <div className="no-print" style={{
          padding: '12px 2rem', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={18} color="#0E2A5C" />
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0E2A5C' }}>
              Kesiapan Tas Anda: {completedCount} dari {TSB_ITEMS.length} Barang ({progressPercent}%)
            </span>
          </div>
          <div style={{ width: '140px', height: '8px', background: '#CBD5E1', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`, height: '100%',
              background: progressPercent === 100 ? '#16A34A' : '#0E2A5C',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Printable Sheet Wrapper */}
        <div className="tsb-print-sheet" style={{ overflowY: 'auto', padding: '1.75rem 2rem', flex: 1 }}>
          
          {/* Header cetak (hanya tampil saat window.print() / media print) */}
          <div className="print-only" style={{ display: 'none', marginBottom: '1.5rem', borderBottom: '2px solid #0E2A5C', paddingBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0E2A5C', fontWeight: '900' }}>
              GeoAlert — Checklist Tas Siaga Bencana (TSB) 72 Jam
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#475569' }}>
              Standar Kesiapsiagaan Mandiri BNPB Indonesia • Nomor Panggilan Darurat: 112 / BASARNAS: 115
            </p>
          </div>

          <div style={{
            background: '#F8FAFC', borderRadius: '14px', padding: '12px 16px',
            marginBottom: '1.25rem', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#334155', lineHeight: '1.5'
          }}>
            💡 <strong>Prinsip 72 Jam:</strong> Dalam bencana alam besar, bantuan logistik SAR gabungan rata-rata baru tiba optimal di hari ke-3. Tas ini harus sanggup menjamin kelangsungan hidup mandiri keluarga Anda selama masa kritis tersebut. Letakkan TSB di dekat pintu keluar utama rumah.
          </div>

          {/* List of TSB Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TSB_ITEMS.map((item, idx) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px 16px', borderRadius: '14px',
                    background: isChecked ? '#F0FDF4' : '#FFFFFF',
                    border: isChecked ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ marginTop: '2px', color: isChecked ? '#16A34A' : '#94A3B8', flexShrink: 0 }}>
                    {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.925rem', fontWeight: '700',
                        color: isChecked ? '#166534' : '#0E2A5C',
                        textDecoration: isChecked ? 'line-through' : 'none'
                      }}>
                        {idx + 1}. {item.label}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: '10px',
                        background: '#F1F5F9', color: '#64748B'
                      }}>
                        {item.category}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748B', lineHeight: '1.4' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="no-print" style={{
          padding: '1rem 2rem', borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#F8FAFC', flexWrap: 'wrap', gap: '10px'
        }}>
          <button
            onClick={() => setCheckedItems({})}
            style={{
              background: 'transparent', border: 'none', color: '#64748B',
              fontSize: '0.825rem', cursor: 'pointer', textDecoration: 'underline'
            }}
          >
            Reset Centang
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '0.65rem 1.4rem', borderRadius: '20px',
                background: '#0E2A5C', color: '#FFFFFF', border: 'none',
                fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(14, 42, 92, 0.25)'
              }}
            >
              <Printer size={16} /> Cetak / Simpan PDF (A4)
            </button>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '0.65rem 1.25rem', borderRadius: '20px', fontSize: '0.875rem' }}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
