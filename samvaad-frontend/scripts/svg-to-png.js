const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcSvg = path.resolve(__dirname, '../../assets/logo.svg');
const out192 = path.resolve(__dirname, '../public/logo-192.png');
const out512 = path.resolve(__dirname, '../public/logo-512.png');

async function convert() {
  try {
    await sharp(srcSvg).resize(192, 192).png().toFile(out192);
    await sharp(srcSvg).resize(512, 512).png().toFile(out512);
    console.log('PNG icons generated successfully.');
  } catch (err) {
    console.error('Error generating PNGs:', err);
  }
}

convert(); 