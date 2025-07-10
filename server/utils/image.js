const sharp = require('sharp');
const fs = require('fs');

function generateFooterSVG(name, designation, phone, email, textWidth, footerHeight, fontSize) {
  const spacing = fontSize + 6;
  const startX = 5;
  const startY = fontSize;

  return `
    <svg width="${textWidth}" height="${footerHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradText" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#1B75BB; stop-opacity:1" />
          <stop offset="100%" style="stop-color:#252A78; stop-opacity:1" />
        </linearGradient>
      </defs>
      <style>
        .text { font-family: Arial, sans-serif; fill: url(#gradText); font-weight: bold; }
        .normal { font-size: ${fontSize}px; }
      </style>
      <text x="${startX}" y="${startY}" class="text normal">Name: ${name}</text>
      <text x="${startX}" y="${startY + spacing}" class="text normal">Email: ${email}</text>
      <text x="${startX}" y="${startY + 2 * spacing}" class="text normal">Designation: ${designation}</text>
      <text x="${startX}" y="${startY + 3 * spacing}" class="text normal">Phone No: ${phone}</text>
    </svg>
  `;
}

async function createFinalPoster({ templatePath, person, logoPath, outputPath }) {
  const templateResized = await sharp(templatePath).resize({ width: 800 }).toBuffer();
  const templateMetadata = await sharp(templateResized).metadata();
  const width = templateMetadata.width;

  const photoSize = Math.floor(width * 0.15);
  const fontSize = Math.floor(photoSize * 0.14);
  const spacing = fontSize + 6;
  const textWidth = width - (photoSize * 2) - 100;

  const footerSVG = generateFooterSVG(
    person.name, person.designation, person.phone, person.email,
    textWidth, spacing * 5, fontSize
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
      width: photoSize,
      height: photoSize,
      fit: 'contain',
      background: { r: 240, g: 247, b: 255 }
    })
    .flatten({ background: { r: 240, g: 247, b: 255 } })
    .jpeg()
    .toBuffer();

  // Dynamically calculate footer height to fit all elements
  const footerHeight = Math.max(photoSize, textMetadata.height, photoSize) + 20;

  const gradientFooterBuffer = await sharp({
    create: {
      width,
      height: footerHeight,
      channels: 3,
      background: { r: 240, g: 247, b: 255 },
    }
  })
    .composite([
      { input: circularPhoto, top: Math.floor((footerHeight - photoSize) / 2), left: 50 },
      { input: textBuffer, top: Math.floor((footerHeight - textMetadata.height) / 2), left: photoSize + 70 },
      { input: resizedLogo, top: Math.floor((footerHeight - photoSize) / 2), left: width - photoSize - 60 },
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
  createFinalPoster
};
