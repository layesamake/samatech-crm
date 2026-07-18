/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');

console.log('--- Vérification PWA ---');

// 1. Vérifier si sw.js existe
if (!fs.existsSync(swPath)) {
  console.error('❌ ÉCHEC: Le Service Worker (public/sw.js) n\'existe pas.');
  process.exit(1);
}

const swContent = fs.readFileSync(swPath, 'utf8');

// 2. Vérifier si sw.js n'est pas vide
if (swContent.trim().length === 0) {
  console.error('❌ ÉCHEC: Le Service Worker est vide.');
  process.exit(1);
}

// 3. Vérifier la logique d'installation/précache
if (!swContent.includes('install') || !swContent.includes('caches.open')) {
  console.error('❌ ÉCHEC: Le Service Worker ne contient pas de logique d\'installation/précache.');
  process.exit(1);
}

if (!swContent.includes('fetch')) {
  console.error('❌ ÉCHEC: Le Service Worker ne contient pas de gestionnaire fetch.');
  process.exit(1);
}

// 4. Vérifier la cohérence du manifeste
if (!fs.existsSync(manifestPath)) {
  console.error('❌ ÉCHEC: manifest.json introuvable.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.scope !== '/') {
  console.error('❌ ÉCHEC: Le scope du manifest n\'est pas "/".');
  process.exit(1);
}

console.log('✅ SUCCÈS: Le Service Worker manuel et la configuration PWA sont valides.');
process.exit(0);
