# db/apply.ps1
# ─────────────────────────────────────────────────────────────────────────────
# Reads MONGODB_URI and MONGODB_DB from backend/.env (KEY=VALUE format),
# then applies db/indexes.js and db/validators.js to the target cluster
# using mongosh.
#
# Usage (from repo root):
#   .\db\apply.ps1
#
# Requires: mongosh in PATH.
# Windows PowerShell 5.1 compatible.
# ─────────────────────────────────────────────────────────────────────────────

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Locate the .env file ──────────────────────────────────────────────────────
$envFile = Join-Path $PSScriptRoot "..\backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Error "backend\.env not found at: $envFile"
    exit 1
}

# ── Parse KEY=VALUE lines (skip comments and blanks) ─────────────────────────
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#')) {
        $idx = $line.IndexOf('=')
        if ($idx -gt 0) {
            $key   = $line.Substring(0, $idx).Trim()
            $value = $line.Substring($idx + 1).Trim()
            $envVars[$key] = $value
        }
    }
}

$uri = $envVars['MONGODB_URI']
$db  = if ($envVars.ContainsKey('MONGODB_DB')) { $envVars['MONGODB_DB'] } else { 'empowerlyplus' }

if (-not $uri) {
    Write-Error "MONGODB_URI is not set in backend\.env"
    exit 1
}

# ── Resolve script paths ──────────────────────────────────────────────────────
$indexesScript    = Join-Path $PSScriptRoot "indexes.js"
$validatorsScript = Join-Path $PSScriptRoot "validators.js"

foreach ($path in @($indexesScript, $validatorsScript)) {
    if (-not (Test-Path $path)) {
        Write-Error "Script not found: $path"
        exit 1
    }
}

# ── Run indexes.js ────────────────────────────────────────────────────────────
Write-Host "Applying indexes..." -ForegroundColor Cyan
& mongosh $uri --quiet --eval "use $db" $indexesScript
if ($LASTEXITCODE -ne 0) {
    Write-Error "indexes.js failed (exit code $LASTEXITCODE)"
    exit $LASTEXITCODE
}

# ── Run validators.js ─────────────────────────────────────────────────────────
Write-Host "Applying validators..." -ForegroundColor Cyan
& mongosh $uri --quiet --eval "use $db" $validatorsScript
if ($LASTEXITCODE -ne 0) {
    Write-Error "validators.js failed (exit code $LASTEXITCODE)"
    exit $LASTEXITCODE
}

Write-Host "Done. All indexes and validators applied successfully." -ForegroundColor Green
