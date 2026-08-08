<?php

namespace Tests\Feature;

use App\Models\Subscriber;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class SubscriberTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================
    // POST /api/subscribe — email valid
    // =========================================================

    #[Test]
    public function subscriber_baru_berhasil_disimpan_dengan_email_valid(): void
    {
        $response = $this->postJson('/api/subscribe', [
            'email' => 'test@geoalert.id',
        ]);

        $response->assertStatus(201)
                 ->assertJson(['success' => true])
                 ->assertJsonStructure(['success', 'message']);

        $this->assertDatabaseHas('subscribers', ['email' => 'test@geoalert.id']);
    }

    // =========================================================
    // POST /api/subscribe — email duplikat
    // =========================================================

    #[Test]
    public function email_duplikat_dikembalikan_dengan_status_422(): void
    {
        Subscriber::create(['email' => 'duplikat@geoalert.id']);

        $response = $this->postJson('/api/subscribe', [
            'email' => 'duplikat@geoalert.id',
        ]);

        $response->assertStatus(422)->assertJson(['success' => false]);

        $this->assertEquals(1, Subscriber::where('email', 'duplikat@geoalert.id')->count());
    }

    // =========================================================
    // POST /api/subscribe — format email salah
    // =========================================================

    #[Test]
    public function email_format_salah_dikembalikan_dengan_status_422(): void
    {
        $response = $this->postJson('/api/subscribe', [
            'email' => 'ini-bukan-email',
        ]);

        $response->assertStatus(422)->assertJson(['success' => false]);

        $this->assertDatabaseMissing('subscribers', ['email' => 'ini-bukan-email']);
    }

    // =========================================================
    // POST /api/subscribe — email kosong
    // =========================================================

    #[Test]
    public function email_kosong_dikembalikan_dengan_status_422(): void
    {
        $this->postJson('/api/subscribe', ['email' => ''])
             ->assertStatus(422)
             ->assertJson(['success' => false]);
    }

    // =========================================================
    // POST /api/subscribe — tanpa field email
    // =========================================================

    #[Test]
    public function request_tanpa_field_email_dikembalikan_dengan_status_422(): void
    {
        $this->postJson('/api/subscribe', [])
             ->assertStatus(422)
             ->assertJson(['success' => false]);
    }

    // =========================================================
    // POST /api/subscribe — berbagai format email valid
    // =========================================================

    #[Test]
    public function berbagai_format_email_valid_diterima(): void
    {
        $validEmails = [
            'user@example.com',
            'user.name@subdomain.example.co.id',
            'user+tag@example.org',
        ];

        foreach ($validEmails as $email) {
            $this->postJson('/api/subscribe', ['email' => $email])
                 ->assertStatus(201, "Email '{$email}' seharusnya valid");
        }

        $this->assertEquals(3, Subscriber::count());
    }
}
