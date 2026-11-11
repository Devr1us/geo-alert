<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use App\Services\KarhutlaService;
use Carbon\Carbon;

class ChatContextService
{
    protected KarhutlaService $karhutlaService;

    public function __construct(KarhutlaService $karhutlaService)
    {
        $this->karhutlaService = $karhutlaService;
    }

    /**
     * Membangun blok <DATA_TERKINI> untuk diinjeksi ke system prompt
     *
     * @param string|null $lokasiKota
     * @return string
     */
    public function buildCurrentDataContext(?string $lokasiKota = null): string
    {
        $nowWib = Carbon::now('Asia/Jakarta')->translatedFormat('d M Y, H:i:s') . ' WIB';
        $kotaLabel = !empty($lokasiKota) ? strip_tags(trim($lokasiKota)) : 'Tidak ditentukan';

        // 1. Data Gempa Terkini BMKG (5 gempa)
        $gempaText = $this->getLatestEarthquakesSummary();

        // 2. Data Karhutla NASA FIRMS
        $karhutlaText = $this->getKarhutlaSummary();

        $context = "<DATA_TERKINI>\n";
        $context .= "Waktu Data: {$nowWib}\n";
        $context .= "Lokasi Kota Pengguna: {$kotaLabel}\n\n";
        $context .= "[DATA GEMPA BUMI TERKINI BMKG (5 Kejadian Terakhir)]\n";
        $context .= $gempaText . "\n\n";
        $context .= "[DATA TITIK PANAS KARHUTLA NASA FIRMS (VIIRS 48 Jam)]\n";
        $context .= $karhutlaText . "\n";
        $context .= "</DATA_TERKINI>\n";

        return $context;
    }

    /**
     * Ambil 5 gempa terbaru dari cache BMKG
     */
    protected function getLatestEarthquakesSummary(): string
    {
        try {
            $data = Cache::remember('bmkg:gempa-terkini', 300, function () {
                $response = Http::timeout(5)
                    ->withHeaders(['User-Agent' => 'GeoAlert/1.0'])
                    ->get('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
                return $response->successful() ? $response->json() : null;
            });

            $list = $data['Infogempa']['gempa'] ?? [];
            if (empty($list)) {
                return "Data gempa BMKG saat ini belum dapat dimuat dari server.";
            }

            $five = array_slice($list, 0, 5);
            $lines = [];
            foreach ($five as $idx => $g) {
                $num = $idx + 1;
                $tgl = $g['Tanggal'] ?? '-';
                $jam = $g['Jam'] ?? '-';
                $mag = $g['Magnitude'] ?? '-';
                $ked = $g['Kedalaman'] ?? '-';
                $wil = $g['Wilayah'] ?? '-';
                $pot = $g['Potensi'] ?? '-';

                $lines[] = "{$num}. {$tgl} {$jam} | Magnitudo {$mag} | Kedalaman {$ked} | Wilayah: {$wil} | Potensi: {$pot}";
            }

            return implode("\n", $lines);
        } catch (\Throwable $e) {
            return "Informasi gempa terkini BMKG tidak dapat diakses sementara.";
        }
    }

    /**
     * Ambil ringkasan karhutla dari KarhutlaService
     */
    protected function getKarhutlaSummary(): string
    {
        try {
            $data = $this->karhutlaService->getKarhutlaData();
            $events = $data['events'] ?? [];
            $totalTitik = $data['total_titik'] ?? 0;
            $updatedAt = $data['updated_at'] ?? 'Baru saja';

            if (empty($events)) {
                return "Tidak terdeteksi titik panas karhutla signifikan berkategori Waspada atau Bahaya Tinggi di wilayah Indonesia saat ini (Pembaruan: {$updatedAt}).";
            }

            $bahayaTinggi = 0;
            $waspada = 0;
            $provinces = [];

            foreach ($events as $ev) {
                if (($ev['status'] ?? '') === 'Bahaya Tinggi') $bahayaTinggi++;
                else $waspada++;

                $prov = $ev['wilayah']['provinsi'] ?? null;
                if ($prov && !in_array($prov, $provinces)) {
                    $provinces[] = $prov;
                }
            }

            $provStr = !empty($provinces) ? implode(', ', array_slice($provinces, 0, 5)) : 'Beberapa wilayah';
            $summary = "Total kluster terpantau: " . count($events) . " kejadian (" . $totalTitik . " titik panas total).\n";
            $summary .= "- Bahaya Tinggi: {$bahayaTinggi} kejadian | Waspada: {$waspada} kejadian.\n";
            $summary .= "- Provinsi terpantau aktif: {$provStr}.\n";
            $summary .= "Catatan: Titik panas adalah anomali suhu satelit, bukan kebakaran terkonfirmasi (Pembaruan: {$updatedAt}).";

            return $summary;
        } catch (\Throwable $e) {
            return "Data karhutla NASA FIRMS tidak tersedia sementara.";
        }
    }
}

