<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

// Serve React SPA for all non-API routes
Route::get('/', function () {
    return view('welcome');
});

// =============================================
// BMKG PROXY API — Server-side fetch (no CORS)
// =============================================

/**
 * Proxy untuk data gempa terkini dari BMKG
 * GET /api/bmkg/gempa-terkini
 */
Route::get('/api/bmkg/gempa-terkini', function () {
    try {
        $response = Http::timeout(10)
            ->withHeaders([
                'User-Agent' => 'GeoAlert/1.0 (+https://geoalert.id)',
            ])
            ->get('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');

        if ($response->successful()) {
            return response()->json($response->json())
                ->header('Cache-Control', 'no-cache, max-age=300')
                ->header('Access-Control-Allow-Origin', '*');
        }

        return response()->json(['error' => 'BMKG API tidak merespons'], 503);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Gagal terhubung ke BMKG: ' . $e->getMessage()], 503);
    }
});

/**
 * Proxy untuk data gempa dirasakan dari BMKG
 * GET /api/bmkg/gempa-dirasakan
 */
Route::get('/api/bmkg/gempa-dirasakan', function () {
    try {
        $response = Http::timeout(10)
            ->withHeaders([
                'User-Agent' => 'GeoAlert/1.0 (+https://geoalert.id)',
            ])
            ->get('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json');

        if ($response->successful()) {
            return response()->json($response->json())
                ->header('Cache-Control', 'no-cache, max-age=300')
                ->header('Access-Control-Allow-Origin', '*');
        }

        return response()->json(['error' => 'BMKG API tidak merespons'], 503);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Gagal terhubung ke BMKG: ' . $e->getMessage()], 503);
    }
});

/**
 * Proxy untuk info gempa terbaru (1 event) dari BMKG
 * GET /api/bmkg/autogempa
 */
Route::get('/api/bmkg/autogempa', function () {
    try {
        $response = Http::timeout(10)
            ->withHeaders([
                'User-Agent' => 'GeoAlert/1.0 (+https://geoalert.id)',
            ])
            ->get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');

        if ($response->successful()) {
            return response()->json($response->json())
                ->header('Cache-Control', 'no-cache, max-age=60')
                ->header('Access-Control-Allow-Origin', '*');
        }

        return response()->json(['error' => 'BMKG API tidak merespons'], 503);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Gagal terhubung ke BMKG: ' . $e->getMessage()], 503);
    }
});

// Catch-all: serve React SPA for client-side routing (e.g., /peta)
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '^(?!api).*$');
