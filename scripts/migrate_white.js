const fs = require('fs');
const path = require('path');

// Files to update with white theme
const files = [
  'app/loadboard/page.tsx',
  'app/loadboard/SearchSidebar.tsx',
  'app/login/page.tsx',
  'app/register/page.tsx',
  'app/my-loads/page.tsx',
  'app/new-load/page.tsx',
  'app/broker-requests/page.tsx',
  'app/account/page.tsx',
  'app/settings/page.tsx',
  'app/verify/page.tsx',
];

const replacements = [
  // Backgrounds
  ['bg-slate-950', 'bg-gray-50'],
  ['bg-slate-900', 'bg-white'],
  ['bg-slate-950/50', 'bg-gray-50'],
  ['bg-slate-950/40', 'bg-gray-50'],
  ['bg-slate-800/50', 'bg-gray-100'],
  ['bg-slate-800/30', 'bg-gray-100/50'],
  ['bg-slate-800/60', 'bg-gray-100'],
  ['bg-slate-800', 'bg-gray-100'],
  // Borders
  ['border-slate-800/60', 'border-gray-200'],
  ['border-slate-800/50', 'border-gray-200'],
  ['border-slate-800', 'border-gray-200'],
  ['border-slate-700', 'border-gray-300'],
  // Text
  ['text-slate-200', 'text-gray-800'],
  ['text-slate-300', 'text-gray-600'],
  ['text-slate-400', 'text-gray-500'],
  ['text-slate-500', 'text-gray-400'],
  ['text-slate-600', 'text-gray-400'],
  ['text-white', 'text-gray-900'],
  // Hover states
  ['hover:bg-slate-800', 'hover:bg-gray-100'],
  ['hover:bg-slate-700', 'hover:bg-gray-200'],
  ['hover:text-white', 'hover:text-gray-900'],
  ['hover:border-brand-500', 'hover:border-brand-500'],
  // Focus
  ['focus:border-brand-500', 'focus:border-brand-500'],
  ['focus:ring-brand-500/20', 'focus:ring-brand-500/20'],
  // Misc
  ['bg-red-950/40', 'bg-red-50'],
  ['bg-red-950/30', 'bg-red-50'],
  ['border-red-800/60', 'border-red-200'],
  ['text-brand-400', 'text-brand-600'],
  ['bg-brand-500/10', 'bg-brand-500/10'],
  ['placeholder:text-slate-600', 'placeholder:text-gray-400'],
];

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) { console.log('SKIP (not found):', file); continue; }
  
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
  } else {
    console.log('No changes:', file);
  }
}

console.log('White theme migration complete.');
