# Visual-Ingest Plugin

## Architecture

- **tool.ts** — `read_visual` tool definition, arg parsing (zod), path resolution, dispatch, budget truncation, result formatting
- **pipeline.ts** — Orchestrates per-file processing (PDF vs image), concurrency-limited vision calls, mtime-based reuse, meta.json writes
- **pdf.ts** — pdfjs-dist rendering + embedded text extraction + page classification (text-rich/mixed/image-only)
- **image.ts** — sharp-based image loading and downscaling
- **vision.ts** — OpenCode Zen endpoint client with class-specific structured prompts, response parsing, retry (3 attempts, exponential backoff on 429/5xx)
- **merge.ts** — Per-class merge/dedup of embedded text + vision output, with graceful failure fallback
- **store.ts** — Storage layout (meta.json, page-NNN.png, page-NNN.json), shouldReuse check
- **config.ts** — Plugin options parsing with defaults (free MiMo-V2.5 via keyless zen endpoint)
- **pages.ts** — Page range parser ("1-10", "3,7,12", "5-") with validation and clamping
- **budget.ts** — Token estimation and truncation with follow-up mechanism
- **slug.ts** — Document slug generation (sanitized name + path hash)

## Key Design Decisions

- Vision runs on EVERY page, even text-rich ones — ensures logos, rendered LaTeX, and image-embedded text are never missed
- Class-dependent structured prompts: 3 sections (Full transcription / Visual description / Text not in embedded layer) for text-rich/mixed, 2 sections for image-only/image
- One vision call per page with concurrency limit (default 4)
- Reuse stored output when source file mtime is unchanged
- `dist/` is committed to git (pre-built, like superpowers)
- The `@opencode-ai/plugin` SDK bundles zod v4; the project uses zod v3 but accesses the plugin's v4 via `tool.schema` to avoid type conflicts

## Testing

```bash
npm test                          # 57 unit + integration tests
VISUAL_INGEST_SMOKE=1 npm test    # also run the live zen endpoint test
```

Tests use mocked `global.fetch` for the vision client. The store and pipeline modules have integration tests with real file I/O and sharp-generated synthetic images. The live smoke test sends a tiny PNG to the real zen endpoint.

## Building

```bash
npm run build    # tsc → dist/ (24 files, .js + .d.ts)
```

The `dist/` directory must be committed — opencode loads pre-built plugins from git URLs.
