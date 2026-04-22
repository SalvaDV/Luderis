// Compile all JSX source files into a single bundle.js
// Run: node compile.js
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const srcDir = path.join(__dirname, 'src');
const outFile = path.join(__dirname, 'bundle.js');

// Load order matters: primitives first, then components, app last
const order = [
  'primitives.jsx',
  'shader.jsx',
  'cursor.jsx',
  'nav.jsx',
  'hero.jsx',
  'worlds.jsx',
  'features.jsx',
  'how.jsx',
  'preview.jsx',
  'stats.jsx',
  'about.jsx',
  'testimonials.jsx',
  'cta.jsx',
  'contact.jsx',
  'footer.jsx',
  'app.jsx',
];

let out = '';
for (const file of order) {
  const src = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const result = babel.transformSync(src, {
    presets: ['@babel/preset-react'],
    filename: file,
  });
  out += `\n// --- ${file} ---\n` + result.code + '\n';
}

fs.writeFileSync(outFile, out);
console.log('bundle.js written:', out.length, 'chars');
