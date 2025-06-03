import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source and destination paths
const sourcePath = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.mjs');
const destPath = path.join(__dirname, '../public/pdf.worker.min.js');

// Create public directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '../public'))) {
  fs.mkdirSync(path.join(__dirname, '../public'));
}

// Copy the file
fs.copyFileSync(sourcePath, destPath);
console.log('PDF.js worker file copied to public directory'); 