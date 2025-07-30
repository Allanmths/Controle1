// Este script corrige o problema de codificação UTF-8 no arquivo useOfflineMode.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo
const filePath = path.join(__dirname, 'src/hooks/useOfflineMode.js');

// Ler o arquivo
const content = fs.readFileSync(filePath, 'utf8');

// Fazer as substituições
const correctedContent = content
  .replace(/VocÃª estÃ¡/g, 'Você está')
  .replace(/ConexÃ£o/g, 'Conexão')
  .replace(/serÃ£o/g, 'serão')
  .replace(/ðŸŒ/g, '🌐')
  .replace(/ðŸ"±/g, '📱');

// Escrever o arquivo corrigido
fs.writeFileSync(filePath, correctedContent, 'utf8');

console.log('Arquivo corrigido com sucesso!');
