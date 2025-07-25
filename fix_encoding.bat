@echo off
echo Corrigindo codificação de arquivos...

powershell -Command "Get-ChildItem -Path './src' -Include '*.jsx','*.js' -Recurse | ForEach-Object { $content = Get-Content -Path $_.FullName -Raw; $utf8 = New-Object System.Text.UTF8Encoding $true; [System.IO.File]::WriteAllText($_.FullName, $content, $utf8); Write-Host ('Convertido: ' + $_.FullName) }"

echo Finalizado!
pause