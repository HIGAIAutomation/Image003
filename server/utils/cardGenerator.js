const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

/**
 * Generates a personalized image by placing clean text
 * between the logo and "Powered by AssetPlus", just above the disclaimer.
 */
async function generatePersonalizedImage() {
  try {
    // --- Configuration ---
    const templatePath = path.join(__dirname, '../assets/ABCD.jpg'); // Use your uploaded base image here
    const outputDir = path.join(__dirname, '../output');
    const yourText = 'Abu Inshah | ARN 123456 | +91 98765 43210';
    const fontSize = 25; // Moderate size for neat display

    // --- Setup ---
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const template = await loadImage(templatePath);
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

    // --- Font & Style Setup ---
    ctx.font = `bold ${fontSize}px Sans`;
    ctx.fillStyle = '#000000'; // Black text
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    // --- Position Calculation ---
    const centerX = canvas.width / 2;
    
    // Based on uploaded image layout (adjust based on actual footer height)
    const verticalOffsetFromBottom =120; // Puts text above the AMFI disclaimer
    const textY = canvas.height - verticalOffsetFromBottom;

    // --- Draw the Text ---
    ctx.fillText(yourText, centerX, textY);

    // --- Output ---
    const outPath = path.join(outputDir, `personalized_${Date.now()}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    console.log('✅ Personalized image saved successfully:', outPath);
    return outPath;

  } catch (err) {
    console.error('❌ An error occurred while generating the image:', err);
    throw err;
  }
}

module.exports = { generatePersonalizedImage };
