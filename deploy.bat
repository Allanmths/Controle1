@echo off
echo ===== DEPLOY PARA GITHUB PAGES =====
echo Iniciando processo de deploy...

echo.
echo 1. Verificando status do git...
git status

echo.
echo 2. Construindo aplicacao...
call npm run build

echo.
echo 3. Enviando para o GitHub Pages...
call npm run deploy

echo.
echo ===== DEPLOY CONCLUIDO =====
echo Acesse: https://allanmths.github.io/Controle1/
echo.