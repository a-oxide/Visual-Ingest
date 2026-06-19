import { tool, type ToolDefinition } from "@opencode-ai/plugin";
import { resolve, isAbsolute } from "node:path";
import { existsSync } from "node:fs";
import { parseConfig } from "./config.js";
import { processFile, type ProcessResult } from "./pipeline.js";
import { truncateToBudget, type PageResult } from "./budget.js";
import { makeSlug } from "./slug.js";

const z = tool.schema;

export function buildToolResult(
  results: ProcessResult[],
  budget: number,
  docSlug: string,
  sourcePath: string,
): string {
  const pageResults: PageResult[] = results.map((r) => ({
    page: r.page,
    class: r.class,
    charCount: r.charCount,
    merged: r.merged,
    visionStatus: r.vision_status,
  }));

  const { content, truncated } = truncateToBudget(pageResults, budget, docSlug);

  const header = `read_visual: ${sourcePath} (${results.length} page${results.length !== 1 ? "s" : ""})\n\n`;
  return header + content;
}

export function makeTool(options: Record<string, unknown> | undefined): ToolDefinition {
  const config = parseConfig(options);

  return tool({
    description:
      "Read a PDF or image file by rendering each page to an image and processing it with a vision model. " +
      "Returns full text transcription and visual description for each page. " +
      "Use this instead of the native read tool for PDFs and images — it enables visual understanding on models that don't accept image inputs. " +
      "Supports .pdf, .png, .jpg, .jpeg, .webp, .gif files.",
    args: {
      path: z.string().describe("Path to the PDF or image file (absolute or relative to project root)"),
      pages: z.string().optional().describe("PDF only: page range like '1-10', '3,7,12', '5-'. Default: all pages"),
      question: z.string().optional().describe("Focus question — the vision model will prioritize relevant content"),
      max_tokens_budget: z.number().optional().describe("Max tokens of content to return. Default: 128000"),
    },
    async execute(args, context) {
      const fullPath = isAbsolute(args.path)
        ? args.path
        : resolve(context.directory, args.path);

      if (!existsSync(fullPath)) {
        return `read_visual: file not found: ${fullPath}`;
      }

      const budget = args.max_tokens_budget ?? config.token_budget;

      try {
        const results = await processFile(fullPath, {
          config,
          projectDir: context.directory,
          pages: args.pages,
          question: args.question,
        });

        context.metadata({
          title: `read_visual: ${fullPath.split("/").pop()} (${results.length} pages)`,
          metadata: {
            path: fullPath,
            visionFailures: results.filter((r) => r.vision_status !== "ok").length,
          },
        });

        const slug = makeSlug(fullPath);

        return buildToolResult(results, budget, slug, fullPath);
      } catch (err) {
        return `read_visual: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}
