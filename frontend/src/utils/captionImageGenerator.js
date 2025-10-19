// Caption Image Generator - Canvas Rendering Utility

import { BACKGROUND_PRESETS, FONTS, ALL_FONTS, TEXT_COLORS, SHAPE_TYPES } from '../constants/captionStyles';

/**
 * Generate a caption image from text and style options
 * @param {Object} options - Generation options
 * @returns {Promise<Blob>} - Generated image as blob
 */
export async function generateCaptionImage(options) {
  const {
    text,
    backgroundId = 'gradient1',
    fontId = 'montserrat',
    textColorId = 'white',
    alignment = 'center',
    verticalAlignment = 'center',
    shapesId = 'none',
    width = 1080,
    height = 1080,
    customTextColor = '#10b981',
    customBgColor = '#10b981',
    textSize = 'md',
    bold = false,
    italic = false,
    underline = false,
    stroke = false,
    strokeWidth = 3,
    strokeColor = '#000000',
    letterSpacing = 0,
    lineSpacing = 1.3,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Get style objects
  let background = BACKGROUND_PRESETS.find(b => b.id === backgroundId);
  const font = ALL_FONTS.find(f => f.id === fontId) || FONTS.find(f => f.id === fontId);
  let textColor = TEXT_COLORS.find(c => c.id === textColorId);

  // Handle custom colors and backgrounds
  if (backgroundId === 'custom') {
    if (options.customBgData) {
      background = options.customBgData;
    } else {
      background = { id: 'custom', type: 'solid', color: customBgColor };
    }
  }
  if (textColorId === 'custom') {
    textColor = { id: 'custom', color: customTextColor };
  }

  // Draw layers
  await drawBackground(ctx, background, width, height);
  if (shapesId !== 'none') {
    drawShapes(ctx, shapesId, width, height);
  }
  drawText(ctx, text, font, textColor, alignment, verticalAlignment, width, height, {
    lineStyles: options.lineStyles,
    textSize,
    bold,
    italic,
    underline,
    stroke,
    strokeWidth,
    strokeColor,
    letterSpacing,
    lineSpacing,
  });

  // Convert to blob - use JPEG for better compression (no transparency needed)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.92);
  });
}

/**
 * Draw background on canvas
 */
async function drawBackground(ctx, background, width, height) {
  if (background.type === 'solid') {
    ctx.fillStyle = background.color;
    ctx.fillRect(0, 0, width, height);
  } else if (background.type === 'gradient') {
    const angle = (background.angle || 135) * Math.PI / 180;
    const x1 = width / 2 - Math.cos(angle) * width / 2;
    const y1 = height / 2 - Math.sin(angle) * height / 2;
    const x2 = width / 2 + Math.cos(angle) * width / 2;
    const y2 = height / 2 + Math.sin(angle) * height / 2;

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    background.colors.forEach((color, index) => {
      gradient.addColorStop(index / (background.colors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (background.type === 'image' && background.imageData) {
    // Draw image background
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = background.scale || 1;
        const posX = (background.position?.x || 50) / 100;
        const posY = (background.position?.y || 50) / 100;
        const opacity = (background.opacity !== undefined ? background.opacity : 100) / 100;

        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        const x = (width - scaledWidth) * posX;
        const y = (height - scaledHeight) * posY;

        // Apply image opacity
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        ctx.globalAlpha = 1.0;

        // Apply overlay if specified
        if (background.overlayOpacity && background.overlayOpacity > 0) {
          ctx.globalAlpha = background.overlayOpacity / 100;
          ctx.fillStyle = background.overlayColor || '#000000';
          ctx.fillRect(0, 0, width, height);
          ctx.globalAlpha = 1.0;
        }

        resolve();
      };
      img.onerror = () => {
        // Fallback to black background if image fails
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        resolve();
      };
      img.src = background.imageData;
    });
  }
}

/**
 * Draw decorative shapes
 */
function drawShapes(ctx, shapesId, width, height) {
  ctx.globalAlpha = 0.1;

  if (shapesId === 'circles') {
    // Draw random circles
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 50 + Math.random() * 150;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  } else if (shapesId === 'squares') {
    // Draw random squares
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 80 + Math.random() * 120;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, size, size);
    }
  } else if (shapesId === 'lines') {
    // Draw diagonal lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    for (let i = 0; i < 10; i++) {
      const y = (i * height) / 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + 100);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1.0;
}

/**
 * Draw text with word wrapping, multi-line support, and per-line styling
 */
