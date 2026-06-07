$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8
Set-Location -Path $PSScriptRoot
$port = 8000

Write-Host "=========================================="
Write-Host " Healing Song Archive localhost 실행"
Write-Host "=========================================="
Write-Host "현재 폴더: $PWD"
Write-Host "실행 주소: http://localhost:$port"
Write-Host "이 창은 서버 창입니다. 웹페이지를 보는 동안 닫지 마세요."
Write-Host "종료하려면 이 창에서 Ctrl + C 를 누르세요."
Write-Host ""

if (!(Test-Path "index.html")) {
    Write-Host "[오류] index.html을 찾을 수 없습니다. ZIP 파일 압축을 푼 뒤 실행하세요."
    Read-Host "Enter를 누르면 종료됩니다"
    exit 1
}

$pythonCmd = $null
if (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
}

if ($null -eq $pythonCmd) {
    Write-Host "[오류] Python이 설치되어 있지 않거나 PATH에 등록되어 있지 않습니다."
    Write-Host "해결 방법 1: Python 설치 후 다시 실행"
    Write-Host "해결 방법 2: VS Code Live Server로 index.html 실행"
    Read-Host "Enter를 누르면 종료됩니다"
    exit 1
}

Write-Host "사용 Python 명령어: $pythonCmd"
Write-Host "서버를 시작합니다..."
Start-Process "http://localhost:$port"
& $pythonCmd -m http.server $port

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[오류] 서버 실행에 실패했습니다. 8000번 포트가 이미 사용 중일 수 있습니다."
    Write-Host "PowerShell에서 직접 실행: $pythonCmd -m http.server 5500"
    Write-Host "브라우저 주소: http://localhost:5500"
    Read-Host "Enter를 누르면 종료됩니다"
}
