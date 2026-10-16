# Publish Emberkin to GitHub Pages
# 1) Install Git for Windows: https://git-scm.com/download/win
# 2) In PowerShell:  powershell -ExecutionPolicy Bypass -File publish.ps1

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

if (-not $git) {
  throw "git not found. Install https://git-scm.com/download/win then re-run this script."
}

if (-not (Test-Path .git)) {
  & $git init -b main
}

$remote = & $git remote
if ($remote -notcontains "origin") {
  & $git remote add origin https://github.com/szaielamri/pixel-colony-sim.git
} else {
  & $git remote set-url origin https://github.com/szaielamri/pixel-colony-sim.git
}

& $git add index.html styles.css README.md .gitignore publish.ps1 src/
$pending = & $git status --porcelain
if ($pending) {
  & $git commit -m "Add possess mode, terrain brushes, building bar, prosthetics, and later eras"
}

Write-Host "Pulling remote (your earlier upload)..."
& $git pull origin main --allow-unrelated-histories --no-edit
if ($LASTEXITCODE -ne 0) {
  Write-Host "If there were conflicts, keep LOCAL versions of index.html, styles.css, and src/*, then:"
  Write-Host "  git add ."
  Write-Host "  git commit -m `"Merge remote upload with latest Emberkin`""
  throw "Resolve pull conflicts, then re-run publish.ps1"
}

Write-Host "Pushing to GitHub..."
& $git push -u origin main

if ($gh) {
  & $gh api repos/szaielamri/pixel-colony-sim/pages -X POST -f build_type=legacy -f source[branch]=main -f source[path]=/ 2>$null
  Write-Host "Pages URL (wait ~1 min): https://szaielamri.github.io/pixel-colony-sim/"
} else {
  Write-Host "Enable Pages: repo Settings → Pages → Deploy from branch main / (root)"
  Write-Host "https://szaielamri.github.io/pixel-colony-sim/"
}
