import { readFile } from "node:fs/promises";
import sharp from "sharp";
export async function loadImage(imagePath, config) {
    const data = await readFile(imagePath);
    const metadata = await sharp(data).metadata();
    const longest = Math.max(metadata.width, metadata.height);
    if (longest <= config.max_dim) {
        return {
            imageBuffer: data,
            width: metadata.width,
            height: metadata.height,
        };
    }
    const scale = config.max_dim / longest;
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
