const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [192, 512];
const inputSvg = path.join(__dirname, '../public/logo-512x512.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `pwa-${size}x${size}.png`);
      const maskableOutputFile = path.join(outputDir, `pwa-maskable-${size}x${size}.png`);
      
      // Generate regular icon
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      
      console.log(`Generated ${outputFile}`);
      
      // Generate maskable icon (with padding for safe zone)
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([
          {
            input: await sharp(inputSvg)
              .resize(Math.round(size * 0.8), Math.round(size * 0.8))
              .toBuffer(),
            gravity: 'center'
          }
        ])
        .png()
        .toFile(maskableOutputFile);
      
      console.log(`Generated ${maskableOutputFile}`);
    }
    
    // Also create a favicon
    await sharp(inputSvg)
      .resize(32, 32)
      .png()
      .toFile(path.join(outputDir, 'favicon.png'));
    
    console.log('Icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
}

generateIcons();
