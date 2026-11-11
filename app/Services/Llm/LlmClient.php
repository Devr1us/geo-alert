<?php

namespace App\Services\Llm;

use Illuminate\Support\Facades\Log;

class LlmClient
{
    protected string $provider;
    protected string $model;
    protected ?string $baseUrl;
    /** @var array<string> */
    protected array $geminiKeys = [];
    protected ?string $groqKey;

    /**
     * Menyimpan detail error terakhir untuk diagnosis dan fallback jujur
     */
    protected array $lastError = [
        'code' => 200,
        'type' => null,           // 'rate_limit', 'overloaded', 'safety', 'not_found', 'bad_request', 'empty', 'network'
        'message' => null,
        'model' => null,
        'finish_reason' => null,
        'block_reason' => null,
    ];

    public function __construct()
    {
        $this->provider = strtolower(env('LLM_PROVIDER', 'gemini'));
        $this->model = env('LLM_MODEL', 'gemini-3.8-flash');
        $this->baseUrl = env('LLM_BASE_URL');

        $k1 = env('GEMINI_API_KEY');
        $k2 = env('GEMINI_API_KEY_FALLBACK');
        $keys = [];
        if (!empty($k1)) $keys[] = trim($k1);
        if (!empty($k2) && $k2 !== $k1) $keys[] = trim($k2);
        $this->geminiKeys = $keys;

        $this->groqKey = env('GROQ_API_KEY');
    }

    /**
     * Dapatkan detail error terakhir
     */
    public function getLastError(): array
    {
        return $this->lastError;
    }

    /**
     * Stream chat completion ke callback function
     *
     * @param array $messages Array of ['role' => 'user'|'assistant', 'content' => string]
     * @param string $systemPrompt
     * @param callable $onChunk function(string $token): void
     * @param array $options
     * @return bool True jika sukses, False jika gagal
     */
    public function streamChat(array $messages, string $systemPrompt, callable $onChunk, array $options = []): bool
    {
        $this->lastError = [
            'code' => 200,
            'type' => null,
            'message' => null,
            'model' => null,
            'finish_reason' => null,
            'block_reason' => null,
        ];

        $primary = $this->provider;

        // Coba provider utama
        $success = false;
        if ($primary === 'groq' || ($primary === 'gemini' && empty($this->geminiKeys) && !empty($this->groqKey))) {
            $success = $this->streamGroq($messages, $systemPrompt, $onChunk, $options);
            if (!$success && !empty($this->geminiKeys)) {
                Log::warning('[LlmClient] Groq gagal, mencoba fallback ke Gemini');
                $success = $this->streamGemini($messages, $systemPrompt, $onChunk, $options);
            }
        } else {
            // Default: Gemini
            $success = $this->streamGemini($messages, $systemPrompt, $onChunk, $options);
            if (!$success && !empty($this->groqKey)) {
                Log::warning('[LlmClient] Gemini gagal, mencoba fallback ke Groq');
                $success = $this->streamGroq($messages, $systemPrompt, $onChunk, $options);
            }
        }

        return $success;
    }

