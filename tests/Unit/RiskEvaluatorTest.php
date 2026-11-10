<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Support\RiskEvaluator;
use PHPUnit\Framework\Attributes\Test;

class RiskEvaluatorTest extends TestCase
{
    #[Test]
    public function evaluasi_bahaya_tinggi_saat_tsunami(): void
    {
        $res = RiskEvaluator::evaluate([
            'magnitude' => '5.4',
            'depth'     => '10 km',
            'potensi'   => 'Berpotensi TSUNAMI untuk wilayah pesisir',
        ]);

        $this->assertSame(RiskEvaluator::LEVEL_DANGER, $res['level']);
        $this->assertSame('Bahaya Tinggi', $res['label']);
    }

    #[Test]
    public function evaluasi_bahaya_tinggi_saat_magnitudo_major(): void
    {
        $res = RiskEvaluator::evaluate([
            'magnitude' => '7.2',
            'depth'     => '80 km',
            'potensi'   => 'Tidak berpotensi tsunami',
        ]);

        $this->assertSame(RiskEvaluator::LEVEL_DANGER, $res['level']);
        $this->assertSame('Bahaya Tinggi', $res['label']);
    }

    #[Test]
    public function evaluasi_bahaya_tinggi_saat_gempa_kuat_dangkal(): void
    {
        $res = RiskEvaluator::evaluate([
            'magnitude' => '6.2',
            'depth'     => '15 km',
            'potensi'   => 'Tidak berpotensi tsunami',
        ]);

        $this->assertSame(RiskEvaluator::LEVEL_DANGER, $res['level']);
        $this->assertSame('Bahaya Tinggi', $res['label']);
    }

    #[Test]
    public function evaluasi_waspada_saat_gempa_sedang_dangkal(): void
    {
        $res = RiskEvaluator::evaluate([
            'magnitude' => '5.3',
            'depth'     => '10 km',
            'potensi'   => 'Tidak berpotensi tsunami',
        ]);

        $this->assertSame(RiskEvaluator::LEVEL_WARNING, $res['level']);
        $this->assertSame('Waspada', $res['label']);
    }

    #[Test]
    public function evaluasi_siaga_saat_gempa_dalam(): void
    {
        $res = RiskEvaluator::evaluate([
            'magnitude' => '5.8',
            'depth'     => '450 km',
            'potensi'   => 'Tidak berpotensi tsunami',
        ]);

        $this->assertSame(RiskEvaluator::LEVEL_STANDBY, $res['level']);
        $this->assertSame('Siaga', $res['label']);
    }
}

