import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/main.jsx'],
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            // Manifest sudah ada di public/manifest.webmanifest, inject link ke head
            manifest: false,
            workbox: {
                // Cache strategies:
                // 1. Cache-first untuk aset statis Vite (JS, CSS, fonts)
                // 2. Stale-while-revalidate untuk panduan mitigasi & halaman SPA
                globPatterns: ['**/*.{js,css,woff2}'],
                runtimeCaching: [
                    // Panduan mitigasi: SPA routes (offline support — poin 11)
                    {
                        urlPattern: ({ url }) =>
                            ['/', '/peta', '/kebijakan-privasi', '/syarat-ketentuan'].some(
                                path => url.pathname === path
                            ),
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'geoalert-pages',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 24 * 60 * 60, // 24 jam
                            },
                        },
                    },
                    // Google Fonts
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-stylesheets',
                            expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-webfonts',
                            expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
                        },
                    },
                    // Leaflet tile layer (untuk offline basic map — opsional)
                    {
                        urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'osm-tiles',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 hari
                            },
                        },
                    },
                ],
            },
        }),
    ],
});
