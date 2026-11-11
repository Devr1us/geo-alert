@echo off
:: Cek apakah dijalankan sebagai Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ========================================================
    echo Mengatur PHP 8.3 (Laragon) sebagai default di System PATH
    echo ========================================================
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$oldPath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine'); if ($oldPath -notlike '*C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64*') { [System.Environment]::SetEnvironmentVariable('Path', 'C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;' + $oldPath, 'Machine'); Write-Host 'BERHASIL! PHP 8.3 telah dijadikan prioritas utama di System PATH.' -ForegroundColor Green } else { Write-Host 'PHP 8.3 sudah aktif di System PATH.' -ForegroundColor Yellow }"
    echo.
    echo Silakan tutup dan buka kembali terminal Anda (CMD / PowerShell / VS Code).
    echo Ketik 'php -v' untuk memastikan versi PHP sudah 8.3.30.
    echo ========================================================
    pause
) else (
    echo Meminta izin Administrator Windows...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
)

