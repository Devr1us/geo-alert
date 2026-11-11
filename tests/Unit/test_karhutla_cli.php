<?php

require __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\KarhutlaService;

echo "--- RUNNING KARHUTLA SERVICE UNIT TEST ---\n";
$service = new KarhutlaService();

// 1. Test CSV Parsing & Filtering
$sampleCsv = "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n" .
    "-8.98723,140.87805,343.02,0.49,0.41,2026-11-10,427,N20,VIIRS,n,2.0NRT,304.63,5.18,D\n" .
    "-8.98423,140.87294,337.92,0.49,0.41,2026-11-10,427,N20,VIIRS,l,2.0NRT,303.91,0.5,D\n"; // low conf & <1 frp

$parsed = $service->parseCsv($sampleCsv, 'N20');
assert(count($parsed) === 2, "Harus menghasilkan 2 data mentah");
$filtered = $service->filterPoints($parsed);
assert(count($filtered) === 1, "Harus menyaring confidence low & frp < 1");
assert($filtered[0]['confidence'] === 'n', "Titik yang lolos harus bertingkat nominal");
echo "✔ Test 1: CSV Parsing & Filtering PASSED\n";

// 2. Test UTC to WIB conversion
$wib = $service->utcToWib('2026-11-10', '0427');
assert(str_contains($wib, '11:27:00 WIB'), "Waktu 04:27 UTC harus dikonversi ke 11:27:00 WIB");
echo "✔ Test 2: UTC to WIB Conversion PASSED\n";

// 3. Test Clustering & Status Level
$points = [
    [
        'lat' => -8.98723,
        'lon' => 140.87805,
        'acq_date' => '2026-11-10',
        'acq_time' => '0427',
        'time_wib' => '10 Nov 2026 11:27:00 WIB',
        'confidence' => 'h',
        'frp' => 35.0, // High conf + FRP >= 30 => Bahaya Tinggi
        'satellite' => 'N20',
        'daynight' => 'D',
        'bright_ti4' => 343.0,
    ],
    [
        'lat' => -8.98800,
        'lon' => 140.87900,
        'acq_date' => '2026-11-10',
        'acq_time' => '0427',
        'time_wib' => '10 Nov 2026 11:27:00 WIB',
        'confidence' => 'n',
        'frp' => 12.0,
        'satellite' => 'N20',
        'daynight' => 'D',
        'bright_ti4' => 330.0,
    ],
];
$events = $service->clusterPoints($points);
assert(count($events) === 1, "Harus mengelompokkan 2 titik berdekatan menjadi 1 cluster");
assert($events[0]['status'] === 'Bahaya Tinggi', "Status harus Bahaya Tinggi");
assert($events[0]['risk'] === 'danger', "Risk level harus danger");
assert($events[0]['wilayah']['provinsi'] === 'Papua', "Provinsi harus terdeteksi Papua");
echo "✔ Test 3: Clustering & Status Level PASSED\n";

echo "ALL PHP UNIT TESTS PASSED SUCCESSFULLY!\n";

