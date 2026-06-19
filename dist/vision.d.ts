import type { Config } from "./config.js";
import type { PageClass, VisionResult } from "./merge.js";
export declare function buildPrompt(pageClass: PageClass, embeddedText: string | null, question: string | undefined): {
    text: string;
};
export declare function parseVisionResponse(content: string, hasExtraTextSection: boolean): VisionResult;
export declare function callVision(config: Config, imageBase64: string, pageClass: PageClass, embeddedText: string | null, question?: string): Promise<VisionResult>;
