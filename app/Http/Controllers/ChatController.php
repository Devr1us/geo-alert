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

        // 1. Validasi Input
        $messages = $request->input('messages');
        if (!is_array($messages) || empty($messages)) {
            return response()->json([
                'error' => 'Format pesan tidak valid. Harap sertakan array messages.'
            ], 422);
        }

        // Potong ke maksimal 20 pesan terakhir
        if (count($messages) > 20) {
            $messages = array_slice($messages, -20);
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
        return response()->stream(function () use ($messages, $fullSystemPrompt, $startTime, $userText, $sessionId) {
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
                    'max_tokens' => 800,
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
                // Fallback ramah jika penyedia gagal atau kuota habis
                $fallbackMessage = "Maaf, asisten GeoAlert AI sedang mengalami lonjakan antrean atau kendala jaringan.\n\nUntuk situasi darurat keselamatan segera hubungi:\n- 🚨 **112** (Layanan Darurat Nasional - Bebas Pulsa)\n- 🌊 **115** (BASARNAS)\n- 🌋 **117** (Posko BNPB)\n- 🚒 **113** (Pemadam Kebakaran)\n\nSilakan coba tanyakan kembali beberapa saat lagi.";

                echo "event: token\n";
                echo "data: " . json_encode(['token' => $fallbackMessage], JSON_UNESCAPED_UNICODE) . "\n\n";
                echo "event: done\n";
                echo "data: " . json_encode(['status' => 'fallback']) . "\n\n";
                if (ob_get_level() > 0) ob_flush();
                flush();

                Log::warning('[GeoAlert AI] Chat fallback triggered', [
                    'session_id' => $sessionId,
                    'latency_ms' => $latencyMs,
                    'status' => 'fallback',
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

