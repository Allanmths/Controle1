@echo off
echo Corrigindo codificação de arquivos...
chcp 65001 > nul

node fix_encoding.js

echo Finalizado!
pause