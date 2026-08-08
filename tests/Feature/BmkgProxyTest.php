<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;

class BmkgProxyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    // =========================================================
    // Gempa Terkini
    // =========================================================

    #[Test]
    public function gempa_terkini_mengembalikan_json_dari_bmkg_saat_api_aktif(): void
    {
        Http::fake([
            'data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json' => Http::response([
                'Infogempa' => [
                    'gempa' => [
                        [
                            'Tanggal'     => '08 Agt 2026',
                            'Jam'         => '10:00:00 WIB',
                            'DateTime'    => '2026-08-08T03:00:00+00:00',
                            'Coordinates' => '-7.5,107.0',
                            'Magnitude'   => '5.2',
                            'Kedalaman'   => '10 km',
                            'Wilayah'     => 'Selatan Jawa Barat',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/bmkg/gempa-terkini');

        $response->assertStatus(200)
                 ->assertJsonStructure(['Infogempa' => ['gempa']]);
    }

    #[Test]
    public function gempa_terkini_mengembalikan_503_saat_bmkg_tidak_merespons(): void
    {
        Http::fake([
            'data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json' => Http::response(null, 503),
        ]);

        $response = $this->getJson('/api/bmkg/gempa-terkini');

        $response->assertStatus(503)
                 ->assertJsonStructure(['error']);
    }

    #[Test]
    public function gempa_terkini_menggunakan_cache_pada_request_kedua(): void
    {
        Http::fake([
            'data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json' => Http::response([
                'Infogempa' => ['gempa' => []],
            ], 200),
        ]);

        // Request pertama — cache miss, Http dipanggil sekali
        $this->getJson('/api/bmkg/gempa-terkini')->assertStatus(200);
        Http::assertSentCount(1);

        // Request kedua — seharusnya dari cache, Http tidak dipanggil lagi
        $this->getJson('/api/bmkg/gempa-terkini')->assertStatus(200);
        Http::assertSentCount(1); // Masih 1 karena request ke-2 dari cache
    }

    // =========================================================
    // Gempa Dirasakan
    // =========================================================

    #[Test]
    public function gempa_dirasakan_mengembalikan_json_dari_bmkg_saat_api_aktif(): void
    {
        Http::fake([
            'data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json' => Http::response([
                'Infogempa' => ['gempa' => []],
            ], 200),
        ]);

        $this->getJson('/api/bmkg/gempa-dirasakan')
             ->assertStatus(200)
             ->assertJsonStructure(['Infogempa']);
    }

    #[Test]
    public function gempa_dirasakan_mengembalikan_503_saat_bmkg_gagal(): void
    {
        Http::fake([
            'data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json' => Http::response(null, 500),
        ]);

        $this->getJson('/api/bmkg/gempa-dirasakan')
             ->assertStatus(503)
             ->assertJsonStructure(['error']);
    }

    // =========================================================
    // Autogempa
    // =========================================================

    #[Test]
    public function autogempa_mengembalikan_json_dari_bmkg(): void
    {
        Http::fake([
            'data.bmkg.go.id/DataMKG/TEWS/autogempa.json' => Http::response([
                'Infogempa' => [
                    'gempa' => ['Magnitude' => '4.5', 'Wilayah' => 'Banda Aceh'],
                ],
            ], 200),
        ]);

        $this->getJson('/api/bmkg/autogempa')
             ->assertStatus(200)
             ->assertJsonPath('Infogempa.gempa.Magnitude', '4.5');
    }
}