    /**
     * Stream via Google Gemini REST API (streamGenerateContent SSE)
     * Dilengkapi:
     * - Multi-model fallback pool (gemini-3.8-flash -> gemini-3.5-flash -> gemini-flash-latest)
     * - Multi-key failover (Key 1 -> Key 2)
     * - Retry otomatis 3x dengan exponential backoff (1s, 2s, 4s) khusus 429 & 503
     * - Parameter systemInstruction terpisah
     * - Logging mendalam diagnosis (HTTP code, finishReason, blockReason, error payload)
     */
    protected function streamGemini(array $messages, string $systemPrompt, callable $onChunk, array $options = []): bool
    {
        if (empty($this->geminiKeys)) {
            $this->lastError = [
                'code' => 401,
                'type' => 'auth',
                'message' => 'GEMINI_API_KEY belum dikonfigurasi di file .env',
                'model' => null,
                'finish_reason' => null,
                'block_reason' => null,
            ];
            Log::warning('[LlmClient] GEMINI_API_KEY kosong.');
            return false;
        }

        // 1. Format contents untuk Gemini: role 'user' atau 'model'
        $contents = [];
        foreach ($messages as $msg) {
            $role = ($msg['role'] ?? '') === 'assistant' ? 'model' : 'user';
            $text = trim($msg['content'] ?? '');
            if ($text === '') continue;

            $contents[] = [
                'role' => $role,
                'parts' => [
                    ['text' => $text]
                ]
            ];
        }

        if (empty($contents)) {
            $this->lastError['type'] = 'empty';
            $this->lastError['message'] = 'Pesan pengguna kosong.';
            return false;
        }

        // 2. Daftar model pool (model utama + model cadangan)
        $primaryModel = $options['model'] ?? $this->model;
        if (!str_contains($primaryModel, 'gemini')) {
            $primaryModel = 'gemini-3.8-flash';
        }

        $modelPool = array_unique([
            $primaryModel,
            'gemini-3.8-flash',
            'gemini-3.5-flash',
            'gemini-flash-latest'
        ]);

        // 3. Payload standar Gemini — systemInstruction terpisah, max_tokens >= 1024, TANPA thinking_budget
        $payload = [
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemPrompt]
                ]
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => (float)($options['temperature'] ?? 0.4),
                'maxOutputTokens' => (int)max(1024, (int)($options['max_tokens'] ?? 1500)),
            ],
            'safetySettings' => [
                ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_ONLY_HIGH'],
                ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_ONLY_HIGH'],
                ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_ONLY_HIGH'],
                ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_ONLY_HIGH'],
            ]
        ];

        $jsonPayload = json_encode($payload);

        // 4. Iterasi Model Pool & Key Pool dengan Retry Exponential Backoff
        foreach ($modelPool as $currentModel) {
            foreach ($this->geminiKeys as $keyIdx => $apiKey) {
                $maxRetries = 3;
                $backoffs = [1, 2, 4]; // Detik exponential backoff untuk 429 / 503

                for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
                    $url = "https://generativelanguage.googleapis.com/v1beta/models/" . urlencode($currentModel) . ":streamGenerateContent?alt=sse&key=" . urlencode($apiKey);

                    $hasTokens = false;
                    $finishReason = null;
                    $blockReason = null;
                    $rawErrorBody = '';

                    $execSuccess = $this->executeCurlStream(
                        $url,
                        $jsonPayload,
                        [
                            'Content-Type: application/json',
                            'Accept: text/event-stream',
                        ],
                        function (string $line) use ($onChunk, &$hasTokens, &$finishReason, &$blockReason, &$rawErrorBody) {
                            $trimmed = trim($line);
                            if (str_starts_with($trimmed, 'data: ')) {
                                $jsonStr = substr($trimmed, 6);
                                $data = json_decode($jsonStr, true);
                                if (!is_array($data)) return;

                                // Deteksi teks token
                                $candidate = $data['candidates'][0] ?? null;
                                $token = $candidate['content']['parts'][0]['text'] ?? null;
                                if ($token !== null && $token !== '') {
                                    $hasTokens = true;
                                    $onChunk($token);
                                }

                                // Deteksi finishReason (misal: SAFETY, MAX_TOKENS, STOP)
                                if (isset($candidate['finishReason'])) {
                                    $finishReason = $candidate['finishReason'];
                                }

                                // Deteksi blockReason (misal: SAFETY pada promptFeedback)
                                if (isset($data['promptFeedback']['blockReason'])) {
                                    $blockReason = $data['promptFeedback']['blockReason'];
                                }
                            } else if (str_starts_with($trimmed, '{')) {
                                // Error body bukan SSE (misal JSON error langsung dari Google API)
                                $rawErrorBody .= $trimmed;
                            }
                        },
                        $httpCode,
                        $curlErr
                    );

                    // A. Sukses menerima token
                    if ($execSuccess && $hasTokens && $httpCode >= 200 && $httpCode < 300) {
                        Log::info("[LlmClient] Gemini stream sukses menggunakan model {$currentModel} (Key #{$keyIdx})");
                        return true;
                    }

                    // B. Diagnosis Error Terstruktur
                    $parsedError = !empty($rawErrorBody) ? json_decode($rawErrorBody, true) : null;
                    $geminiErrMsg = $parsedError['error']['message'] ?? $curlErr ?: 'Tidak ada detail pesan error';
                    $geminiErrStatus = $parsedError['error']['status'] ?? 'UNKNOWN';

                    // Klasifikasi tipe error
                    $errorType = match ($httpCode) {
                        429 => 'rate_limit',
                        503 => 'overloaded',
                        404 => 'not_found',
                        400 => 'bad_request',
                        default => ($blockReason || $finishReason === 'SAFETY') ? 'safety' : 'unknown'
                    };

                    $this->lastError = [
                        'code' => $httpCode,
                        'type' => $errorType,
                        'message' => $geminiErrMsg,
                        'model' => $currentModel,
                        'finish_reason' => $finishReason,
                        'block_reason' => $blockReason,
                    ];

                    // Log diagnosa lengkap (STATUS CODE, PESAN ERROR ASLI, MODEL, FINISH_REASON, BLOCK_REASON)
                    Log::warning("[LlmClient] Gemini Stream Gagal: [HTTP {$httpCode}] [Model: {$currentModel}] [Key #{$keyIdx}] [Status: {$geminiErrStatus}]", [
                        'http_code' => $httpCode,
                        'model' => $currentModel,
                        'key_index' => $keyIdx,
                        'error_type' => $errorType,
                        'error_message' => $geminiErrMsg,
                        'finish_reason' => $finishReason,
                        'block_reason' => $blockReason,
                        'raw_response' => substr($rawErrorBody, 0, 500)
                    ]);

                    // C. Penanganan Error Spesifik:
                    // 1) Safety Block: jangan retry, konten memang diblokir kebijakan Google
                    if ($errorType === 'safety') {
                        $this->lastError['type'] = 'safety';
                        $this->lastError['message'] = 'Respons terblokir oleh filter keamanan (Safety Filter).';
                        return false;
                    }

                    // 2) 404 / 400: Model salah atau parameter tidak didukung -> ganti model berikutnya di pool
                    if ($httpCode === 404 || $httpCode === 400) {
                        Log::info("[LlmClient] Model {$currentModel} mengembalikan {$httpCode}, beralih ke model cadangan...");
                        break; // Keluar dari retry loop, coba model berikutnya
                    }

                    // 3) 429 (Rate Limit) atau 503 (Overloaded): Lakukan exponential backoff
                    if (($httpCode === 429 || $httpCode === 503) && $attempt < $maxRetries) {
                        $waitSec = $backoffs[$attempt - 1] ?? 1;
                        Log::info("[LlmClient] Mengalami {$httpCode} pada model {$currentModel}. Retry ke-{$attempt}/{$maxRetries} setelah {$waitSec}s...");
                        sleep($waitSec);
                        continue;
                    }

                    // Jika retry sudah habis untuk key ini, coba key berikutnya
                    break;
                }
            }
        }

        return false;
    }

    /**
     * Stream via Groq API (OpenAI-compatible)
     */
    protected function streamGroq(array $messages, string $systemPrompt, callable $onChunk, array $options = []): bool
    {
        if (empty($this->groqKey)) {
            return false;
        }

        $url = "https://api.groq.com/openai/v1/chat/completions";
        $model = $options['groq_model'] ?? 'llama-3.3-70b-versatile';

        $groqMessages = [
            ['role' => 'system', 'content' => $systemPrompt]
        ];
        foreach ($messages as $msg) {
            $role = ($msg['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
            $groqMessages[] = [
                'role' => $role,
                'content' => $msg['content'] ?? ''
            ];
        }

        $payload = [
            'model' => $model,
            'messages' => $groqMessages,
            'stream' => true,
            'temperature' => (float)($options['temperature'] ?? 0.4),
            'max_tokens' => (int)max(1024, (int)($options['max_tokens'] ?? 1500)),
        ];

        return $this->executeCurlStream($url, json_encode($payload), [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->groqKey,
            'Accept: text/event-stream',
        ], function ($line) use ($onChunk) {
            if (str_starts_with($line, 'data: ')) {
                $jsonStr = trim(substr($line, 6));
                if ($jsonStr === '[DONE]') return;
                $data = json_decode($jsonStr, true);
                $token = $data['choices'][0]['delta']['content'] ?? null;
                if ($token !== null && $token !== '') {
                    $onChunk($token);
                }
            }
        }, $httpCode, $curlErr);
    }

    /**
     * Eksekusi HTTP Stream dengan cURL, buffer pemisah baris SSE, dan pelacak status code
     */
    protected function executeCurlStream(
        string $url,
        string $jsonPayload,
        array $headers,
        callable $lineHandler,
        &$httpCode = 0,
        &$curlErr = ''
    ): bool {
        $ch = curl_init($url);
        $buffer = '';
        $hasOutput = false;

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $jsonPayload,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_WRITEFUNCTION => function ($ch, $chunk) use (&$buffer, &$hasOutput, $lineHandler) {
                $buffer .= $chunk;
                while (($pos = strpos($buffer, "\n")) !== false) {
                    $line = rtrim(substr($buffer, 0, $pos), "\r");
                    $buffer = substr($buffer, $pos + 1);
                    if ($line !== '') {
                        $lineHandler($line);
                        $hasOutput = true;
                    }
                }
                return strlen($chunk);
            }
        ]);

        $exec = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        // Jika masih ada sisa buffer di akhir chunk yang tidak diakhiri newline
        if ($buffer !== '') {
            $lineHandler(rtrim($buffer, "\r"));
        }

        if (!$exec || $httpCode < 200 || $httpCode >= 300) {
            return false;
        }

        return $hasOutput;
    }
}
