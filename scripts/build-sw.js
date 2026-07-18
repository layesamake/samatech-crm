/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('--- Génération de public/sw.js ---');

const templatePath = path.join(__dirname, '..', 'src', 'sw-template.js');
const swDestPath = path.join(__dirname, '..', 'public', 'sw.js');
const nextStaticDir = path.join(__dirname, '..', '.next', 'static');

if (!fs.existsSync(templatePath)) {
  console.error('Erreur: src/sw-template.js est introuvable.');
  process.exit(1);
}

let templateContent = fs.readFileSync(templatePath, 'utf8');

// Récupérer tous les fichiers statiques de /.next/static/
function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return [];
  
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const staticFiles = getAllFiles(nextStaticDir);
const staticUrls = staticFiles.map(file => {
  const relativePath = path.relative(nextStaticDir, file).replace(/\\/g, '/');
  return `/_next/static/${relativePath}`;
});

// Injection des URLs dans le template
const urlsString = staticUrls.map(url => `'${url}'`).join(',\n  ');
templateContent = templateContent.replace('// INJECT_NEXT_STATIC_CHUNKS', urlsString);

// Générer un hash basé sur le timestamp ou les fichiers
const hash = crypto.createHash('md5').update(staticUrls.join('') + Date.now()).digest('hex').substring(0, 8);
templateContent = templateContent.replace('{{HASH}}', hash);

fs.writeFileSync(swDestPath, templateContent);

console.log(`✅ public/sw.js généré avec ${staticUrls.length} fichiers statiques (hash: ${hash}).`);
