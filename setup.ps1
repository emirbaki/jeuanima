# JeuAnima · setup.ps1 — installs everything a film build needs.
# usage:  powershell -ExecutionPolicy Bypass -File setup.ps1
# Needs: git, Node 20+, Python 3.11-3.13 (or uv), ffmpeg, sh (Git for Windows gives sh).
# Lemo-Opuscar goes to $env:LEMO_OPUSCAR_HOME, else ~/lemo-opuscar, at the commit below.
$ErrorActionPreference = 'Stop'
$ROOT = $PSScriptRoot
$LIB = if ($env:LEMO_OPUSCAR_HOME) { $env:LEMO_OPUSCAR_HOME } else { Join-Path $env:USERPROFILE 'lemo-opuscar' }
$REPO = 'https://github.com/lemomo-ai/lemo-opuscar.git'
$COMMIT = '3961ddb3d24d8876e0e2754f7790d66908acee51'

function Run($exe, $argv) { & $exe @argv; if ($LASTEXITCODE -ne 0) { throw "failed ($LASTEXITCODE): $exe $argv" } }
function Has($name) { [bool](Get-Command $name -ErrorAction SilentlyContinue) }

# 1. tools
$missing = @('git', 'node', 'npm', 'ffmpeg', 'sh') | Where-Object { -not (Has $_) }
if ($missing) { throw "install these first: $($missing -join ', ')" }
$nodeMajor = [int]((node -v).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 20) { throw "Node 20+ is needed (found $(node -v))" }

# 2. Lemo-Opuscar (render library)
if (-not (Test-Path (Join-Path $LIB 'core\render\video.mjs'))) {
  Write-Host "lemo-opuscar: cloning to $LIB"
  Run git @('clone', '--quiet', $REPO, $LIB)
  Run git @('-C', $LIB, 'checkout', '--quiet', $COMMIT)
} else {
  Write-Host "lemo-opuscar: found at $LIB"
}

# 3. Node packages and the headless browser
Push-Location $LIB
try {
  Run npm @('install', '--no-audit', '--no-fund', '--loglevel=error')
  Run node @('node_modules/playwright-core/cli.js', 'install', 'chromium-headless-shell')
} finally { Pop-Location }

# 4. Python venv and packages
$PY = Join-Path $LIB '.venv\Scripts\python.exe'
$REQ = Join-Path $ROOT 'requirements.txt'
if (-not (Test-Path $PY)) {
  Write-Host 'python: making .venv'
  if (Has 'uv') { Run uv @('venv', '--quiet', '--python', '3.12', (Join-Path $LIB '.venv')) }
  elseif (Has 'py') { Run py @('-3.12', '-m', 'venv', (Join-Path $LIB '.venv')) }
  else { Run python @('-m', 'venv', (Join-Path $LIB '.venv')) }
}
if (Has 'uv') { Run uv @('pip', 'install', '--quiet', '--python', $PY, '-r', $REQ) }
else {
  & $PY -m pip --version *> $null
  if ($LASTEXITCODE -ne 0) { Run $PY @('-m', 'ensurepip', '--upgrade') }
  Run $PY @('-m', 'pip', 'install', '--quiet', '--disable-pip-version-check', '-r', $REQ)
}

# 5. check
Run $PY @('-m', 'pytest', (Join-Path $ROOT 'engine\core\tests'), '-q')
Write-Host ''
Write-Host "ready. Python: $PY"
Write-Host 'next: make a film with engine/core/tools/new_film.py (see README.md)'