function drawText(ctx, text, font, textColor, alignment, verticalAlignment, width, height, styleOptions = {}) {
  const {
    lineStyles = [],
    textSize = 'md',
    bold = false,
    italic = false,
    underline = false,
    stroke = false,
    strokeWidth = 3,
    strokeColor = '#000000',
    letterSpacing = 0,
    lineSpacing = 1.3,
  } = styleOptions;

  const maxWidth = width * 0.85; // 85% of canvas width
  const baseFontSize = calculateFontSize(text, width);
  const sizeMultipliers = { xs: 0.6, sm: 0.8, md: 1.0, lg: 1.3, xl: 1.6 };

  ctx.textBaseline = 'middle';

  // Handle multi-line input (respect newlines from textarea)
  const inputLines = text.split('\n');
  const linesData = [];

  // Process each input line and apply word wrapping
  inputLines.forEach((inputLine, lineIndex) => {
    const lineStyle = lineStyles[lineIndex] || {};
    const lineFont = lineStyle.fontId ? ALL_FONTS.find(f => f.id === lineStyle.fontId) || font : font;
    const lineColor = lineStyle.color || textColor.color;
    const lineBold = lineStyle.bold !== undefined ? lineStyle.bold : bold;
    const lineItalic = lineStyle.italic !== undefined ? lineStyle.italic : italic;
    const lineUnderline = lineStyle.underline !== undefined ? lineStyle.underline : underline;
    const lineStroke = lineStyle.stroke !== undefined ? lineStyle.stroke : stroke;
    const lineTextSize = lineStyle.textSize || textSize;
    const lineFontSize = baseFontSize * sizeMultipliers[lineTextSize];

    if (inputLine.trim() === '') {
      linesData.push({
        text: '',
        font: lineFont,
        color: lineColor,
        fontSize: lineFontSize,
        bold: lineBold,
        italic: lineItalic,
        underline: lineUnderline,
        stroke: lineStroke,
      }); // Preserve empty lines
    } else {
      // Build font string
      const fontStyle = lineItalic ? 'italic' : 'normal';
      const fontWeight = lineBold ? 'bold' : lineFont.weight;
      ctx.font = `${fontStyle} ${fontWeight} ${lineFontSize}px ${lineFont.family}`;

      const wrappedLines = wrapText(ctx, inputLine, maxWidth);
      wrappedLines.forEach(wrappedLine => {
        linesData.push({
          text: wrappedLine,
          font: lineFont,
          color: lineColor,
          fontSize: lineFontSize,
          bold: lineBold,
          italic: lineItalic,
          underline: lineUnderline,
          stroke: lineStroke,
        });
      });
    }
  });

  const lineHeight = baseFontSize * lineSpacing;
  const totalHeight = linesData.length * lineHeight;

  // Calculate vertical start position
  let startY;
  if (verticalAlignment === 'top') {
    startY = height * 0.15 + lineHeight / 2;
  } else if (verticalAlignment === 'bottom') {
    startY = height * 0.85 - totalHeight + lineHeight / 2;
  } else {
    startY = (height - totalHeight) / 2 + lineHeight / 2;
  }

  // Draw each line with its own style
  linesData.forEach((lineData, index) => {
    const y = startY + index * lineHeight;
    let x;

    // Build font string
    const fontStyle = lineData.italic ? 'italic' : 'normal';
    const fontWeight = lineData.bold ? 'bold' : lineData.font.weight;
    ctx.font = `${fontStyle} ${fontWeight} ${lineData.fontSize}px ${lineData.font.family}`;

    // Apply letter spacing
    if (letterSpacing !== 0) {
      ctx.letterSpacing = `${letterSpacing}px`;
    }

    if (alignment === 'center') {
      ctx.textAlign = 'center';
      x = width / 2;
    } else if (alignment === 'left') {
      ctx.textAlign = 'left';
      x = (width - maxWidth) / 2;
    } else {
      ctx.textAlign = 'right';
      x = width - (width - maxWidth) / 2;
    }

    // Draw stroke if enabled
    if (lineData.stroke && stroke) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(lineData.text, x, y);
    }

    // Draw text
    ctx.fillStyle = lineData.color;
    ctx.fillText(lineData.text, x, y);

    // Draw underline if enabled
    if (lineData.underline) {
      const metrics = ctx.measureText(lineData.text);
      const underlineY = y + lineData.fontSize * 0.15;
      let underlineX = x;

      if (alignment === 'center') {
        underlineX = x - metrics.width / 2;
      } else if (alignment === 'right') {
        underlineX = x - metrics.width;
      }

      ctx.beginPath();
      ctx.moveTo(underlineX, underlineY);
      ctx.lineTo(underlineX + metrics.width, underlineY);
      ctx.strokeStyle = lineData.color;
      ctx.lineWidth = Math.max(2, lineData.fontSize * 0.05);
      ctx.stroke();
    }

    // Reset letter spacing
    if (letterSpacing !== 0) {
      ctx.letterSpacing = '0px';
    }
  });
}

/**
 * Calculate optimal font size based on text length
 */
function calculateFontSize(text, canvasWidth) {
  const length = text.length;
  if (length < 20) return canvasWidth * 0.08; // 8% of width
  if (length < 50) return canvasWidth * 0.06; // 6% of width
  if (length < 100) return canvasWidth * 0.05; // 5% of width
  return canvasWidth * 0.04; // 4% of width
}

/**
 * Wrap text to fit within max width
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Generate preview image (smaller size for performance)
 */
export async function generatePreviewImage(options) {
  return generateCaptionImage({
    ...options,
    width: 300,
    height: 300,
  });
}
