export interface Meta {
    source_path: string;
    source_mtime: number;
    page_count: number;
    model: string;
    endpoint: string;
    rendered_at: number;
    question: string | undefined;
    status: "ok" | "partial" | "failed";
}
export interface StoredPage {
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
export declare function ensureDir(dir: string): Promise<void>;
export declare function writeMeta(dir: string, meta: Meta): Promise<void>;
export declare function readMeta(dir: string): Promise<Meta | null>;
export declare function shouldReuse(meta: Meta | null, sourcePath: string, sourceMtime: number, question: string | undefined): boolean;
export declare function getSourceMtime(path: string): Promise<number>;
export declare function writeImage(dir: string, pageNum: number, imageBuffer: Buffer, ext?: string): Promise<void>;
export declare function writePage(dir: string, pageNum: number, data: StoredPage): Promise<void>;
export declare function readPage(dir: string, pageNum: number): Promise<StoredPage | null>;
export declare function getDocDir(projectDir: string, slug: string): string;
