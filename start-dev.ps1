# ERP 로컬 개발 환경 시작 스크립트

Write-Host "🚀 ERP 로컬 개발 환경을 시작합니다..." -ForegroundColor Green

# PostgreSQL 상태 확인
Write-Host "`n📦 PostgreSQL 상태 확인..." -ForegroundColor Cyan
$dbStatus = docker-compose -f docker-compose.dev.yml ps --services --filter "status=running" | Select-String "db"

if ($dbStatus) {
    Write-Host "✅ PostgreSQL이 실행 중입니다." -ForegroundColor Green
} else {
    Write-Host "⏳ PostgreSQL을 시작합니다..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml up -d
    Start-Sleep -Seconds 5
    Write-Host "✅ PostgreSQL이 시작되었습니다." -ForegroundColor Green
}

# 터미널 안내
Write-Host "`n📋 다음 명령어를 각각의 PowerShell 터미널에서 실행하세요:"`n -ForegroundColor Cyan

Write-Host "터미널 1 - 프론트엔드:" -ForegroundColor Yellow
Write-Host "  cd d:\erp" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "  → http://localhost:3000" -ForegroundColor Gray
Write-Host ""

Write-Host "터미널 2 - 백엔드:" -ForegroundColor Yellow
Write-Host "  cd d:\erp\backend" -ForegroundColor White
Write-Host "  venv\Scripts\activate" -ForegroundColor White
Write-Host "  python -m uvicorn main:app --reload" -ForegroundColor White
Write-Host "  → http://localhost:8000" -ForegroundColor Gray
Write-Host "  → API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ 개발 환경 준비 완료! Happy coding! 🎉" -ForegroundColor Green
