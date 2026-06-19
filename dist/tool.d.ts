import { type ToolDefinition } from "@opencode-ai/plugin";
import { type ProcessResult } from "./pipeline.js";
export declare function buildToolResult(results: ProcessResult[], budget: number, docSlug: string, sourcePath: string): string;
export declare function makeTool(options: Record<string, unknown> | undefined): ToolDefinition;
