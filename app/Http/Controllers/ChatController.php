<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Llm\LlmClient;
use App\Services\ChatContextService;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    protected LlmClient $llmClient;
    protected ChatContextService $contextService;

    public function __construct(LlmClient $llmClient, ChatContextService $contextService)
    {
        $this->llmClient = $llmClient;
        $this->contextService = $contextService;
    }

    /**
     * Endpoint streaming chat asisten AI
     * POST /api/chat
     */
    public function chat(Request $request)
    {
        $startTime = microtime(true);

        // 1. Validasi Input & Pembersihan Riwayat Percakapan
        $rawMessages = $request->input('messages');
        if (!is_array($rawMessages) || empty($rawMessages)) {
            return response()->json([
                'error' => 'Format pesan tidak valid. Harap sertakan array messages.'
            ], 422);
        }

        // Saring riwayat: buang pesan error, fallback, atau kosong agar tidak mencemari konteks LLM
        $messages = array_values(array_filter($rawMessages, function ($m) {
            if (!is_array($m)) return false;
            if (!empty($m['isError']) || !empty($m['is_error'])) return false;
            $text = trim($m['content'] ?? '');
            if ($text === '') return false;
            // Buang pesan fallback yang mungkin tersimpan di state client
            if (str_contains($text, 'kendala koneksi') || str_contains($text, 'lonjakan antrean') || str_contains($text, 'Batas Kuota') || str_contains($text, 'Server Sibuk')) {
                return false;
            }
            return true;
        }));

        // Batasi riwayat percakapan ke maksimal 8 pesan terakhir
        if (count($messages) > 8) {
            $messages = array_slice($messages, -8);
        }

        // Validasi pesan terakhir user
        $lastMessage = end($messages);
        $userText = trim($lastMessage['content'] ?? '');
        if ($userText === '') {
            return response()->json([
                'error' => 'Pesan pengguna tidak boleh kosong.'
            ], 422);
        }

        if (mb_strlen($userText) > 2000) {
            return response()->json([
                'error' => 'Pesan melebihi batas maksimal 2.000 karakter.'
            ], 422);
        }

        $sessionId = $request->input('session_id', 'anon');
        $lokasiKota = $request->input('lokasi_kota');

        // 2. Baca System Prompt dari file prompts/system_prompt.md
        $promptPath = base_path('prompts/system_prompt.md');
        $baseSystemPrompt = file_exists($promptPath)
            ? file_get_contents($promptPath)
            : 'Kamu adalah GeoAlert AI, asisten panduan mitigasi bencana alam Indonesia.';

        // 3. Sisipkan blok <DATA_TERKINI>
        $dataTerkini = $this->contextService->buildCurrentDataContext($lokasiKota);
        $fullSystemPrompt = $baseSystemPrompt . "\n\n" . $dataTerkini;

        // 4. Return SSE Streaming Response
        $requestedModel = $request->input('model', 'gemini-3.5-flash');
        return response()->stream(function () use ($messages, $fullSystemPrompt, $startTime, $userText, $sessionId, $requestedModel) {
            // Nonaktifkan output buffering
            if (function_exists('apache_setenv')) {
                @apache_setenv('no-gzip', '1');
            }
            @ini_set('zlib.output_compression', '0');
            @ini_set('implicit_flush', '1');
            while (ob_get_level() > 0) {
                ob_end_flush();
            }

            $hasSentToken = false;

            $success = $this->llmClient->streamChat(
                $messages,
                $fullSystemPrompt,
                function (string $token) use (&$hasSentToken) {
                    $hasSentToken = true;
                    echo "event: token\n";
                    echo "data: " . json_encode(['token' => $token], JSON_UNESCAPED_UNICODE) . "\n\n";
                    if (ob_get_level() > 0) ob_flush();
                    flush();
                },
                [
                    'temperature' => 0.4,
                    'max_tokens' => 1500, // Minimal 1024 token
                    'model' => $requestedModel,
                ]
            );

            $latencyMs = round((microtime(true) - $startTime) * 1000, 2);

            if ($success && $hasSentToken) {
                echo "event: done\n";
                echo "data: " . json_encode(['status' => 'success']) . "\n\n";
                if (ob_get_level() > 0) ob_flush();
                flush();

                // Log aman (tanpa mencatat isi percakapan atau API key)
                Log::info('[GeoAlert AI] Chat completed', [
                    'session_id' => $sessionId,
                    'msg_length' => mb_strlen($userText),
                    'msg_count' => count($messages),
                    'latency_ms' => $latencyMs,
                    'status' => 'success',
                ]);
            } else {
                // Diagnosis detail error dari LlmClient
                $lastError = $this->llmClient->getLastError();
                $errType = $lastError['type'] ?? 'unknown';
                $errCode = $lastError['code'] ?? 500;
                $errModel = $lastError['model'] ?? $requestedModel;

                // Bangun pesan fallback jujur dan informatif sesuai akar masalah
                $reasonHeadline = match ($errType) {
                    'rate_limit' => "Kuota penyedia AI saat ini sedang mencapai batas sesaat (Rate Limit 429). Mohon tunggu beberapa detik lalu tekan tombol **Coba lagi**.",
                    'overloaded' => "Server penyedia AI sedang mengalami lonjakan beban tinggi (Server Overload 503). Silakan coba kirim ulang pertanyaan Anda sebentar lagi.",
                    'safety'     => "Pertanyaan atau respon terdeteksi oleh penyaring keamanan konten (Safety Filter). Silakan coba formulasikan pertanyaan Anda dengan kalimat berbeda.",
                    'not_found'  => "Model AI sedang dalam pembaruan berkala. Silakan coba beberapa saat lagi.",
                    default      => "Koneksi ke asisten GeoAlert AI mengalami kendala atau batas waktu (Timeout). Silakan periksa jaringan Anda lalu coba lagi."
                };

                $fallbackMessage = "⚠️ **{$reasonHeadline}**\n\nUntuk situasi darurat keselamatan segera hubungi:\n- 🚨 **112** (Layanan Darurat Nasional - Bebas Pulsa)\n- 🌊 **115** (BASARNAS)\n- 🌋 **117** (Posko BNPB)\n- 🚒 **113** (Pemadam Kebakaran)";

                echo "event: token\n";
                echo "data: " . json_encode(['token' => $fallbackMessage], JSON_UNESCAPED_UNICODE) . "\n\n";
                echo "event: done\n";
                echo "data: " . json_encode([
                    'status' => 'fallback',
                    'error_type' => $errType,
                    'http_code' => $errCode,
                    'model' => $errModel,
                ]) . "\n\n";
                if (ob_get_level() > 0) ob_flush();
                flush();

                Log::warning('[GeoAlert AI] Chat fallback triggered', [
                    'session_id' => $sessionId,
                    'latency_ms' => $latencyMs,
                    'error_type' => $errType,
                    'http_code' => $errCode,
                    'model' => $errModel,
                    'error_message' => $lastError['message'] ?? null,
                ]);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream; charset=utf-8',
            'Cache-Control' => 'no-cache, no-transform',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}

