import React, { useState, useEffect } from 'react';
import { Activity, Wind, Droplets, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const MITIGATION_DATA = {
  gempa: {
    title: 'Prosedur Lengkap Mitigasi Gempa Bumi',
    icon: <Activity size={32} color="var(--color-alert)" />,
    color: 'var(--color-alert)',
    sections: [
      {
        heading: '🔴 Saat Gempa Terjadi',
        steps: [
          'DUCK: Berlutut dan lindungi kepala serta leher dengan kedua tangan',
          'COVER: Berlindung di bawah meja yang kokoh, atau di bawah rangka pintu yang kuat',
          'HOLD ON: Pegang erat tempat berlindung hingga guncangan berhenti',
          'Jauhi jendela, cermin, rak buku, dan lemari yang bisa jatuh',
          'Jika di dalam gedung tinggi, jangan gunakan lift — tetap di dalam hingga aman',
          'Jika di luar ruangan, hindari pohon, tiang listrik, dan gedung',
        ]
      },
      {
        heading: '🟡 Setelah Gempa Berhenti',
        steps: [
          'Periksa diri dan orang di sekitar dari kemungkinan cedera',
          'Keluar dari gedung dengan hati-hati lewat tangga darurat',
          'Periksa potensi kebocoran gas — jika mencium bau gas, buka jendela dan segera keluar',
          'Matikan sumber listrik dan gas jika aman dilakukan',
          'Jauhi area yang rusak dan tunggu informasi resmi dari BMKG',
          'Waspada gempa susulan (aftershock) yang bisa terjadi beberapa jam setelahnya',
        ]
      },
      {
        heading: '🌊 Jika Gempa di Dekat Pantai — Waspadai Tsunami',
        steps: [
          'Jika guncangan terasa kuat dan lama (>1 menit), langsung evakuasi ke daratan tinggi',
          'Jangan menunggu sirine atau peringatan resmi',
          'Naik ke ketinggian minimal 30 meter dari permukaan laut',
          'Jangan kembali ke pantai sebelum dinyatakan aman oleh pihak berwenang',
        ]
      },
      {
        heading: '📞 Nomor Darurat',
        steps: [
          'BPBD Nasional: 0800-1000-3000 (bebas pulsa)',
          'Basarnas (SAR): 115',
          'Nomor Darurat Nasional: 112',
        ]
      }
    ]
  },
  banjir: {
    title: 'Prosedur Lengkap Mitigasi Banjir',
    icon: <Droplets size={32} color="var(--color-standby)" />,
    color: 'var(--color-standby)',
    sections: [
      {
        heading: '🔵 Persiapan Sebelum Banjir',
        steps: [
          'Pantau informasi cuaca dan peringatan banjir dari BMKG secara berkala',
          'Siapkan tas siaga dengan dokumen penting, obat-obatan, dan makanan tahan lama',
          'Kenali jalur evakuasi dan lokasi posko banjir di sekitar rumah',
          'Angkat barang berharga dan dokumen ke lantai atas atau tempat tinggi',
          'Pastikan saluran drainase di sekitar rumah tidak tersumbat',
        ]
      },
      {
        heading: '🔴 Saat Banjir Terjadi',
        steps: [
          'Segera matikan arus listrik dari panel utama (meteran)',
          'Jangan mencoba menyeberangi aliran banjir yang deras — arus 15 cm saja bisa menghanyutkan',
          'Naik ke lantai atas atau tempat yang lebih tinggi dari rumah',
          'Ikuti arahan petugas BPBD dan jangan kembali sampai dinyatakan aman',
          'Gunakan tali atau pelampung jika terpaksa bergerak di air',
        ]
      },
      {
        heading: '🟡 Setelah Banjir Surut',
        steps: [
          'Hati-hati saat memasuki rumah — periksa struktur bangunan dan potensi listrik bocor',
          'Gunakan hanya air bersih atau matang untuk minum dan memasak',
          'Waspadai hewan berbisa (ular, kalajengking) yang terbawa banjir',
          'Bersihkan rumah dan perabotan dengan disinfektan',
          'Waspada penyakit pasca-banjir: diare, leptospirosis, dan infeksi kulit',
        ]
      },
      {
        heading: '📞 Nomor Darurat',
        steps: [
          'BPBD Nasional: 0800-1000-3000 (bebas pulsa)',
          'PMI (Palang Merah): 021-7992325',
          'Nomor Darurat Nasional: 112',
        ]
      }
    ]
  },
  cuaca: {
    title: 'Prosedur Lengkap Mitigasi Cuaca Ekstrem',
    icon: <Wind size={32} color="var(--color-status-warning)" />,
    color: 'var(--color-status-warning)',
    sections: [
      {
        heading: '💨 Saat Angin Kencang / Puting Beliung',
        steps: [
          'Segera masuk ke dalam bangunan yang paling kokoh terdekat',
          'Jauhi jendela dan pintu kaca',
          'Jika berada di luar dan tidak ada perlindungan, berbaring di parit atau tanah rendah',
          'Hindari berlindung di bawah pohon, jembatan, atau flyover',
          'Jauhi kabel listrik yang jatuh atau benda metal yang tinggi',
        ]
      },
      {
        heading: '⚡ Saat Hujan Lebat dan Petir',
        steps: [
          'Segera masuk ke dalam kendaraan atau bangunan yang tertutup',
          'Hindari berenang, memancing, atau berada di dekat badan air terbuka',
          'Matikan dan jauhkan peralatan elektronik dari stopkontak',
          'Jangan berbaring di atas permukaan yang basah',
          'Jika tersambar petir, panggil bantuan darurat 118 segera',
        ]
      },
      {
        heading: '🌊 Saat Gelombang Tinggi / Badai di Pesisir',
        steps: [
          'Jauhi pantai dan area pesisir segera',
          'Nelayan: kembali ke darat dan amankan kapal',
          'Pantau peringatan dari BMKG Maritime',
          'Jangan melaut dalam kondisi cuaca buruk',
        ]
      },
      {
        heading: '📞 Nomor Darurat',
        steps: [
          'BMKG Info Cuaca: 021-6546315',
          'Nomor Darurat Nasional: 112',
          'PMI (Palang Merah): 021-7992325',
        ]
      }
    ]
  }
};

export default function MitigationModal({ type, onClose }) {
  const data = MITIGATION_DATA[type];
  if (!data) return null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(14, 42, 92, 0.5)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fade-in-up 0.3s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(14, 42, 92, 0.3)',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--color-bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '12px', background: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              {data.icon}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary)' }}>{data.title}</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Sumber: BNPB & BMKG Indonesia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup panduan"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', padding: '8px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.target.style.background = 'var(--color-border)'}
            onMouseOut={e => e.target.style.background = 'none'}
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', padding: '2rem', flex: 1 }}>
          {data.sections.map((section, si) => (
            <div key={si} style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                {section.heading}
              </h4>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {section.steps.map((step, i) => (
                  <li key={i} style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    marginBottom: '10px', padding: '10px 14px',
                    background: 'var(--color-bg)', borderRadius: 'var(--radius-md)',
                    fontSize: '0.95rem', lineHeight: '1.5',
                  }}>
                    <CheckCircle size={18} color={data.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 2rem', borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--color-bg)',
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Tekan <kbd style={{ padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'monospace' }}>Esc</kbd> untuk menutup
          </p>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: '0.5rem 1.5rem' }}>
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
