# GitHub Remote Push Helper Script
param(
    [string]$RepoUrl
)

if (-not $RepoUrl) {
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "         GitHub Repository Push Automation Helper         " -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    $RepoUrl = Read-Host "GitHub 레포지토리 URL을 입력하세요 (예: https://github.com/username/profile-landing.git)"
}

if ($RepoUrl) {
    Set-Location "C:\dev\profile-landing"
    
    $existing = & git remote
    if ($existing -contains "origin") {
        & git remote remove origin
    }
    
    & git remote add origin $RepoUrl
    & git branch -M main
    Write-Host "`nPushing to GitHub: $RepoUrl ..." -ForegroundColor Yellow
    & git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[성공] GitHub에 코드가 성공적으로 푸시되었습니다!" -ForegroundColor Green
        Write-Host "이제 Cloudflare Pages에서 이 레포지토리를 연결하시면 배포가 완료됩니다." -ForegroundColor Cyan
    } else {
        Write-Host "`n[안내] 푸시 도중 GitHub 웹 브라우저 인증이 요청될 수 있습니다." -ForegroundColor Yellow
    }
} else {
    Write-Host "URL이 입력되지 않았습니다. 취소되었습니다." -ForegroundColor Red
}
