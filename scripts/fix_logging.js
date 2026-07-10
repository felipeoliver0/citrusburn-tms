const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('c:/citrusburn-tms/app').concat(walk('c:/citrusburn-tms/lib'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/console\.error\(([^,]+),\s*(err|error|e)\)/g, "console.error($1, $2 instanceof Error ? $2.message : 'Unknown error')");
  
  if (original !== content) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
