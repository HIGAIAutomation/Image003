const sharp = require('sharp');
const fs = require('fs');

/**
 * Generates an SVG containing text information.
 *
 * Changes:
 * - Text is now left-aligned ('text-anchor: start').
 * - Text remains vertically centered within the footer area.
 * - Adjusted vertical spacing for the text block to have equal space above and below.
 */
function generateFooterSVG(name, designation, phone, textWidth, footerHeight, fontSize) {
  // Add more vertical space between lines for clarity
  const totalLines = 4;
  const lineHeight = Math.round(fontSize * 1.5); // Increased line height for more space
  const totalHeight = lineHeight * totalLines;
  const verticalPadding = (footerHeight - totalHeight) / 2;
  const startY = verticalPadding + lineHeight * 0.6; // First baseline
  const textPadding = 2; // Consistent left padding
  const allFontSize = Math.max(fontSize, 20); // Minimum 18px for clarity

  // Format designation to handle both cases properly
  let formattedDesignation;
  if (designation.toLowerCase().includes('wealth')) {
    formattedDesignation = 'Wealth Manager | WealthPlus';
  } else if (designation.toLowerCase().includes('health')) {
    formattedDesignation = 'Health Insurance Advisor | WealthPlus';
  } else {
    formattedDesignation = `${designation} | WealthPlus`;
  }

  let svgLines = [];
  let y = startY;
  svgLines.push(`<text x="${textPadding}" y="${y}" class="footertext">${name}</text>`);
  y += lineHeight;
  svgLines.push(`<text x="${textPadding}" y="${y}" class="footertext">${formattedDesignation}</text>`);
  y += lineHeight;
  svgLines.push(`<text x="${textPadding}" y="${y}" class="footertext">Phone: ${phone}</text>`);
  y += lineHeight;
  svgLines.push(`<text x="${textPadding}" y="${y}" class="footertext">IRDAI Certified Insurance Advisor</text>`);

  return `
    <svg width="${textWidth}" height="${footerHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .footertext {
          font-family: Arial, sans-serif;
          fill: #292d6c;
          font-weight: bold;
          font-size: ${allFontSize}px;
          text-anchor: start;
          dominant-baseline: middle;
        }
      </style>
      ${svgLines.join('\n')}
    </svg>
  `;
}

/**
 * Crops an image into a circle.
 */
async function processCircularImage(inputPath, outputPath, size) {
  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`
  );

  const buffer = await sharp(inputPath)
    .resize(size, size)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .jpeg()
    .toBuffer();

  fs.writeFileSync(outputPath, buffer);
}

/**
 * Creates the final composite poster.
 */
async function createFinalPoster({ templatePath, person, logoPath, outputPath }) {
  const templateResized = await sharp(templatePath).resize({ width: 800 }).toBuffer();
  const templateMetadata = await sharp(templateResized).metadata();
  const width = templateMetadata.width;

  const photoSize = Math.floor(width * 0.18);
  const fontSize = Math.round(width * 0.022); // ~18px for 800px width
  const textWidth = width * 0.48; // More width for text
  const logoSize = Math.floor(width * 0.15);

  // Footer height: 4 lines, minimal vertical space, plus padding
  const lineHeight = Math.round(fontSize * 1.18);
  const requiredTextHeight = lineHeight * 4;
  const footerHeight = Math.max(photoSize, requiredTextHeight, logoSize) + 18;

  // Always use the exact designation from person.designation (as filtered by send-posters)
  const footerSVG = generateFooterSVG(
    person.name,
    person.designation,
    person.phone,
    textWidth,
    footerHeight,
    fontSize
  );

  const textBuffer = await sharp(Buffer.from(footerSVG)).png().toBuffer();
  const textMetadata = await sharp(textBuffer).metadata();

  const circularPhoto = await sharp(person.photo)
    .resize(photoSize, photoSize)
    .composite([{
      input: Buffer.from(
        `<svg><circle cx="${photoSize / 2}" cy="${photoSize / 2}" r="${photoSize / 2}" fill="white"/></svg>`
      ),
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  const resizedLogo = await sharp(logoPath)
    .resize({
      width: logoSize,
      height: logoSize,
      fit: 'contain',
      background: { r: 240, g: 247, b: 255 }
    })
    .flatten({ background: { r: 240, g: 247, b: 255 } })
    .jpeg()
    .toBuffer();

  const photoLeft = 40;
  const textLeft = photoLeft + photoSize + 20;

  const lineWidth = 4;
  const lineGap = 32; // Closer to text

  // Move vertical line and logo closer to text, as in reference
  const rightSectionStart = textLeft + textMetadata.width + 10;
  const lineX = rightSectionStart + lineGap;
  const logoXCentered = lineX + lineWidth + 32;

  const lineY = Math.floor((footerHeight - logoSize) / 2);
  const lineHeightSVG = logoSize;

  const lineSVG = `<svg width="${lineWidth}" height="${lineHeightSVG}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${lineWidth}" height="${lineHeightSVG}" fill="#1B75BB"/></svg>`;
  const lineBuffer = await sharp(Buffer.from(lineSVG)).png().toBuffer();

  const gradientFooterBuffer = await sharp({
    create: {
      width,
      height: footerHeight,
      channels: 3,
      background: { r: 240, g: 247, b: 255 },
    }
  })
    .composite([
      { input: circularPhoto, top: Math.floor((footerHeight - photoSize) / 2), left: photoLeft },
      { input: textBuffer, top: Math.floor((footerHeight - textMetadata.height) / 2), left: textLeft },
      { input: lineBuffer, top: lineY, left: lineX },
      { input: resizedLogo, top: Math.floor((footerHeight - logoSize) / 2), left: logoXCentered },
    ])
    .jpeg()
    .toBuffer();

  const finalImageBuffer = await sharp({
    create: {
      width,
      height: templateMetadata.height + footerHeight,
      channels: 3,
      background: '#ffffff'
    }
  })
    .composite([
      { input: templateResized, top: 0, left: 0 },
      { input: gradientFooterBuffer, top: templateMetadata.height, left: 0 }
    ])
    .jpeg()
    .toBuffer();

  fs.writeFileSync(outputPath, finalImageBuffer);
}

module.exports = {
  generateFooterSVG,
  processCircularImage,
  createFinalPoster,
};