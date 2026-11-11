<?php

namespace App\Services\Llm;

use Illuminate\Support\Facades\Log;

class LlmClient
{
    protected string $provider;
    protected string $model;
    protected ?string $baseUrl;
    protected ?string $geminiKey;
    protected ?string $groqKey;

    public function __construct()
    {
        $this->provider = strtolower(env('LLM_PROVIDER', 'gemini'));
        $this->model = env('LLM_MODEL', 'gemini-flash-lite-latest');
        $this->baseUrl = env('LLM_BASE_URL');
        $this->geminiKey = env('GEMINI_API_KEY');
        $this->groqKey = env('GROQ_API_KEY');
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
        $primary = $this->provider;

        // Coba provider utama
        $success = false;
        if ($primary === 'groq' || ($primary === 'gemini' && empty($this->geminiKey) && !empty($this->groqKey))) {
            $success = $this->streamGroq($messages, $systemPrompt, $onChunk, $options);
            if (!$success && !empty($this->geminiKey)) {
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
     */
    protected function streamGemini(array $messages, string $systemPrompt, callable $onChunk, array $options = []): bool
    {
        if (empty($this->geminiKey)) {
            Log::warning('[LlmClient] GEMINI_API_KEY kosong.');
            return false;
        }

        $model = $options['model'] ?? $this->model;
        if (!str_contains($model, 'gemini')) {
            $model = 'gemini-flash-lite-latest';
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/" . urlencode($model) . ":streamGenerateContent?alt=sse&key=" . urlencode($this->geminiKey);

        // Format contents untuk Gemini: role 'user' atau 'model'
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
            return false;
        }

        $payload = [
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemPrompt]
                ]
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => (float)($options['temperature'] ?? 0.4),
                'maxOutputTokens' => (int)($options['max_tokens'] ?? 800),
            ],
            'safetySettings' => [
                ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_ONLY_HIGH'],
                ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_ONLY_HIGH'],
                ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_ONLY_HIGH'],
                ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_ONLY_HIGH'],
            ]
        ];

        return $this->executeCurlStream($url, json_encode($payload), [
            'Content-Type: application/json',
            'Accept: text/event-stream',
        ], function ($line) use ($onChunk) {
            if (str_starts_with($line, 'data: ')) {
                $jsonStr = substr($line, 6);
                $data = json_decode($jsonStr, true);
                $token = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if ($token !== null && $token !== '') {
                    $onChunk($token);
                }
            }
        });
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
            'max_tokens' => (int)($options['max_tokens'] ?? 800),
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
        });
    }

    /**
     * Eksekusi HTTP Stream dengan cURL dan buffer pemisah baris SSE
     */
    protected function executeCurlStream(string $url, string $jsonPayload, array $headers, callable $lineHandler): bool
    {
        $ch = curl_init($url);
        $buffer = '';
        $hasOutput = false;

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $jsonPayload,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
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
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if (!$exec || $code < 200 || $code >= 300) {
            Log::error("[LlmClient] HTTP $code, error: $err");
            return false;
        }

        return $hasOutput;
    }
}

