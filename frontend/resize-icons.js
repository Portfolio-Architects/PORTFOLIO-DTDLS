const Jimp = require('jimp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function processIcon(inputPath, outputPath, size) {
  try {
    const image = await Jimp.read(inputPath);
    // Resize the content to 80%
    const targetContentSize = Math.floor(size * 0.8);
    image.resize(targetContentSize, targetContentSize);

    // Create a new image of the original size with transparent background (or white)
    // Actually, PWA maskable icons usually have a solid background color. Let's make it white (#FFFFFF).
    const background = new Jimp(size, size, '#FFFFFF');
    
    // Composite the resized content in the center
    const x = Math.floor((size - targetContentSize) / 2);
    const y = Math.floor((size - targetContentSize) / 2);
    
    background.composite(image, x, y);

    await background.writeAsync(outputPath);
    console.log(`Processed ${outputPath}`);
    return background;
  } catch (err) {
    console.error(`Error processing ${inputPath}:`, err);
  }
}

async function main() {
  const publicDir = path.join(__dirname, 'public');
  const appDir = path.join(__dirname, 'src', 'app');

  // Process PWA Icons
  await processIcon(path.join(publicDir, 'icon-192x192.png'), path.join(publicDir, 'icon-192x192.png'), 192);
  await processIcon(path.join(publicDir, 'icon-512x512.png'), path.join(publicDir, 'icon-512x512.png'), 512);

  // Process Favicon (assuming it was originally a PNG or we can read it)
  // Since favicon.ico might be difficult for Jimp to read properly if it's a multi-layer ICO,
  // we will use the 192x192 icon as the base, resize it to 32x32 (with 80% padding), and convert to ICO.
  const tempPngPath = path.join(publicDir, 'temp-favicon.png');
  await processIcon(path.join(publicDir, 'icon-192x192.png'), tempPngPath, 64);
  
  try {
    const buf = await pngToIco.default(tempPngPath);
    fs.writeFileSync(path.join(appDir, 'favicon.ico'), buf);
    console.log(`Processed favicon.ico`);
    fs.unlinkSync(tempPngPath);
  } catch (e) {
    console.error('Error generating favicon.ico:', e);
  }
}

main();
