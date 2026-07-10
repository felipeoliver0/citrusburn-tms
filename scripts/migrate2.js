const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app');

const replacements = [
  { regex: /emerald-/g, replace: 'brand-' },
  { regex: /Citrusburn Dispatch/g, replace: 'H Estoker Dispatch' },
  { regex: /MinhasCargas/g, replace: 'MyLoads' },
  { regex: /Cadastro/g, replace: 'Register' },
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
console.log('Migration 2 complete.');
