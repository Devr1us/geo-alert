<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use App\Http\Controllers\SubscriberController;

// Serve React SPA for all non-API routes
Route::get('/', function () {
    return view('welcome');
});

// =============================================
// BMKG PROXY API — Server-side fetch (no CORS)
// Rate-limited: 60 requests/minute per IP
// Cached server-side to avoid hammering BMKG
// =============================================

/**
 * Proxy untuk data gempa terkini dari BMKG
 * GET /api/bmkg/gempa-terkini
 * Cache TTL: 300 detik (5 menit)
 */
Route::middleware(['throttle:60,1'])->get('/api/bmkg/gempa-terkini', function () {
    try {
        $data = Cache::remember('bmkg:gempa-terkini', 300, function () {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'GeoAlert/1.0 (+https://geoalert.id)',
                ])
                ->get('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');

            if ($response->successful()) {
                return $response->json();
            }

            throw new \RuntimeException('BMKG API tidak merespons (status: ' . $response->status() . ')');
        });

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=300')
            ->header('X-Cache', 'HIT');
    } catch (\Exception $e) {
        Cache::forget('bmkg:gempa-terkini');
        return response()->json(['error' => 'Gagal terhubung ke BMKG: ' . $e->getMessage()], 503);
    }
});

/**
 * Proxy untuk data gempa dirasakan dari BMKG
 * GET /api/bmkg/gempa-dirasakan
 * Cache TTL: 300 detik (5 menit)
 */
Route::middleware(['throttle:60,1'])->get('/api/bmkg/gempa-dirasakan', function () {
    try {
        $data = Cache::remember('bmkg:gempa-dirasakan', 300, function () {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'GeoAlert/1.0 (+https://geoalert.id)',
                ])
                ->get('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json');

            if ($response->successful()) {
                return $response->json();
            }

            throw new \RuntimeException('BMKG API tidak merespons (status: ' . $response->status() . ')');
        });

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=300')
            ->header('X-Cache', 'HIT');
    } catch (\Exception $e) {
        Cache::forget('bmkg:gempa-dirasakan');
        return response()->json(['error' => 'Gagal terhubung ke BMKG: ' . $e->getMessage()], 503);
    }
});

/**
 * Proxy untuk info gempa terbaru (1 event) dari BMKG
 * GET /api/bmkg/autogempa
 * Cache TTL: 60 detik (1 menit)
 */
Route::middleware(['throttle:60,1'])->get('/api/bmkg/autogempa', function () {
    try {
        $data = Cache::remember('bmkg:autogempa', 60, function () {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'GeoAlert/1.0 (+https://geoalert.id)',
                ])
                ->get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');

            if ($response->successful()) {
                return $response->json();
            }

            throw new \RuntimeException('BMKG API tidak merespons (status: ' . $response->status() . ')');
        });

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=60')
            ->header('X-Cache', 'HIT');
    } catch (\Exception $e) {
        Cache::forget('bmkg:autogempa');
        return response()->json(['error' => 'Gagal terhubung ke BMKG: ' . $e->getMessage()], 503);
    }
});

/**
 * Proxy untuk peringatan cuaca ekstrem dari BMKG
 * GET /api/bmkg/cuaca-ekstrem
 * Cache TTL: 600 detik (10 menit) — data cuaca berubah lebih lambat
 *
 * CATATAN: BMKG menyediakan prakiraan cuaca per wilayah.
 * Endpoint ini mengambil peringatan dini cuaca (cap-idn).
 * Data banjir & longsor TIDAK tersedia via API publik BNPB/InaRISK
 * tanpa registrasi/autentikasi — ditampilkan sebagai contoh data.
 */
Route::middleware(['throttle:60,1'])->get('/api/bmkg/cuaca-ekstrem', function () {
    try {
        $data = Cache::remember('bmkg:cuaca-ekstrem', 600, function () {
            // BMKG Early Warning System — CAP (Common Alerting Protocol) feed
            $response = Http::timeout(15)
                ->withHeaders([
                    'User-Agent' => 'GeoAlert/1.0 (+https://geoalert.id)',
                    'Accept'     => 'application/json',
                ])
                ->get('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
            // Note: Endpoint cuaca resmi BMKG EWS memerlukan registrasi.
            // Kita gunakan data gempa untuk membuktikan pola proxy,
            // dan data cuaca ekstrem ditandai sebagai sample di frontend.
            if ($response->successful()) {
                return ['status' => 'sample', 'message' => 'Data cuaca ekstrem: API BMKG EWS memerlukan registrasi resmi. Menampilkan contoh data.'];
            }

            throw new \RuntimeException('Endpoint tidak tersedia');
        });

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=600');
    } catch (\Exception $e) {
        Cache::forget('bmkg:cuaca-ekstrem');
        return response()->json(['status' => 'sample', 'message' => 'Data cuaca ekstrem tidak tersedia via API publik.'], 200);
    }
});

// =============================================
// NEWSLETTER SUBSCRIBE
// =============================================

/**
 * Simpan subscriber newsletter
 * POST /api/subscribe
 */
Route::middleware(['throttle:10,1'])->post('/api/subscribe', [SubscriberController::class, 'store']);

// Catch-all: serve React SPA for client-side routing (e.g., /peta, /kebijakan-privasi, /syarat-ketentuan)
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '^(?!api).*$');
