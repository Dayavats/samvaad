const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcSvg = path.resolve(__dirname, '../public/logo.svg');
const out192 = path.resolve(__dirname, '../public/logo-192.png');
const out512 = path.resolve(__dirname, '../public/logo-512.png');

console.log('Input SVG:', srcSvg);
console.log('Output 192x192 PNG:', out192);
console.log('Output 512x512 PNG:', out512);

async function convert() {
  try {
    await sharp(srcSvg).resize(192, 192).png().toFile(out192);
    console.log('192x192 PNG generated successfully.');
    await sharp(srcSvg).resize(512, 512).png().toFile(out512);
    console.log('512x512 PNG generated successfully.');
  } catch (err) {
    console.error('Error generating PNGs:', err);
  }
}

convert(); 