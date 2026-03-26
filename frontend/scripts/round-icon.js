const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processIcon(inputPath, outputPath, size) {
  try {
    const radius = Math.round(size * 0.225); // Apple iOS style squircle radius (~22.5%)
    
    // Create an SVG mask with rounded corners
    const roundedCorners = Buffer.from(
      `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`
    );

    await sharp(inputPath)
      .resize(size, size)
      .composite([{
        input: roundedCorners,
        blend: 'dest-in'
      }])
      .png()
      .toFile(outputPath);
      
    console.log(`Success: Curved corners applied to ${outputPath}`);
  } catch (err) {
    console.error(`Error processing ${inputPath}:`, err.message);
  }
}

async function main() {
  const iconPath = path.join(__dirname, '../src/app/icon.png');
  const publicIconPath = path.join(__dirname, '../public/dsq-icon.png');
  
  // We'll output to a temp file then overwrite
  await processIcon(iconPath, iconPath + '.tmp.png', 512);
  fs.renameSync(iconPath + '.tmp.png', iconPath);

  if (fs.existsSync(publicIconPath)) {
    await processIcon(publicIconPath, publicIconPath + '.tmp.png', 512);
    fs.renameSync(publicIconPath + '.tmp.png', publicIconPath);
  }
}

main();
