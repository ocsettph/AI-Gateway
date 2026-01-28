import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if this is a production build
// We'll check for production by looking at command line arguments or environment
const isProduction = process.env.NODE_ENV === 'production' || 
                     process.argv.includes('--production') ||
                     process.argv.some(arg => arg.includes('build'));

if (!isProduction) {
  console.log('Skipping version increment (not production build)');
  process.exit(0);
}

// Read version.json
const versionPath = path.join(__dirname, '..', 'version.json');
const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

// Parse current version
const [major, minor, patch] = versionData.version.split('.').map(Number);

// Increment minor version
const newMinor = minor + 1;
const newVersion = `${major}.${newMinor}.0`;

// Update version.json
versionData.version = newVersion;
fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2) + '\n');

console.log(`Version incremented: ${versionData.version} -> ${newVersion}`);
console.log(`New version: ${newVersion}`);
