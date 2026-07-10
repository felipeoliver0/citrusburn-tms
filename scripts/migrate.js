const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app');

const replacements = [
  { regex: /citrus-/g, replace: 'brand-' },
  { regex: /CitrusBurn/g, replace: 'H Estoker' },
  { regex: /CITRUSBURN/g, replace: 'H ESTOKER' },
  { regex: /\/cadastro/g, replace: '/register' },
  { regex: /\/configuracoes/g, replace: '/settings' },
  { regex: /\/conta/g, replace: '/account' },
  { regex: /\/editar-carga/g, replace: '/edit-load' },
  { regex: /\/minhas-cargas/g, replace: '/my-loads' },
  { regex: /\/nova-carga/g, replace: '/new-load' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { regex, replace } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Migration complete.');
