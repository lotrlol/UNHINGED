$cleanContent = Get-Content -Path "src\components\ContentTab.fixed.tsx" -Raw
Set-Content -Path "src\components\ContentTab.tsx" -Value $cleanContent -NoNewline
Remove-Item -Path "src\components\ContentTab.fixed.tsx"
