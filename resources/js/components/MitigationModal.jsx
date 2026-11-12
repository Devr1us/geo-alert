import React, { useEffect } from 'react';
import { Activity, Wind, Droplets, Mountain, Waves, Flame, X, CheckCircle, ShieldAlert, PhoneCall, Info } from 'lucide-react';

export const MITIGATION_DATA = {
  gempa: {
    title: 'SOP Mitigasi Gempa Bumi',
    subtitle: 'Rujukan Standar Operasional Prosedur BMKG & BNPB',
    icon: <Activity size={32} color="var(--color-alert)" />,
    color: 'var(--color-alert)',
    category: 'Geologi',
    sections: [
      {
        phase: 'before',
        heading: '🛡️ Sebelum Gempa (Kesiapsiagaan)',
        steps: [
          'Kenali jalur evakuasi aman dan tentukan titik kumpul (assembly point) di area terbuka bebas reruntuhan.',
          'Pastikan perabot berat, lemari tinggi, dan water heater telah dibaut kokoh ke dinding untuk mencegah roboh.',
          'Siapkan Tas Siaga Bencana (TSB) berisi kebutuhan darurat 72 jam di dekat pintu keluar utama rumah.',
          'Simpan nomor darurat 112 dan 115 pada panggilan cepat ponsel seluruh anggota keluarga.',
          'Periksa instalasi gas dan sekring listrik secara berkala, ketahui cara mematikannya secara cepat.'
        ]
      },
      {
        phase: 'during',
        heading: '🚨 Saat Gempa Terjadi (Perlindungan Diri)',
        steps: [
          'Terapkan prosedur baku: DUCK (merunduk), COVER (lindungi kepala & leher), HOLD ON (pegang kaki meja kokoh).',
          'Jika di tempat tidur, jangan panik berdiri! Tengkurap dan lindungi kepala serta leher dengan bantal tebal.',
          'DILARANG KERAS MENGGUNAKAN LIFT! Evakuasi selalu melalui tangga darurat setelah guncangan berhenti.',
          'Jauhi jendela kaca, cermin besar, dinding rapuh, dan rak buku yang rentan runtuh.',
          'Jika sedang mengemudi, perlambat laju, tepi kendaraan di area terbuka jauh dari flyover/tiang listrik, dan pasang rem tangan.'
        ]
      },
      {
        phase: 'after',
        heading: '🟡 Sesudah Gempa (Evakuasi & Pemulihan)',
        steps: [
          'Keluar dari bangunan secara tertib dengan melindungi kepala menggunakan tas atau kedua tangan.',
          'Matikan sakelar MCB listrik utama dan tabung gas segera sebelum meninggalkan rumah.',
          'Jangan menyalakan korek api atau sakelar lampu jika mencium bau gas yang bocor.',
          'Waspadai gempa susulan (aftershock) yang kekuatannya bisa melemahkan struktur bangunan retak.',
          'Pantau informasi resmi pembaruan magnitudo dan potensi tsunami dari BMKG TEWS melalui GeoAlert.'
        ]
      }
    ]
  },

  tsunami: {
    title: 'SOP Mitigasi Bencana Tsunami',
    subtitle: 'Rujukan Standar Operasional Prosedur BMKG TEWS & BNPB',
    icon: <Waves size={32} color="#0284C7" />,
    color: '#0284C7',
    category: 'Kelautan & Seismik',
    sections: [
      {
        phase: 'before',
        heading: '🛡️ Sebelum Tsunami (Kesiapsiagaan Pesisir)',
        steps: [
          'Ketahui zona rawan tsunami dan hafalkan rute menuju Tempat Evakuasi Sementara (TES) berketinggian >20 meter dpl.',
          'Pahami tanda-tanda alam: gempa kuat >20 detik, surutnya air laut mendadak, atau suara gemuruh dari arah laut.',
          'Siapkan pelampung atau jaket keselamatan bersama Tas Siaga Bencana (TSB) keluarga di kawasan pesisir.',
          'Ikuti latihan simulasi evakuasi mandiri tsunami (*tsunami drill*) yang diadakan BPBD setempat.'
        ]
      },
      {
        phase: 'during',
        heading: '🚨 Saat Terjadi Tsunami (Evakuasi Emas 20-20-20)',
        steps: [
          'Terapkan aturan emas 20-20-20: Gempa terasa 20 detik, Anda punya waktu emas 20 menit, segera lari ke tempat setinggi 20 meter dpl.',
          'JANGAN PERNAH mendekati pantai untuk melihat air laut surut atau mengambil ikan yang terdampar!',
          'Segera evakuasi dengan BERLARI, jangan gunakan mobil atau motor jika jalur evakuasi padat/macet.',
          'Jika terperangkap dan tidak sempat ke bukit, naik ke lantai tertinggi gedung evakuasi bertulang beton kokoh (minimal lantai 3).'
        ]
      },
      {
        phase: 'after',
        heading: '🟡 Sesudah Tsunami (Kewaspadaan Gelombang Lanjutan)',
        steps: [
          'Tetap berada di tempat penampungan tinggi sampai ada pernyataan resmi "Peringatan Tsunami Berakhir" dari BMKG.',
          'Ingat: Gelombang tsunami datang berupa serangkaian gelombang, gelombang ke-2 dan ke-3 seringkali jauh lebih dahsyat dari gelombang pertama.',
          'Jauhi muara sungai, pelabuhan, dan jembatan pesisir yang rawan ambruk pasca tersapu air.',
          'Hindari genangan air sisa tsunami karena berisiko tersengat aliran listrik atau terkontaminasi limbah berbahaya.'
        ]
      }
    ]
  },

  banjir: {
    title: 'SOP Mitigasi Banjir & Banjir Bandang',
    subtitle: 'Rujukan Standar Operasional Prosedur BNPB & BMKG',
    icon: <Droplets size={32} color="var(--color-standby)" />,
    color: 'var(--color-standby)',
    category: 'Hidrometeorologi',
    sections: [
      {
        phase: 'before',
        heading: '🛡️ Sebelum Banjir (Kesiapsiagaan)',
        steps: [
          'Pantau peringatan dini curah hujan lebat dari BMKG dan tinggi muka air pintu air setempat.',
          'Amankan dokumen berharga, surat tanah, dan ijazah ke dalam kantong plastik ziplock kedap air di lantai atas.',
          'Bersihkan selokan, parit, dan gorong-gorong di lingkungan sekitar agar aliran air tidak tersumbat.',
          'Ketahui lokasi posko pengungsian banjir dan siapkan obat pribadi serta stok air minum bersih.'
        ]
      },
      {
        phase: 'during',
        heading: '🚨 Saat Banjir Terjadi (Tanggap Darurat)',
        steps: [
          'SEGERA MATIKAN sakelar MCB listrik utama pada meteran rumah sebelum air mulai masuk.',
          'Pindahkan tabung gas ke tempat tinggi dan cabut regulator kompor.',
          'DILARANG MENEROBOS genangan air mengalir: kedalaman 15 cm berarus kuat sanggup menjatuhkan orang dewasa.',
          'Waspadai saluran air terbuka, gorong-gorong tanpa tutup, dan lubang tersembunyi di bawah genangan.',
          'Segera evakuasi ke tempat yang lebih tinggi jika air naik dengan cepat (terutama bahaya banjir bandang).'
        ]
      },
      {
        phase: 'after',
        heading: '🟡 Sesudah Banjir (Pemulihan & Sanitasi)',
        steps: [
          'Periksa instalasi kelistrikan oleh teknisi berwenang sebelum menyalakan kembali sakelar listrik.',
          'Waspadai hewan berbisa seperti ular dan kalajengking yang sering bersarang di tumpukan perabot basah.',
          'Gunakan hanya air bersih matang untuk minum dan memasak guna mencegah diare dan penyakit leptospirosis.',
          'Bersihkan lumpur dan disinfeksi seluruh lantai serta perabotan rumah secara menyeluruh.'
        ]
      }
    ]
  },

  longsor: {
    title: 'SOP Mitigasi Tanah Longsor',
    subtitle: 'Rujukan Standar Operasional Prosedur PVMBG & BNPB',
    icon: <Mountain size={32} color="var(--color-status-warning)" />,
    color: 'var(--color-status-warning)',
    category: 'Geologi & Gerakan Tanah',
    sections: [
      {
        phase: 'before',
        heading: '🛡️ Sebelum Longsor (Pengenalan Gejala Awal)',
        steps: [
          'Waspadai tanda awal: muncul retakan melengkung pada tanah tebing, jalan aspal retak, atau pohon dan tiang mulai miring.',
          'Perhatikan perubahan air tanah: air sumur mendadak keruh atau muncul mata air baru yang bercampur lumpur.',
          'Pintu atau jendela rumah mulai seret dan sulit dibuka/ditutup (indikasi pondasi tanah di bawah mulai bergeser).',
          'Jangan mendirikan bangunan di dekat bibir tebing curam atau di bawah tebing tanpa terasering memadai.'
        ]
      },
      {
        phase: 'during',
        heading: '🚨 Saat Longsor Terjadi (Arah Evakuasi Nyata)',
        steps: [
          'Jika mendengar suara gemuruh keras atau getaran dari bukit, SEGERA EVAKUASI KELUAR RUMAH!',
          'EVAKUASI TEGAK LURUS (MENYAMPING): Berlari menyamping dari jalur luncuran tanah, jangan pernah lari searah longsoran!',
          'Jika tidak sempat keluar rumah, meringkuk seperti bola di bawah meja kokoh dan lindungi kepala serta leher Anda.',
          'Hindari berteduh di bawah lereng curam, lereng timbunan tanah galian, atau dasar lembah sempit.'
        ]
      },
      {
        phase: 'after',
        heading: '🟡 Sesudah Longsor (Kewaspadaan Longsor Susulan)',
        steps: [
          'JAUHI AREA LONGSORAN! Tanah di sekitar lokasi masih sangat jenuh air dan rentan terjadi longsor susulan.',
          'Bantu evakuasi korban hanya jika Anda berada di area aman dan memiliki peralatan yang memadai.',
          'Laporkan segera kerusakan fasilitas jalan, pipa air, atau tiang listrik ke posko tanggap darurat BPBD.',
          'Tetap berada di posko pengungsian sampai geolog BPBD/PVMBG menyatakan lereng aman dari pergerakan tanah.'
        ]
      }
    ]
  },

  cuaca: {
    title: 'SOP Mitigasi Cuaca Ekstrem & Angin Kencang',
    subtitle: 'Rujukan Standar Operasional Prosedur BMKG',
    icon: <Wind size={32} color="#D97706" />,
    color: '#D97706',
    category: 'Meteorologi',
    sections: [
      {
        phase: 'before',
        heading: '🛡️ Sebelum Cuaca Ekstrem (Kesiapsiagaan)',
        steps: [
          'Pangkas ranting dan dahan pohon yang rimbun atau rapuh di dekat atap rumah dan kabel listrik.',
          'Periksa kekuatan rangka atap seng, genteng, dan pastikan papan reklame/antena terikat kuat.',
          'Bersihkan talang air dan saluran drainase atap untuk menghindari luapan air hujan lebat ke plafon.',
          'Pantau peringatan dini cuaca ekstrem harian melalui radar BMKG di aplikasi GeoAlert.'
        ]
      },
      {
        phase: 'during',
        heading: '🚨 Saat Cuaca Ekstrem & Petir Terjadi',
        steps: [
          'Segera masuk ke dalam bangunan tertutup yang kokoh, jauhi jendela dan pintu kaca.',
          'DILARANG KERAS berteduh di bawah pohon rindang tunggal, halte rapuh, atau dekat tiang listrik saat hujan petir.',
          'Jika terperangkap angin puting beliung di luar, segera tiarap di saluran air kering atau cekungan tanah sambil melindungi kepala.',
          'Lepaskan kabel stopkontak peralatan elektronik untuk mencegah kerusakan lonjakan arus akibat sambaran petir.'
        ]
      },
      {
        phase: 'after',
        heading: '🟡 Sesudah Cuaca Ekstrem Mereda',
        steps: [
          'Waspadai kawat listrik yang putus bergelantungan atau terendam air — jangan disentuh sama sekali!',
          'Periksa kondisi plafon dan struktur genteng yang retak sebelum beraktivitas kembali di dalam rumah.',
          'Hindari berkendara melewati jalanan yang banyak tertutup ranting patah atau pohon tumbang yang belum dievakuasi.'
        ]
      }
    ]
  },

  karhutla: {
    title: 'SOP Mitigasi Karhutla & Kabut Asap',
    subtitle: 'Rujukan Standar Operasional Prosedur BNPB, Manggala Agni & NASA FIRMS',
    icon: <Flame size={32} color="#EA580C" />,
    color: '#EA580C',
    category: 'Kebakaran Hutan & Lahan',
    sections: [
      {
        phase: 'before',
        heading: '🛡️ Sebelum Karhutla (Kesiapsiagaan & Pencegahan)',
        steps: [
          'Pantau titik panas (hotspot) aktif secara real-time melalui GeoAlert yang menampilkan data satelit NASA FIRMS VIIRS.',
          'Siapkan masker N95/KN95 (bukan masker bedah biasa) dan kacamata pelindung untuk seluruh anggota keluarga di musim kemarau.',
          'DILARANG MEMBAKAR lahan, semak, atau sampah di musim kemarau — pelanggaran dapat dikenai sanksi pidana UUPK No. 32/2009.',
          'Tutup rapat ventilasi, celah pintu, dan jendela dengan kain lembab jika kabut asap mulai terdeteksi di sekitar hunian.',
          'Simpan nomor darurat Manggala Agni (021-5733433) dan BPBD setempat pada kontak cepat ponsel keluarga.',
          'Ketahui jalur evakuasi dan lokasi posko kesehatan terdekat jika kualitas udara memburuk ke level Berbahaya (ISPU > 300).'
        ]
      },
      {
        phase: 'during',
        heading: '🚨 Saat Karhutla & Kabut Asap Aktif (Perlindungan Diri)',
        steps: [
          'Pantau Indeks Standar Pencemar Udara (ISPU) harian melalui aplikasi BMKG atau Kemen-LHK — hindari aktivitas luar jika ISPU > 100 (Tidak Sehat).',
          'Selalu kenakan masker N95/KN95 saat terpaksa beraktivitas di luar ruangan, terutama bagi lansia, anak-anak, dan penderita ISPA/asma.',
          'Kurangi drastis aktivitas fisik berat di luar ruangan — debu PM2.5 yang sangat halus dapat masuk jauh ke dalam alveoli paru-paru.',
          'Siapkan nebulizer, bronkodilator, dan obat pernapasan bagi anggota keluarga yang memiliki riwayat penyakit asma atau PPOK.',
          'Jangan menyalakan AC dengan sirkulasi udara dari luar — gunakan mode recirculate (sirkulasi dalam ruangan) untuk mengurangi paparan asap.',
          'Jika melihat titik api yang baru muncul, segera laporkan ke posko BPBD terdekat atau hubungi Call Center 112 / Manggala Agni.'
        ]
      },
      {
        phase: 'after',
        heading: '🟡 Sesudah Karhutla Mereda (Pemulihan & Pencegahan Ulang)',
        steps: [
          'Bersihkan rumah secara menyeluruh dari sisa partikel debu PM2.5 dan PM10 yang menempel pada permukaan furnitur dan lantai.',
          'Ganti filter AC dan air purifier yang sudah penuh partikel debu setelah periode kabut asap yang panjang.',
          'Periksakan kondisi kesehatan pernapasan ke dokter atau puskesmas terdekat jika mengalami batuk kering, sesak, atau iritasi mata berkepanjangan.',
          'Laporkan kondisi lahan gambut yang rawan kebakaran di sekitar tempat tinggal kepada aparat desa atau Manggala Agni untuk dilakukan pemantauan.',
          'Dukung program pembasahan kembali (rewetting) lahan gambut yang dilakukan BRGM dan KLHK sebagai upaya pencegahan jangka panjang.'
        ]
      }
    ]
  },

  gunungapi: {
    title: 'SOP Mitigasi Erupsi Gunung Api',
    subtitle: 'Rujukan Standar Operasional Prosedur PVMBG (Pusat Vulkanologi) & BNPB',
    icon: <Flame size={32} color="#DC2626" />,
    color: '#DC2626',
    category: 'Vulkanologi',
    sections: [
      {
        phase: 'before',
        heading: '🛡️ Sebelum Erupsi (Kesiapsiagaan Wilayah KRB)',
        steps: [
          'Ketahui tingkat aktivitas gunung api (Normal, Waspada, Siaga, Awas) dari PVMBG/Magma Indonesia.',
          'Siapkan masker khusus partikel debu (N95/KN95) dan kacamata pelindung (*goggles*) di dalam Tas Siaga Bencana.',
          'Ketahui batas radius bahaya (Kawasan Rawan Bencana) yang direkomendasikan dan titik kumpul evakuasi desa.',
          'Tutup rapat tempat penampungan air bersih dan amankan pakan ternak dari paparan abu vulkanik.'
        ]
      },
      {
        phase: 'during',
        heading: '🚨 Saat Erupsi Terjadi (Perlindungan Diri Instan)',
        steps: [
          'Segera kenakan masker, kacamata pelindung, baju lengan panjang, dan celana panjang untuk melindungi kulit dari abu panas.',
          'SEGERA MENJAUH dari radius bahaya yang ditetapkan, jangan berada di lembah sungai yang berhulu di puncak gunung.',
          'Waspadai awan panas (*wedhus gembel*) yang berkecepatan tinggi: segera bergerak menjauh tegak lurus arah luncuran.',
          'Jika berada di dalam ruangan, tutup rapat seluruh ventilasi, pintu, dan jendela dengan kain basah untuk menyaring debu silika.'
        ]
      },
      {
        phase: 'after',
        heading: '🟡 Sesudah Erupsi (Sanitasi & Waspada Lahar Dingin)',
        steps: [
          'Bersihkan timbunan abu vulkanik tebal dari atap rumah sesegera mungkin untuk mencegah atap ambruk karena beban berat.',
          'Tetap gunakan masker saat beraktivitas di luar rumah selama abu vulkanik masih beterbangan ditiup angin.',
          'Waspadai BAHAYA LAHAR DINGIN saat turun hujan lebat di hulu gunung — jauhi bantaran sungai!',
          'Tunggu rekomendasi resmi PVMBG sebelum kembali ke pemukiman di sekitar kawasan lereng.'
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
        background: 'rgba(14, 42, 92, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fade-in-up 0.3s ease',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mitigation-modal-title"
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-white)',
          borderRadius: '24px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '88vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(14, 42, 92, 0.35)',
          border: '1px solid rgba(14, 42, 92, 0.12)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to right, #F8FAFC, #F1F5F9)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '12px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              {data.icon}
            </div>
            <div>
              <span style={{
                display: 'inline-block', fontSize: '0.7rem', fontWeight: '700',
                textTransform: 'uppercase', color: data.color, letterSpacing: '0.05em', marginBottom: '2px'
              }}>
                {data.category} • Standar SOP 3 Fase
              </span>
              <h3 id="mitigation-modal-title" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: '800' }}>
                {data.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{data.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup panduan"
            style={{
              background: 'rgba(14,42,92,0.06)', border: 'none', cursor: 'pointer',
              color: 'var(--color-primary)', padding: '8px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(14,42,92,0.14)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(14,42,92,0.06)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', padding: '1.75rem', flex: 1 }}>
          <div style={{
            background: 'rgba(74,144,217,0.08)', borderRadius: '12px', padding: '10px 14px',
            marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '0.825rem', color: '#0E2A5C', border: '1px solid rgba(74,144,217,0.2)'
          }}>
            <Info size={16} color="#0E2A5C" style={{ flexShrink: 0 }} />
            <span>Panduan ini disusun berdasarkan protokol mitigasi resmi <strong>BNPB, BMKG, dan PVMBG</strong> untuk keselamatan warga.</span>
          </div>

          {data.sections.map((section, si) => (
            <div key={si} style={{ marginBottom: '1.75rem' }}>
              <h4 style={{
                color: 'var(--color-primary)', marginBottom: '0.85rem', fontSize: '1.05rem',
                fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {section.heading}
              </h4>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {section.steps.map((step, i) => (
                  <li key={i} style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: '10px 14px', background: '#F8FAFC', borderRadius: '12px',
                    fontSize: '0.9rem', lineHeight: '1.55', border: '1px solid rgba(14,42,92,0.05)'
                  }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                      border: `1.5px solid ${data.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: '700', color: data.color, flexShrink: 0, marginTop: '1px'
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ color: '#1E293B', fontWeight: '500' }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}

          {/* Emergency Hotline Alert Box inside Modal */}
          <div style={{
            padding: '12px 16px', background: '#FEF2F2', borderRadius: '14px',
            border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#DC2626" />
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#991B1B' }}>
                Panggilan Darurat Bebas Pulsa: 112 / BASARNAS: 115
              </span>
            </div>
            <a
              href="tel:112"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', background: '#DC2626', color: 'white',
                borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none'
              }}
            >
              <PhoneCall size={14} /> Hubungi 112
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem', borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--color-bg)',
        }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Tekan <kbd style={{ padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'monospace' }}>Esc</kbd> untuk menutup
          </p>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: '0.6rem 1.75rem', borderRadius: '20px' }}>
            Mengerti &amp; Siap
          </button>
        </div>
      </div>
    </div>
  );
}
