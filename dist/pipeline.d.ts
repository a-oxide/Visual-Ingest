import type { Config } from "./config.js";
export interface ProcessOptions {
    config: Config;
    projectDir: string;
    pages?: string;
    question?: string;
}
export interface ProcessResult {
    page: number;
    class: string;
    charCount: number;
    embedded_text: string | null;
    full_transcription: string;
    visual_description: string;
    extra_text: string | null;
    merged: string;
    vision_status: string;
}
export declare function processFile(filePath: string, opts: ProcessOptions): Promise<ProcessResult[]>;
