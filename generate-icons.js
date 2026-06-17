const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#03040a';
  ctx.fillRect(0, 0, size, size);

  // Outer glow ring
  const outerGrad = ctx.createRadialGradient(size/2, size/2, size*0.3, size/2, size/2, size*0.48);
  outerGrad.addColorStop(0, 'rgba(168,85,247,0.3)');
  outerGrad.addColorStop(1, 'rgba(168,85,247,0)');
  ctx.fillStyle = outerGrad;
  ctx.fillRect(0, 0, size, size);

  // Core orb
  const coreGrad = ctx.createRadialGradient(size*0.42, size*0.42, 0, size/2, size/2, size*0.32);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.2, '#c084fc');
  coreGrad.addColorStop(0.6, '#7c3aed');
  coreGrad.addColorStop(1, '#4c1d95');
  ctx.beginPath();
  ctx.arc(size/2, size/2, size*0.3, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  // Text
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${size * 0.18}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TARS', size/2, size/2);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated ${outputPath}`);
}

try {
  generateIcon(192, path.join(__dirname, 'public', 'icon-192.png'));
  generateIcon(512, path.join(__dirname, 'public', 'icon-512.png'));
} catch(e) {
  console.log('canvas not available, skipping icon generation');
}
