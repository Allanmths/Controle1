const fs = require('fs');
const path = require('path');

// Lista de substituições
const replacements = [
  { from: 'Ã§', to: 'ç' },
  { from: 'Ã£', to: 'ã' },
  { from: 'Ãµ', to: 'õ' },
  { from: 'Ã©', to: 'é' },
  { from: 'Ã¡', to: 'á' },
  { from: 'Ã­', to: 'í' },
  { from: 'Ã³', to: 'ó' },
  { from: 'Ãº', to: 'ú' },
  { from: 'Ã¢', to: 'â' },
  { from: 'Ãª', to: 'ê' },
  { from: 'Ã´', to: 'ô' },
  { from: 'Ã', to: 'Á' },
  { from: 'MÃ¡', to: 'Má' },
  // Adicione mais conforme necessário
];

// Extensões de arquivos a verificar
const exts = ['.js', '.jsx', '.md', '.json', '.html', '.css'];

// Função para processar um arquivo
function processFile(filePath) {
  if (fs.lstatSync(filePath).isDirectory()) {
    // É um diretório, então processa seus arquivos
    fs.readdirSync(filePath).forEach(file => {
      processFile(path.join(filePath, file));
    });
  } else {
    // É um arquivo, verifica se tem extensão que queremos processar
    if (exts.includes(path.extname(filePath).toLowerCase())) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;
        
        // Aplica as substituições
        for (const { from, to } of replacements) {
          content = content.replace(new RegExp(from, 'g'), to);
        }
        
        // Só escreve de volta se tiver alterações
        if (content !== original) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Encoding corrigido: ${filePath}`);
        }
      } catch (error) {
        console.error(`Erro ao processar ${filePath}:`, error.message);
      }
    }
  }
}

// Caminho inicial (pasta src do projeto)
const basePath = path.resolve(__dirname, 'src');
processFile(basePath);

console.log('Correção de encoding concluída!');
