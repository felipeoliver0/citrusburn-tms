const fs = require('fs');
const path = require('path');

const files = [
  'app/load/[loadId]/page.tsx',
  'app/edit-load/[loadId]/page.tsx',
  'app/driver/[loadId]/page.tsx',
  'app/driver/[loadId]/Tracker.tsx',
];

const replacements = [
  ['bg-slate-950', 'bg-gray-50'],
  ['bg-slate-900', 'bg-white'],
  ['bg-slate-950/50', 'bg-gray-50'],
  ['bg-slate-800', 'bg-gray-100'],
  ['border-slate-800/60', 'border-gray-200'],
  ['border-slate-800', 'border-gray-200'],
  ['border-slate-700', 'border-gray-300'],
  ['text-slate-200', 'text-gray-800'],
  ['text-slate-300', 'text-gray-600'],
  ['text-slate-400', 'text-gray-500'],
  ['text-slate-500', 'text-gray-400'],
  ['text-white', 'text-gray-900'],
  ['hover:bg-slate-800', 'hover:bg-gray-100'],
  ['hover:bg-slate-700', 'hover:bg-gray-200'],
  ['hover:text-white', 'hover:text-gray-900'],
  ['text-brand-400', 'text-brand-600'],
];

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) { console.log('SKIP:', file); continue; }
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Updated:', file);
  }
}
console.log('Done.');
