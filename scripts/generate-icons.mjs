import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svg = `<svg width="512" height="512" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#5b21b6"/>
    </linearGradient>
  </defs>
  <rect width="40" height="40" rx="8" fill="url(#grad)"/>
  <rect x="8" y="8" width="24" height="18" rx="2" fill="white" fill-opacity="0.9"/>
  <rect x="11" y="11" width="18" height="12" rx="1" fill="url(#grad)"/>
  <rect x="15" y="29" width="10" height="3" rx="1" fill="white" fill-opacity="0.7"/>
  <rect x="12" y="32" width="16" height="2" rx="1" fill="white" fill-opacity="0.5"/>
</svg>`;

const sizes = [192, 512];
const iconDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

async function generateIcons() {
  for (const size of sizes) {
    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();
    
    fs.writeFileSync(path.join(iconDir, `icon-${size}x${size}.png`), pngBuffer);
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generateIcons().catch(console.error);