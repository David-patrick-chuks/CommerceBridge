import axios from 'axios';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function generateWelcomeBanner(userName: string): Promise<string> {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const baseBannerPath = path.join(__dirname, '../../public/banner.jpeg');
  const outputPath = path.join(uploadsDir, `welcome-${Date.now()}.png`);

  // Ensure uploads directory exists
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  try {
    // Get base image metadata to determine dimensions
    const metadata = await sharp(baseBannerPath).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 400;

    // Create SVG overlay: 'Welcome' and userName only
    const svg = `
      <svg width="${width}" height="${height}">
        <defs>
          <style>
            .welcome { fill: #075e54; font-size: ${Math.floor(width * 0.09)}px; font-weight: bold; font-family: 'Nunito', Arial, sans-serif; text-anchor: middle; }
            .username { fill: #222; font-size: ${Math.floor(width * 0.06)}px; font-weight: bold; font-family: 'Nunito', Arial, sans-serif; text-anchor: middle; }
          </style>
        </defs>
        <rect width="100%" height="100%" fill="rgba(255,255,255,0.8)"/>
        <text x="50%" y="${Math.floor(height * 0.45)}" class="welcome">Welcome</text>
        <text x="50%" y="${Math.floor(height * 0.65)}" class="username">${userName}</text>
      </svg>
    `;

    // Create the composite image
    await sharp(baseBannerPath)
      .composite([{
        input: Buffer.from(svg),
        top: 0,
        left: 0
      }])
      .png()
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error('❌ Error generating banner:', error);
    // Fallback: create a simple text-based banner without base image
    const fallbackSvg = `
      <svg width="800" height="400">
        <defs>
          <style>
            .bg { fill: #25d366; }
            .welcome { fill: white; font-size: 72px; font-weight: bold; font-family: 'Nunito', Arial, sans-serif; text-anchor: middle; }
            .username { fill: white; font-size: 48px; font-weight: bold; font-family: 'Nunito', Arial, sans-serif; text-anchor: middle; }
          </style>
        </defs>
        <rect width="100%" height="100%" class="bg"/>
        <text x="50%" y="48%" class="welcome">Welcome</text>
        <text x="50%" y="70%" class="username">${userName}</text>
      </svg>
    `;

    await sharp(Buffer.from(fallbackSvg))
      .png()
      .toFile(outputPath);

    return outputPath;
  }
}

/**
 * Downloads an image from a URL and returns a Buffer.
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

/**
 * Generates a 2x2 collage from 4 image URLs. Returns a Buffer of the final image.
 */
export async function generateProductCollage(imageUrls: string[]): Promise<Buffer> {
  if (!Array.isArray(imageUrls) || imageUrls.length < 4) {
    throw new Error('At least 4 image URLs are required');
  }
  // Download the first 4 images
  const images = await Promise.all(imageUrls.slice(0, 4).map(downloadImage));
  // Resize all images to 400x400
  const resized = await Promise.all(images.map(img => sharp(img).resize(400, 400).toBuffer()));
  // Compose the collage (2x2 grid)
  const collage = await sharp({
    create: {
      width: 800,
      height: 800,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
    .composite([
      { input: resized[0], top: 0, left: 0 },
      { input: resized[1], top: 0, left: 400 },
      { input: resized[2], top: 400, left: 0 },
      { input: resized[3], top: 400, left: 400 }
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
  return collage;
} 