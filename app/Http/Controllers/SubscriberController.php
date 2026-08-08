<?php

namespace App\Http\Controllers;

use App\Models\Subscriber;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SubscriberController extends Controller
{
    /**
     * Simpan email subscriber baru.
     * POST /api/subscribe
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => ['required', 'email:rfc', 'max:255'],
            ], [
                'email.required' => 'Alamat email wajib diisi.',
                'email.email'    => 'Format alamat email tidak valid.',
                'email.max'      => 'Alamat email terlalu panjang (maks. 255 karakter).',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->validator->errors()->first('email'),
            ], 422);
        }

        // Cek duplikat
        if (Subscriber::where('email', $validated['email'])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Email ini sudah terdaftar sebagai subscriber.',
            ], 422);
        }

        Subscriber::create(['email' => $validated['email']]);

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih! Email Anda berhasil didaftarkan.',
        ], 201);
    }
}
