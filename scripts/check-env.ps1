$ErrorActionPreference = 'Stop'
$failed = $false

$backendEnvPath = Join-Path $PSScriptRoot "..\backend\.env"
$scriptsEnvPath = Join-Path $PSScriptRoot ".\.env"

function Check-EnvFile {
    param([string]$FilePath)

    if (-not (Test-Path $FilePath)) {
        Write-Host "FAIL: $FilePath does not exist." -ForegroundColor Red
        return $true
    }

    Write-Host "Checking $FilePath..." -ForegroundColor Cyan
    $fileFailed = $false
    $content = Get-Content $FilePath
    foreach ($line in $content) {
        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) { continue }
        if ($line -match "^([A-Z_]+)=(.*)$") {
            $key = $matches[1]
            $val = $matches[2]
            $len = $val.Length
            $pass = $true
            $msg = ""

            if ($key -eq "MONGODB_URI") {
                if (-not ($val.StartsWith("mongodb"))) {
                    $pass = $false
                    $msg = "must start with mongodb"
                } elseif ($len -le 60) {
                    $pass = $false
                    $msg = "must be > 60 chars"
                }
            } elseif ($key -eq "JWT_SECRET") {
                if ($len -lt 32) {
                    $pass = $false
                    $msg = "must be >= 32 chars"
                } elseif ($val.ToLower().StartsWith("mongodb")) {
                    $pass = $false
                    $msg = "must not start with mongodb"
                }
            } elseif ($key -eq "JWT_EXPIRY_MINUTES") {
                if (-not [int]::TryParse($val, [ref]0)) {
                    $pass = $false
                    $msg = "must be numeric"
                }
            }

            if ($pass) {
                Write-Host "$key ($len chars): PASS" -ForegroundColor Green
            } else {
                Write-Host "$key ($len chars): FAIL - $msg" -ForegroundColor Red
                $fileFailed = $true
            }
        }
    }
    Write-Host ""
    return $fileFailed
}

if (Check-EnvFile $backendEnvPath) { $failed = $true }
if (Check-EnvFile $scriptsEnvPath) { $failed = $true }

if ($failed) {
    Write-Host "Environment check FAILED." -ForegroundColor Red
    exit 1
} else {
    Write-Host "Environment check PASSED." -ForegroundColor Green
    exit 0
}
