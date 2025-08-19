const sharp = require('sharp');
const fs = require('fs');


function generateFooterSVG(name, designation, phone, email, textWidth, footerHeight, fontSize) {
    // Add more vertical space between lines for clarity
    const totalLines = 4;
    const lineHeight = Math.round(fontSize * 1.5); // Increased line height for more space
    const totalHeight = lineHeight * totalLines;
    const verticalPadding = (footerHeight - totalHeight) / 2;
    const startY = verticalPadding + lineHeight * 0.6; // First baseline
    const textPadding = 2; // Consistent left padding
    const MIN_FONT_SIZE = 12;
    let allFontSize = Math.max(fontSize, 18);

    // Helper: normalize casing and format designation
    const normalizeDesignation = (d) => {
        if (!d) return 'N/A | WealthPlus';
        const dl = d.toLowerCase();
        if (dl.includes('wealth')) return 'Wealth Manager | WealthPlus';
        if (dl.includes('health')) return 'Health Insurance Advisor | WealthPlus';
        return `${d.replace(/\s+/g, ' ').trim()} | WealthPlus`;
    };

    const formattedDesignation = normalizeDesignation(designation || '');

    // Escape XML special chars for SVG
    const escapeXml = (unsafe) => String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const lines = [
        String(name || ''),
        formattedDesignation,
        `Phone: ${String(phone || '')}`,
        `Email: ${String(email || '')}`
    ].map(l => escapeXml(l));
    
    // Estimate character width (~0.55 * fontSize) and reduce font size until fits
    const maxTextWidth = Math.max(10, textWidth - textPadding * 2);
    const approxCharWidth = 0.55; 
    const fitsAtSize = (size) => {
        const charWidth = size * approxCharWidth;
        return lines.every(line => (line.length * charWidth) <= maxTextWidth);
    };

    // Reduce font size until all lines fit or until MIN_FONT_SIZE
    while (allFontSize > MIN_FONT_SIZE && !fitsAtSize(allFontSize)) {
        allFontSize = Math.max(MIN_FONT_SIZE, Math.floor(allFontSize * 0.92));
        if (allFontSize <= MIN_FONT_SIZE) break;
    }

    let svgLines = [];
    let y = startY;
    for (const l of lines) {
        svgLines.push(`<text x="${textPadding}" y="${y}" class="footertext">${l}</text>`);
        y += lineHeight;
    }

    return `
        <svg width="${textWidth}" height="${footerHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="gradText" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#1B75BB; stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#252A78; stop-opacity:1" />
                </linearGradient>
            </defs>
            <style>
                .footertext {
                    font-family: Arial, sans-serif;
                    fill: url(#gradText);
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

async function processCircularImage(inputPath, outputPath, size) {
    try {
        const circleMask = Buffer.from(
            `<svg width="${size}" height="${size}">
                <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
            </svg>`
        );

        const buffer = await sharp(inputPath)
            .resize(size, size, { fit: 'cover' })
            .composite([{ input: circleMask, blend: 'dest-in' }])
            .jpeg()
            .toBuffer();

        fs.writeFileSync(outputPath, buffer);
    } catch (error) {
        console.error('Error in processCircularImage:', error);
        throw error;
    }
}

/**
 * Creates the final poster by combining a template image with a user's details.
 * @param {object} options - Options object.
 * @param {string} options.templatePath - Path to the poster template image.
 * @param {object} options.person - Object containing user details.
 * @param {string} options.person.name - User's name.
 * @param {string} options.person.designation - User's designation.
 * @param {string} options.person.phone - User's phone number.
 * @param {string} options.person.email - User's email address.
 * @param {string} options.person.photo - Path to the user's photo.
 * @param {string} options.logoPath - Path to the company logo.
 * @param {string} options.outputPath - Path to save the final poster.
 */
async function createFinalPoster({ templatePath, person, logoPath, outputPath }) {
    try {
        const templateResized = await sharp(templatePath).resize({ width: 800 }).toBuffer();
        const templateMetadata = await sharp(templateResized).metadata();
        const width = templateMetadata.width;

        const photoSize = Math.floor(width * 0.15);
        const fontSize = Math.floor(photoSize * 0.14);
        const spacing = fontSize + 6;
        const textWidth = width - photoSize - 200; // Adjusted text width to give space for line and logo
        const photoLeft = 50;

        const footerSVG = generateFooterSVG(
            person.name, person.designation, person.phone, person.email,
            textWidth, spacing * 5, fontSize
        );

        const textBuffer = await sharp(Buffer.from(footerSVG)).png().toBuffer();
        const textMetadata = await sharp(textBuffer).metadata();

        const circularPhoto = await sharp(person.photo)
            .resize(photoSize, photoSize, { fit: 'cover' })
            .composite([{
                input: Buffer.from(
                    `<svg><circle cx="${photoSize / 2}" cy="${photoSize / 2}" r="${photoSize / 2}" fill="white"/></svg>`
                ),
                blend: 'dest-in'
            }])
            .png()
            .toBuffer();

        const logoSize = photoSize;
        const resizedLogo = await sharp(logoPath)
            .resize({ width: logoSize, height: logoSize, fit: 'contain' })
            .toBuffer();

        const footerHeight = Math.max(photoSize + 20, textMetadata.height + 20);
        const textLeft = photoLeft + photoSize + 20;
        const lineLeft = textLeft + textMetadata.width + 10;
        const logoLeft = lineLeft + 10;

        const lineSVG = `<svg width="2" height="${photoSize}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="2" height="${photoSize}" fill="#1B75BB"/></svg>`;
        const lineBuffer = await sharp(Buffer.from(lineSVG)).png().toBuffer();

        const gradientFooterBuffer = await sharp({
            create: {
                width,
                height: footerHeight,
                channels: 4,
                background: { r: 240, g: 247, b: 255, alpha: 1 }
            }
        })
        .composite([
            { input: circularPhoto, top: Math.floor((footerHeight - photoSize) / 2), left: photoLeft },
            { input: textBuffer, top: Math.floor((footerHeight - textMetadata.height) / 2), left: textLeft },
            { input: lineBuffer, top: Math.floor((footerHeight - photoSize) / 2), left: lineLeft },
            { input: resizedLogo, top: Math.floor((footerHeight - logoSize) / 2), left: logoLeft },
        ])
        .jpeg()
        .toBuffer();

        const finalImageBuffer = await sharp({
            create: {
                width,
                height: templateMetadata.height + footerHeight,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([
            { input: templateResized, top: 0, left: 0 },
            { input: gradientFooterBuffer, top: templateMetadata.height, left: 0 }
        ])
        .jpeg()
        .toBuffer();

        fs.writeFileSync(outputPath, finalImageBuffer);
    } catch (error) {
        console.error('Error in createFinalPoster:', error);
        throw error;
    }
}

module.exports = {
    generateFooterSVG,
    processCircularImage,
    createFinalPoster,
};
