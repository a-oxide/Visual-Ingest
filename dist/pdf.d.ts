import type { Config } from "./config.js";
import type { PageClass } from "./merge.js";
export interface RenderedPage {
    pageNum: number;
    imageBuffer: Buffer;
    embeddedText: string;
    pageClass: PageClass;
    width: number;
    height: number;
}
export declare function classifyPage(textChars: number, textDensity: number): PageClass;
export declare function renderPdf(pdfPath: string, pageNumbers: number[], config: Config): Promise<RenderedPage[]>;
export declare function getPdfPageCount(pdfPath: string): Promise<number>;
