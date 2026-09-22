param(
  [Parameter(Mandatory = $true)]
  [string] $AabPath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $AabPath)) {
  throw "AAB not found: $AabPath"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

$requiredBundleMarkers = @(
  "gigxomi.chat.outbox",
  "gigxomi.mobile.session.v1",
  "No Internet Connection",
  "New message - open Gigxomi to view.",
  "Queued. Will retry when the connection is stable.",
  "https://www.gigxomi.com/api",
  "/mobile/auth/otp-channel",
  "/mobile/config",
  "/assignments"
)

$forbiddenBundleMarkers = @(
  "messagesHidden"
)

$requiredConfig = @{
  name = "Gigxomi"
  scheme = "gigxomi"
}

$requiredAndroid = @{
  package = "com.gigxomi.app"
  googleServicesFile = "./google-services.json"
}

$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $AabPath))
try {
  $configEntry = $zip.GetEntry("base/assets/app.config")
  $bundleEntry = $zip.GetEntry("base/assets/index.android.bundle")
  if (-not $configEntry) {
    throw "Missing base/assets/app.config"
  }
  if (-not $bundleEntry) {
    throw "Missing base/assets/index.android.bundle"
  }

  $configReader = [System.IO.StreamReader]::new($configEntry.Open())
  try {
    $configJson = $configReader.ReadToEnd() | ConvertFrom-Json
  } finally {
    $configReader.Dispose()
  }

  foreach ($key in $requiredConfig.Keys) {
    if ($configJson.$key -ne $requiredConfig[$key]) {
      throw "AAB app.config mismatch for '$key'. Expected '$($requiredConfig[$key])', got '$($configJson.$key)'."
    }
  }

  foreach ($key in $requiredAndroid.Keys) {
    if ($configJson.android.$key -ne $requiredAndroid[$key]) {
      throw "AAB android config mismatch for '$key'. Expected '$($requiredAndroid[$key])', got '$($configJson.android.$key)'."
    }
  }

  if (-not ($configJson.android.permissions -contains "POST_NOTIFICATIONS")) {
    throw "AAB is missing POST_NOTIFICATIONS permission."
  }

  $bundleReader = [System.IO.StreamReader]::new($bundleEntry.Open())
  try {
    $bundle = $bundleReader.ReadToEnd()
  } finally {
    $bundleReader.Dispose()
  }

  $missingMarkers = @()
  foreach ($marker in $requiredBundleMarkers) {
    if (-not $bundle.Contains($marker)) {
      $missingMarkers += $marker
    }
  }

  $forbiddenHits = @()
  foreach ($marker in $forbiddenBundleMarkers) {
    if ($bundle.Contains($marker)) {
      $forbiddenHits += $marker
    }
  }

  $errors = @()
  if ($missingMarkers.Count -gt 0) {
    $errors += "AAB is missing fixed bundle marker(s): $($missingMarkers -join ', ')"
  }
  if ($forbiddenHits.Count -gt 0) {
    $errors += "AAB still contains stale buggy marker(s): $($forbiddenHits -join ', ')"
  }

  if ($errors.Count -gt 0) {
    throw ($errors -join "`n")
  }

  [pscustomobject]@{
    ok = $true
    path = (Resolve-Path -LiteralPath $AabPath).Path
    bytes = (Get-Item -LiteralPath $AabPath).Length
    appName = $configJson.name
    androidPackage = $configJson.android.package
    easProjectId = $configJson.extra.eas.projectId
    fixedMarkersChecked = $requiredBundleMarkers.Count
  } | Format-List
} finally {
  $zip.Dispose()
}
