<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\KarhutlaService;

class KarhutlaServiceTest extends TestCase
{
    public function test_parse_csv()
    {
        $service = new KarhutlaService();
        $sampleCsv = "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n" .
            "-8.98723,140.87805,343.02,0.49,0.41,2026-11-10,427,N20,VIIRS,n,2.0NRT,304.63,5.18,D\n" .
            "-8.98423,140.87294,337.92,0.49,0.41,2026-11-10,427,N20,VIIRS,l,2.0NRT,303.91,0.5,D\n"; // low confidence & <1 frp

        $parsed = $service->parseCsv($sampleCsv, 'N20');
        $this->assertCount(2, $parsed);
        $this->assertEquals(-8.98723, $parsed[0]['lat']);
        $this->assertEquals(5.18, $parsed[0]['frp']);

        $filtered = $service->filterPoints($parsed);
        $this->assertCount(1, $filtered);
        $this->assertEquals('n', $filtered[0]['confidence']);
    }

    public function test_utc_to_wib_conversion()
    {
        $service = new KarhutlaService();
        // 04:27 UTC = 11:27 WIB
        $wib = $service->utcToWib('2026-11-10', '0427');
        $this->assertStringContainsString('11:27:00 WIB', $wib);
        $this->assertStringContainsString('10 Nov 2026', $wib);
    }

    public function test_clustering_and_status()
    {
        $service = new KarhutlaService();
        $points = [
            [
                'lat' => -8.98723,
                'lon' => 140.87805,
                'acq_date' => '2026-11-10',
                'acq_time' => '0427',
                'time_wib' => '10 Nov 2026 11:27:00 WIB',
                'confidence' => 'h',
                'frp' => 35.0, // High + FRP >= 30 => Bahaya Tinggi
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
        $this->assertCount(1, $events);
        $this->assertEquals('Bahaya Tinggi', $events[0]['status']);
        $this->assertEquals('danger', $events[0]['risk']);
        $this->assertEquals(2, $events[0]['jumlah_titik']);
        $this->assertEquals(47.0, $events[0]['frp_total']);
        $this->assertEquals('Papua', $events[0]['wilayah']['provinsi']);
    }
}

