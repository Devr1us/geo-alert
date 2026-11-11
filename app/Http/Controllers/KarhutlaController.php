<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\KarhutlaService;

class KarhutlaController extends Controller
{
    protected KarhutlaService $service;

    public function __construct(KarhutlaService $service)
    {
        $this->service = $service;
    }

    /**
     * Endpoint API Karhutla NASA FIRMS
     * GET /api/karhutla
     */
    public function index(Request $request): JsonResponse
    {
        $refresh = $request->boolean('refresh', false);
        $data = $this->service->getKarhutlaData($refresh);

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=300');
    }
}

