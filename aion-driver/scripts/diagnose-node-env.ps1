#Requires -Version 5.1
<#
.SYNOPSIS
  Диагностика Node/npm/TLS для AION Driver (запускайте в обычном PowerShell вне IDE, если в IDE ломается TLS).

.EXAMPLE
  pwsh -File .\scripts\diagnose-node-env.ps1
#>

$ErrorActionPreference = "Continue"

function Show-Var($name) {
  $p = [Environment]::GetEnvironmentVariable($name, "Process")
  $u = [Environment]::GetEnvironmentVariable($name, "User")
  $m = [Environment]::GetEnvironmentVariable($name, "Machine")
  Write-Host "`n=== $name ===" -ForegroundColor Cyan
  Write-Host "  Process : $(if ($null -eq $p -or $p -eq '') { '(empty)' } else { $p })"
  Write-Host "  User    : $(if ($null -eq $u -or $u -eq '') { '(empty)' } else { $u })"
  Write-Host "  Machine : $(if ($null -eq $m -or $m -eq '') { '(empty)' } else { $m })"
}

Write-Host "`n========== AION Driver - Node / npm / TLS ==========" -ForegroundColor Green
Write-Host "PowerShell: $($PSVersionTable.PSVersion)"
Write-Host "Whoami: $([Environment]::UserName)"

try {
  Write-Host "`n--- node / npm ---" -ForegroundColor Cyan
  & node -v 2>&1
  & npm -v 2>&1
  & where.exe node 2>&1
  & where.exe npm 2>&1
} catch {
  Write-Warning "node/npm not on PATH: $_"
}

Write-Host "`n--- npm config (project + user + global) ---" -ForegroundColor Cyan
Push-Location $PSScriptRoot\..
try {
  & npm config list -l 2>&1 | Select-String -Pattern "strict-ssl|registry|proxy|https-proxy|cafile|prefix|globalconfig|userconfig"
} finally {
  Pop-Location
}

Show-Var "NODE_OPTIONS"
Show-Var "NODE_EXTRA_CA_CERTS"
Show-Var "NODE_TLS_REJECT_UNAUTHORIZED"
Show-Var "SSLKEYLOGFILE"
Show-Var "HTTP_PROXY"
Show-Var "HTTPS_PROXY"
Show-Var "ALL_PROXY"
Show-Var "NO_PROXY"

Write-Host "`n--- HTTPS probe (node → registry.npmjs.org) ---" -ForegroundColor Cyan
Push-Location $PSScriptRoot\..
try {
  & node "$PSScriptRoot\npm-tls-probe.cjs" 2>&1
} catch {
  Write-Warning "Probe failed: $_"
} finally {
  Pop-Location
}

Write-Host "`n--- Recommendations (TLS / Windows) ---" -ForegroundColor Yellow
Write-Host "1. Do not set npm node-options for Windows CA trust in project .npmrc — breaks EAS cloud Linux builds."
Write-Host "2. Local TLS workaround: see README (PowerShell session only). Never set in eas.json env or Expo project env."
Write-Host "3. Avoid NODE_TLS_REJECT_UNAUTHORIZED=0 from IDE; run npm in an external PowerShell."
Write-Host "4. SSLKEYLOGFILE pointing to a filter driver = TLS interception; exclude node.exe from HTTPS scanning or set NODE_EXTRA_CA_CERTS."
Write-Host "5. Keep strict-ssl=true; npm cafile only with a real PEM if needed."
Write-Host "6. Then: npm cache clean --force; npm install; npm run validate; npx eas login"

Write-Host "`nDone.`n" -ForegroundColor Green
