#!/usr/bin/env node

/**
 * Script para incrementar automáticamente la versión de la PWA
 * Uso: node scripts/update-version.js [major|minor|patch]
 * Por defecto incrementa patch (2.0.0 -> 2.0.1)
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '..', 'public', 'sw.js');

function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  
  switch(type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

try {
  // Leer el archivo sw.js
  let content = fs.readFileSync(SW_PATH, 'utf8');
  
  // Buscar la versión actual
  const versionRegex = /const CACHE_VERSION = ['"]([\d.]+)['"];/;
  const match = content.match(versionRegex);
  
  if (!match) {
    console.error('❌ No se pudo encontrar CACHE_VERSION en sw.js');
    process.exit(1);
  }
  
  const currentVersion = match[1];
  const versionType = process.argv[2] || 'patch';
  const newVersion = incrementVersion(currentVersion, versionType);
  
  // Reemplazar la versión
  content = content.replace(
    versionRegex,
    `const CACHE_VERSION = '${newVersion}';`
  );
  
  // Guardar el archivo
  fs.writeFileSync(SW_PATH, content, 'utf8');
  
  console.log('✅ Versión actualizada exitosamente');
  console.log(`   Versión anterior: ${currentVersion}`);
  console.log(`   Versión nueva:    ${newVersion}`);
  console.log(`   Tipo:             ${versionType}`);
  console.log('');
  console.log('🚀 Ya puedes hacer deploy a Railway');
  
} catch (error) {
  console.error('❌ Error al actualizar la versión:', error.message);
  process.exit(1);
}
