const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_IMAGE = path.join(__dirname, '..', 'public', 'Images', 'logo-resize.png');
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const NAVY_BG = '#00298D';

async function generateIcons() {
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  console.log('Loading source image:', SOURCE_IMAGE);

  // Trim transparent edges to get tight logo bounds
  const trimmedBuffer = await sharp(SOURCE_IMAGE)
    .trim()
    .toBuffer();

  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  console.log(`Trimmed logo dimensions: ${trimmedMeta.width}x${trimmedMeta.height}`);

  // Helper to generate maskable / solid-bg icons
  // Android safe-zone requires graphic to fit within 80% circle (we use 68% for ample breathing room)
  async function createMaskableIcon(size, innerRatio = 0.68) {
    const innerSize = Math.round(size * innerRatio);
    const resizedLogo = await sharp(trimmedBuffer)
      .resize(innerSize, innerSize, {
        fit: 'inside',
        kernel: sharp.kernel.lanczos3
      })
      .toBuffer();

    const logoMeta = await sharp(resizedLogo).metadata();
    const left = Math.round((size - logoMeta.width) / 2);
    const top = Math.round((size - logoMeta.height) / 2);

    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: NAVY_BG
      }
    })
      .composite([{ input: resizedLogo, left, top }])
      .png()
      .toBuffer();
  }

  // Helper to generate transparent "any" icons
  // Uses ~90% ratio for clean edge margins on desktop taskbars / docks
  async function createTransparentIcon(size, innerRatio = 0.90) {
    const innerSize = Math.round(size * innerRatio);
    const resizedLogo = await sharp(trimmedBuffer)
      .resize(innerSize, innerSize, {
        fit: 'inside',
        kernel: sharp.kernel.lanczos3
      })
      .toBuffer();

    const logoMeta = await sharp(resizedLogo).metadata();
    const left = Math.round((size - logoMeta.width) / 2);
    const top = Math.round((size - logoMeta.height) / 2);

    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: resizedLogo, left, top }])
      .png()
      .toBuffer();
  }

  // 1. Maskable Icons (Android Adaptive Icons - Option B Navy BG)
  console.log('Generating Maskable icons (Navy BG with safe zone padding)...');
  const maskable512 = await createMaskableIcon(512, 0.68);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon-maskable-512x512.png'), maskable512);

  const maskable192 = await createMaskableIcon(192, 0.68);
  fs.writeFileSync(path.join(ICONS_DIR, 'icon-maskable-192x192.png'), maskable192);

  // 2. Apple Touch Icons (iOS - 180x180 & 152x152 solid Navy BG)
  console.log('Generating Apple Touch icons...');
  const apple180 = await createMaskableIcon(180, 0.72);
  fs.writeFileSync(path.join(ICONS_DIR, 'apple-touch-icon.png'), apple180);
  fs.writeFileSync(path.join(ICONS_DIR, 'apple-touch-icon-180x180.png'), apple180);

  const apple152 = await createMaskableIcon(152, 0.72);
  fs.writeFileSync(path.join(ICONS_DIR, 'apple-touch-icon-152x152.png'), apple152);

  // 3. Transparent Standard Icons (Desktop / Any launcher)
  console.log('Generating standard transparent icons...');
  const anySizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const s of anySizes) {
    const iconBuf = await createTransparentIcon(s);
    fs.writeFileSync(path.join(ICONS_DIR, `icon-${s}x${s}.png`), iconBuf);
  }

  // 4. Windows MSTile icons
  console.log('Generating Microsoft Tile icons...');
  const mstile144 = await createTransparentIcon(144);
  fs.writeFileSync(path.join(ICONS_DIR, 'mstile-144x144.png'), mstile144);

  const mstile150 = await createTransparentIcon(150);
  fs.writeFileSync(path.join(ICONS_DIR, 'mstile-150x150.png'), mstile150);

  // 5. Favicons
  console.log('Generating Favicons (16x16, 32x32, 48x48)...');
  const fav16 = await createTransparentIcon(16, 0.94);
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon-16x16.png'), fav16);

  const fav32 = await createTransparentIcon(32, 0.94);
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon-32x32.png'), fav32);

  const fav48 = await createTransparentIcon(48, 0.94);
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon-48x48.png'), fav48);

  // Generate multi-image ICO file for public/favicon.ico
  // An ICO file contains a 6-byte header, 16-byte directory per entry, and raw PNG data
  console.log('Generating multi-resolution favicon.ico...');
  const icoBuffers = [fav16, fav32, fav48];
  const icoSizes = [16, 32, 48];
  const count = icoBuffers.length;
  
  // Header: 2 bytes reserved (0), 2 bytes type (1 for ICO), 2 bytes image count
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];
  for (let i = 0; i < count; i++) {
    const buf = icoBuffers[i];
    const size = icoSizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size < 256 ? size : 0, 0); // width
    entry.writeUInt8(size < 256 ? size : 0, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buf.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    dirEntries.push(entry);
    offset += buf.length;
  }

  const finalIco = Buffer.concat([header, ...dirEntries, ...icoBuffers]);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), finalIco);
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon.ico'), finalIco);

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
