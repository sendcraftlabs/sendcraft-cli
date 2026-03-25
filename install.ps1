# SendCraft CLI — one-line installer for Windows (PowerShell)
# Usage: iwr https://sendcraft.online/install.ps1 | iex

$ErrorActionPreference = "Stop"

$REPO         = "sendcraft/sendcraft-cli"
$BINARY_NAME  = "sendcraft.exe"
$INSTALL_DIR  = "$env:LOCALAPPDATA\sendcraft\bin"

Write-Host ""
Write-Host "  SendCraft CLI Installer" -ForegroundColor Cyan
Write-Host ""

# Fetch latest tag
Write-Host "  → Fetching latest release..." -ForegroundColor Gray
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest" -UseBasicParsing
$tag = $release.tag_name

if (-not $tag) {
    Write-Host "  ✗ Could not fetch latest release. Install via npm instead:" -ForegroundColor Red
    Write-Host "    npm install -g sendcraft-cli"
    exit 1
}

$downloadUrl = "https://github.com/$REPO/releases/download/$tag/sendcraft-win-x64.exe"
$tmpPath     = Join-Path $env:TEMP "sendcraft-installer.exe"

Write-Host "  → Downloading sendcraft $tag (windows-x64)..." -ForegroundColor Gray
Invoke-WebRequest -Uri $downloadUrl -OutFile $tmpPath -UseBasicParsing

# Create install dir
if (-not (Test-Path $INSTALL_DIR)) {
    New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
}

$destPath = Join-Path $INSTALL_DIR $BINARY_NAME
Copy-Item -Path $tmpPath -Destination $destPath -Force
Remove-Item $tmpPath -Force

# Add to PATH (current user)
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$INSTALL_DIR*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$INSTALL_DIR", "User")
    Write-Host "  → Added $INSTALL_DIR to your PATH" -ForegroundColor Gray
    Write-Host "    (Restart your terminal to use 'sendcraft')" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  ✓ sendcraft $tag installed to $destPath" -ForegroundColor Green
Write-Host ""
Write-Host "    Run: sendcraft login"
Write-Host ""
