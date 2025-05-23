const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// If canvas is not installed, you'll need to run: npm install canvas

// Function to create a simple quiz icon
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#6B46C1'; // Purple background (matches the app theme)
  ctx.fillRect(0, 0, size, size);
  
  // Quiz "Q" letter
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.6)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Q', size/2, size/2);
  
  return canvas.toBuffer();
}

// Sizes to generate
const sizes = [16, 48, 128];

// Create the images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Generate icons for each size
sizes.forEach(size => {
  const iconBuffer = generateIcon(size);
  fs.writeFileSync(path.join(imagesDir, `icon${size}.png`), iconBuffer);
  console.log(`Generated icon${size}.png`);
});

console.log('Icon generation complete!'); 