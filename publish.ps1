# Publish Emberkin to GitHub Pages
# Usage: right-click → Run with PowerShell, or: powershell -ExecutionPolicy Bypass -File publish.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Find-Exe($names, $paths) {
  foreach ($p in $paths) { if (Test-Path $p) { return $p } }
  foreach ($n in $names) {
    $cmd = Get-Command $n -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
  }
  return $null
}

$git = Find-Exe @("git") @(
  "C:\Program Files\Git\cmd\git.exe",
  "C:\Program Files\Git\bin\git.exe"
)
$gh = Find-Exe @("gh") @(
  "C:\Program Files\GitHub CLI\gh.exe",
  "$env:LOCALAPPDATA\Programs\GitHub CLI\gh.exe"
)

if (-not $git) { throw "git not found. Install https://git-scm.com/ and re-run." }

if (-not (Test-Path .git)) {
  & $git init -b main
}

& $git add index.html styles.css README.md .gitignore src/main.js src/simulation.js src/villager.js src/renderer.js publish.ps1
& $git status

$pending = & $git status --porcelain
if ($pending) {
  & $git commit -m "Publish Emberkin colony sim with founders, whispers, saves, and mobile UI"
}

$remote = & $git remote
if ($remote -notcontains "origin") {
  & $git remote add origin https://github.com/szaielamri/pixel-colony-sim.git
} else {
  & $git remote set-url origin https://github.com/szaielamri/pixel-colony-sim.git
}

& $git push -u origin main

if ($gh) {
  & $gh auth status
  & $gh pages deploy . --branch main --remote origin 2>$null
  & $gh api repos/szaielamri/pixel-colony-sim/pages -X POST -f build_type=legacy -f source[branch]=main -f source[path]=/ 2>$null
  Write-Host "Pages URL (after a minute): https://szaielamri.github.io/pixel-colony-sim/"
} else {
  Write-Host "Enable Pages manually: GitHub repo → Settings → Pages → Deploy from branch main / root"
  Write-Host "https://szaielamri.github.io/pixel-colony-sim/"
}
