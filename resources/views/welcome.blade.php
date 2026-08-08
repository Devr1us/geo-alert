<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <!-- Primary Meta -->
        <title>GeoAlert — Deteksi Dini Bencana Alam Indonesia Real-time</title>
        <meta name="description" content="GeoAlert memantau bencana alam Indonesia secara real-time: gempa bumi, banjir, longsor, dan cuaca ekstrem. Data langsung dari BMKG & BNPB. Dapatkan peringatan dini dan panduan mitigasi instan.">
        <meta name="keywords" content="bencana alam indonesia, gempa bumi hari ini, peringatan dini bencana, BMKG gempa, banjir, longsor, cuaca ekstrem, GeoAlert, peta bencana">
        <meta name="author" content="GeoAlert Indonesia">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="{{ config('app.url') }}">

        <!-- Open Graph / Social Media -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ config('app.url') }}">
        <meta property="og:title" content="GeoAlert — Deteksi Dini Bencana Alam Indonesia">
        <meta property="og:description" content="Pantau bencana alam Indonesia secara real-time. Data gempa, banjir, longsor & cuaca ekstrem langsung dari BMKG & BNPB. Peringatan dini instan untuk keselamatan Anda.">
        <meta property="og:image" content="{{ config('app.url') }}/og-image.png">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="GeoAlert — Peta Bencana Indonesia Real-time">
        <meta property="og:locale" content="id_ID">
        <meta property="og:site_name" content="GeoAlert Indonesia">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="GeoAlert — Deteksi Dini Bencana Alam Indonesia">
        <meta name="twitter:description" content="Pantau bencana alam Indonesia real-time. Data BMKG & BNPB. Peringatan dini instan.">
        <meta name="twitter:image" content="{{ config('app.url') }}/og-image.png">

        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="icon" type="image/png" href="/favicon.png" sizes="32x32">
        <link rel="apple-touch-icon" href="/favicon.svg">
        <meta name="theme-color" content="#0E2A5C">

        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.webmanifest">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">

        @viteReactRefresh
        @vite(['resources/js/main.jsx'])
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
