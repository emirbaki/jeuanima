# JeuAnima · build.ps1 — full build of the film in this folder.
# usage:  powershell -ExecutionPolicy Bypass -File films\<slug>\build.ps1
# Order: lips -> events -> score -> mix -> audit -> video -> mux -> poster. Writes <Title>.mp4 and poster.jpg here.
$ErrorActionPreference = 'Stop'
$FILM = $PSScriptRoot
$LIB = if ($env:LEMO_OPUSCAR_HOME) { $env:LEMO_OPUSCAR_HOME } else { Join-Path $env:USERPROFILE 'lemo-opuscar' }
$PY = Join-Path $LIB '.venv\Scripts\python.exe'
$cfg = Get-Content (Join-Path $FILM 'film.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$tl = Get-Content (Join-Path $FILM 'timeline.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$NAME = ($cfg.title -replace '[^\p{L}\p{Nd}]+', '_').Trim('_')

function Run($exe, $argv) { & $exe @argv; if ($LASTEXITCODE -ne 0) { throw "failed ($LASTEXITCODE): $exe $argv" } }
# sh runs mux.sh. Git for Windows has it, but often not on the PowerShell PATH.
$SH = if (Get-Command sh -ErrorAction SilentlyContinue) { 'sh' } else { [IO.Path]::GetFullPath((Join-Path (git --exec-path) '..\..\..\bin\sh.exe')) }

if ($tl.draft) { throw 'timeline.json is a draft: put the voice in assets/ and run prep_timeline.py first' }
$voice = Get-ChildItem (Join-Path $FILM 'assets') -Recurse -File | Where-Object { $_.Name -like 'voice.*' -or $_.Directory.Name -eq 'voice' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($voice -and $voice.LastWriteTime -gt (Get-Item (Join-Path $FILM 'timeline.json')).LastWriteTime) { throw 'the voice is newer than timeline.json: run prep_timeline.py again' }

Run $PY @((Join-Path $FILM 'engine\core\py\lips.py'), $FILM)
Push-Location $LIB
try {
  Run node @('core/render/events.mjs', $FILM, '--size', '1080x1920')
  Run $PY @((Join-Path $FILM "engine\styles\$($cfg.style)\score.py"), $FILM)
  Run $PY @((Join-Path $FILM 'engine\core\py\mix.py'), $FILM)
  Run node @((Join-Path $FILM 'engine\core\tools\audit.mjs'), $FILM)
  Run node @('core/render/video.mjs', $FILM, '--fps', '24', '--workers', '4', '--size', '1080x1920', '--out', (Join-Path $FILM 'out\video.mp4'))
  Run $SH @('core/render/mux.sh', ((Join-Path $FILM 'out\video.mp4') -replace '\\', '/'), ((Join-Path $FILM 'out\mix.wav') -replace '\\', '/'), ((Join-Path $FILM "$NAME.mp4") -replace '\\', '/'), '24')
} finally { Pop-Location }
# poster: the punchline frame (last spoken line, a third of the way in)
$spoken = @($tl.lines | Where-Object { $_.silence -eq $null }); $pt = 1.0
if ($spoken.Count) { $last = $spoken[$spoken.Count - 1]; $pt = [math]::Round($last.a + ($last.b - $last.a) / 3, 2) }
Run ffmpeg @('-v', 'error', '-y', '-ss', "$pt", '-i', (Join-Path $FILM "$NAME.mp4"), '-frames:v', '1', '-q:v', '2', (Join-Path $FILM 'poster.jpg'))
$cfg.stage = 'built'; [IO.File]::WriteAllText((Join-Path $FILM 'film.json'), ($cfg | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding $false))
Write-Host "built: $FILM\$NAME.mp4"
