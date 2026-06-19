export type PageClass = "text-rich" | "image-only" | "mixed" | "image";
export interface VisionResult {
    full_transcription: string;
    visual_description: string;
    extra_text: string | null;
    vision_status: "ok" | "malformed" | "failed";
}
export declare function mergePage(pageClass: PageClass, embeddedText: string | null, vision: VisionResult): string;
