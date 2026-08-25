param(
  [string]$OutputPath = "n7cosmetics-namecheap.zip"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$archivePath = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
  [System.IO.Path]::GetFullPath($OutputPath)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $projectRoot $OutputPath))
}

$requiredFiles = @(
  ".env",
  ".next/BUILD_ID",
  ".scripts-dist/scripts/migrate.js",
  "next.config.ts",
  "package.json",
  "server.js"
)

foreach ($relativePath in $requiredFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $relativePath) -PathType Leaf)) {
    throw "Missing $relativePath. Run 'pnpm build:deploy' before creating the archive."
  }
}

$environment = @{}
foreach ($line in Get-Content -LiteralPath (Join-Path $projectRoot ".env")) {
  if ($line -match "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$") {
    $environment[$matches[1]] = $matches[2].Trim()
  }
}

$environmentErrors = @()
if ($environment["NODE_ENV"] -ne "production") {
  $environmentErrors += "NODE_ENV must be production."
}
if ($environment["APP_URL"] -notmatch "^https://") {
  $environmentErrors += "APP_URL must use HTTPS."
}
if ($environment["ADMIN_COOKIE_SECURE"] -ne "true") {
  $environmentErrors += "ADMIN_COOKIE_SECURE must be true."
}
if ([string]::IsNullOrWhiteSpace($environment["DB_PASSWORD"])) {
  $environmentErrors += "DB_PASSWORD must contain the Namecheap database password."
}
if ($environment["DB_USER"] -eq "root") {
  $environmentErrors += "DB_USER must be the dedicated Namecheap database user, not root."
}

if ($environmentErrors.Count -gt 0) {
  throw "Deployment environment is not ready:`n- $($environmentErrors -join "`n- ")"
}

$rootFiles = @(
  ".env",
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "postcss.config.mjs",
  "server.js",
  "tsconfig.json",
  "tsconfig.scripts.json"
)
$rootDirectories = @(
  ".next",
  ".scripts-dist",
  "app",
  "components",
  "content",
  "database",
  "lib",
  "public",
  "scripts",
  "types"
)

$files = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
foreach ($relativePath in $rootFiles) {
  $fullPath = Join-Path $projectRoot $relativePath
  if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
    $files.Add((Get-Item -LiteralPath $fullPath -Force))
  }
}

foreach ($relativePath in $rootDirectories) {
  $fullPath = Join-Path $projectRoot $relativePath
  if (-not (Test-Path -LiteralPath $fullPath -PathType Container)) {
    continue
  }

  foreach ($file in Get-ChildItem -LiteralPath $fullPath -Recurse -File -Force) {
    $relativeFile = $file.FullName.Substring($projectRoot.Length).TrimStart([char[]]@("\", "/"))
    if ($relativeFile -like ".next\cache\*" -or $relativeFile -like ".next\dev\*") {
      continue
    }
    $files.Add($file)
  }
}

$archiveDirectory = Split-Path -Parent $archivePath
if (-not (Test-Path -LiteralPath $archiveDirectory -PathType Container)) {
  New-Item -ItemType Directory -Path $archiveDirectory | Out-Null
}
if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$archive = [System.IO.Compression.ZipFile]::Open(
  $archivePath,
  [System.IO.Compression.ZipArchiveMode]::Create
)
try {
  foreach ($file in $files) {
    $entryName = $file.FullName.Substring($projectRoot.Length).TrimStart([char[]]@("\", "/")).Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $archive,
      $file.FullName,
      $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
} finally {
  $archive.Dispose()
}

$archiveSize = (Get-Item -LiteralPath $archivePath).Length / 1MB
Write-Host ("Created {0} ({1:N1} MB, {2} files)." -f $archivePath, $archiveSize, $files.Count)
