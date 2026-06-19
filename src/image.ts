import { readFile } from "node:fs/promises";
import sharp from "sharp";
import type { Config } from "./config.js";

export interface LoadedImage {
  imageBuffer: Buffer;
  width: number;
  height: number;
}

export async function loadImage(
  imagePath: string,
  config: Config,
): Promise<LoadedImage> {
  const data = await readFile(imagePath);
  const metadata = await sharp(data).metadata();

  const longest = Math.max(metadata.width, metadata.height);
  const scale = computeScale(longest, config.min_dim, config.max_dim);

  if (scale === 1) {
    return {
      imageBuffer: data,
      width: metadata.width,
      height: metadata.height,
    };
  }

  const newWidth = Math.round(metadata.width * scale);
  const newHeight = Math.round(metadata.height * scale);

  const scaled = await sharp(data)
    .resize(newWidth, newHeight, { fit: "fill" })
    .png()
    .toBuffer();

  return {
    imageBuffer: scaled,
    width: newWidth,
    height: newHeight,
  };
}

function computeScale(longest: number, minDim: number, maxDim: number): number {
  if (longest >= maxDim) return maxDim / longest;
  if (longest < minDim) return minDim / longest;
  return 1;
}
