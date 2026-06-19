import type { Config } from "./config.js";
export interface LoadedImage {
    imageBuffer: Buffer;
    width: number;
    height: number;
}
export declare function loadImage(imagePath: string, config: Config): Promise<LoadedImage>;
