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