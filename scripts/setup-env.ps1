param (
    [string]$Db = "empowerlyplus",
    [switch]$Force
)

$backendEnvPath = Join-Path $PSScriptRoot "..\backend\.env"
$scriptsEnvPath = Join-Path $PSScriptRoot ".\.env"

if (-not $Force) {
    if (Test-Path $backendEnvPath) {
        Write-Host "File $backendEnvPath already exists. Use -Force to overwrite." -ForegroundColor Red
        exit 1
    }
    if (Test-Path $scriptsEnvPath) {
        Write-Host "File $scriptsEnvPath already exists. Use -Force to overwrite." -ForegroundColor Red
        exit 1
    }
}

$secureStr = Read-Host "Enter your MongoDB Atlas connection string" -AsSecureString
if (-not $secureStr) {
    Write-Host "No connection string provided." -ForegroundColor Red
    exit 1
}

$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureStr)
try {
    $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
} finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if (-not ($plain.StartsWith("mongodb+srv://") -or $plain.StartsWith("mongodb://"))) {
    Write-Host "Error: Connection string must start with mongodb+srv:// or mongodb://" -ForegroundColor Red
    exit 1
}

if ($plain -match "<|>") {
    Write-Host "Error: Connection string contains placeholders like <password>. Please replace them with actual values." -ForegroundColor Red
    exit 1
}

if ($plain.Length -lt 60) {
    Write-Host "Error: Connection string is suspiciously short (under 60 characters). Please provide a full Atlas connection string." -ForegroundColor Red
    exit 1
}

$bytes = New-Object byte[] 30
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$jwt = [Convert]::ToBase64String($bytes).Replace("+", "").Replace("/", "").Replace("=", "")
if ($jwt.Length -lt 40) {
    $jwt = $jwt.PadRight(40, 'a')
} else {
    $jwt = $jwt.Substring(0, 40)
}

$backendEnvContent = @"
MONGODB_URI=$plain
MONGODB_DB=$Db
JWT_SECRET=$jwt
JWT_EXPIRY_MINUTES=120
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=
"@

$scriptsEnvContent = @"
MONGODB_URI=$plain
MONGODB_DB=$Db
GEMINI_API_KEY=
"@

Set-Content -Path $backendEnvPath -Value $backendEnvContent -Encoding Ascii
Set-Content -Path $scriptsEnvPath -Value $scriptsEnvContent -Encoding Ascii

Write-Host "Environment files generated successfully." -ForegroundColor Green
Write-Host "backend/.env details:"
Write-Host "MONGODB_URI: $($plain.Length) chars"
Write-Host "MONGODB_DB: $($Db.Length) chars"
Write-Host "JWT_SECRET: $($jwt.Length) chars"
Write-Host "JWT_EXPIRY_MINUTES: $(("120").Length) chars"
Write-Host "CORS_ORIGIN: $(("http://localhost:5173").Length) chars"
Write-Host "GEMINI_API_KEY: 0 chars"

Write-Host ""
Write-Host "scripts/.env details:"
Write-Host "MONGODB_URI: $($plain.Length) chars"
Write-Host "MONGODB_DB: $($Db.Length) chars"
Write-Host "GEMINI_API_KEY: 0 chars"
