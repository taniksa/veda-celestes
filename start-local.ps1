$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$dependencyDirectory = Join-Path $projectRoot '.runtime-next'
if (-not (Test-Path -LiteralPath $dependencyDirectory)) {
    throw 'Install requirements into .runtime-next first: python -m pip install --target .runtime-next -r requirements.txt'
}
$previousPythonPath = $env:PYTHONPATH
try {
    $env:PYTHONPATH = $dependencyDirectory
    Push-Location -LiteralPath $projectRoot
    python -m veda serve --host 127.0.0.1 --port 8088 --timezone Asia/Kolkata --output feeds
} finally {
    Pop-Location
    $env:PYTHONPATH = $previousPythonPath
}
