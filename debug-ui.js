#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 UI Debug Report\n');

// Check package.json
const webDir = '/home/ubuntu/S3-Upload-Feature-Demo/web';
const packagePath = path.join(webDir, 'package.json');

if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('📦 Dependencies:');
  console.log('React:', pkg.dependencies?.react || 'Not found');
  console.log('Cloudscape:', pkg.dependencies?.['@cloudscape-design/components'] || 'Not found');
  console.log('Router:', pkg.dependencies?.['react-router-dom'] || 'Not found');
  console.log('Axios:', pkg.dependencies?.axios || 'Not found');
  console.log('');
}

// Check critical files
const criticalFiles = [
  'src/App.tsx',
  'src/components/Dashboard.tsx',
  'src/pages/DocumentsPage.tsx',
  'src/services/apiService.ts',
  'src/contexts/AuthContext.tsx'
];

console.log('📁 File Status:');
criticalFiles.forEach(file => {
  const fullPath = path.join(webDir, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});
console.log('');

// Check for TypeScript errors
console.log('🔧 Quick Fixes:');
console.log('1. Install missing dependencies:');
console.log('   cd web && npm install react-router-dom @types/react-router-dom');
console.log('');
console.log('2. Fix import issues:');
console.log('   - Check relative imports in components');
console.log('   - Verify Cloudscape imports');
console.log('');
console.log('3. Start dev server:');
console.log('   cd web && npm start');
console.log('');

// Check node_modules
const nodeModulesPath = path.join(webDir, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  const cloudscapePath = path.join(nodeModulesPath, '@cloudscape-design');
  console.log('📚 Cloudscape installed:', fs.existsSync(cloudscapePath) ? '✅' : '❌');
} else {
  console.log('❌ node_modules not found - run npm install');
}
