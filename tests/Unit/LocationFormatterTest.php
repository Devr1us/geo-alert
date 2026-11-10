<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Support\LocationFormatter;
use PHPUnit\Framework\Attributes\Test;

class LocationFormatterTest extends TestCase
{
    #[Test]
    public function format_minimal_10_contoh_nyata_bmkg(): void
    {
        $cases = [
            '69 km BaratLaut KEBARMANOKWARI-PAPUABRT' => '69 km Barat Laut Kebarmanokwari, Papua Barat',
            '128 km BaratDaya KAWASAN-SUMUT' => '128 km Barat Daya Kawasan, Sumatera Utara',
            'Pusat gempa berada di darat 14 km BaratDaya KAB-BOGOR' => 'Pusat gempa berada di darat 14 km Barat Daya Kab. Bogor',
            '25 km Tenggara CIANJUR-JABAR' => '25 km Tenggara Cianjur, Jawa Barat',
            '10 km TimurLaut JAYAPURA-PAPUA' => '10 km Timur Laut Jayapura, Papua',
            '45 km BaratDaya BANTUL-DIY' => '45 km Barat Daya Bantul, D.I. Yogyakarta',
            '82 km BaratDaya KAB-SUKABUMI' => '82 km Barat Daya Kab. Sukabumi',
            'Pusat gempa berada di laut 55 km BaratDaya KONAWE-SULTRA' => 'Pusat gempa berada di laut 55 km Barat Daya Konawe, Sulawesi Tenggara',
            '17 km BaratLaut KOTA-BIMA-NTB' => '17 km Barat Laut Kota Bima, Nusa Tenggara Barat',
            '102 km TimurLaut KEP-TALAUD-SULUT' => '102 km Timur Laut Kep. Talaud, Sulawesi Utara',
            '29 km BaratLaut LUWU-TIMUR-SULSEL' => '29 km Barat Laut Luwu Timur, Sulawesi Selatan',
            '65 km BaratDaya BENGKULU-BENGKULU' => '65 km Barat Daya Bengkulu, Bengkulu',
        ];

        foreach ($cases as $input => $expected) {
            $this->assertSame($expected, LocationFormatter::format($input));
        }
    }

    #[Test]
    public function format_input_kosong_atau_invalid(): void
    {
        $this->assertSame('-', LocationFormatter::format(null));
        $this->assertSame('-', LocationFormatter::format(''));
        $this->assertSame('-', LocationFormatter::format('   '));
    }
}

