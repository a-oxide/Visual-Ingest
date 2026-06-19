# Visual-Ingest

An opencode plugin that gives opencode-go models visual understanding of PDFs and image files.

## What it does

Registers a `read_visual` tool that:

- Renders each PDF page to an image (pdfjs-dist + @napi-rs/canvas)
- Extracts embedded text per page and classifies it (text-rich / mixed / image-only)
- Runs the MiMo-V2.5 Free vision model on every page via the keyless OpenCode Zen endpoint
- Merges vision output (full transcription + visual description) with embedded text
- Stores rendered images + per-page JSON in `.opencode/visual-ingest/<doc-slug>/`
- Returns combined content into chat under a 128k token budget

Also handles standalone image files (.png, .jpg, .jpeg, .webp, .gif).

## Install

Add to your `opencode.json`:

```json
{
  "plugin": [
    ["visual-ingest@git+https://github.com/a-oxide/Visual-Ingest.git", {}]
  ]
}
```

No API key needed — uses the free OpenCode Zen endpoint.

## Config

All options are optional:

```json
["visual-ingest@git+https://github.com/a-oxide/Visual-Ingest.git", {
  "model": "mimo-v2.5-free",
  "endpoint": "https://opencode.ai/zen/v1/chat/completions",
  "concurrency": 4,
  "token_budget": 128000,
  "min_dim": 768,
  "max_dim": 3072,
  "max_tokens_per_call": 2048,
  "image_extensions": [".png", ".jpg", ".jpeg", ".webp", ".gif"]
}]
```

## Usage

The LLM calls `read_visual` automatically when you ask about a PDF or image. You can also prompt it directly:

> "Read the PDF at /path/to/file.pdf and tell me what's on page 3"

The tool accepts:

- `path` (required): path to PDF or image
- `pages` (optional): `"1-10"`, `"3,7,12"`, `"5-"` — PDF only
- `question` (optional): focus question for the vision model
- `max_tokens_budget` (optional): cap on returned content (default 128000)

## How it works

For each page in the PDF (or a single image file):

1. **Render** to PNG via pdfjs-dist at a scale that fits the longest side in [768, 3072] px
2. **Extract** embedded text via pdfjs `getTextContent()`
3. **Classify** the page: text-rich (≥500 chars + high density), image-only (<50 chars), or mixed
4. **Vision call** (always) with a class-specific structured prompt that asks for full transcription + visual description
5. **Merge** vision output with embedded text per the page class (text-rich uses embedded as authoritative body, vision adds visuals + extras; image-only uses vision as sole source)
6. **Store** image + JSON in `.opencode/visual-ingest/<doc-slug>/`

Vision calls run concurrently (default 4 at a time) with retry on 429/5xx errors.

Results are returned into chat under the token budget. If content exceeds the budget, the tool returns a per-page index + the first batch that fits + a follow-up note telling you to call `read_visual` again with a narrower page range.

## Development

```bash
npm install
npm test                          # run unit + integration tests
npm run build                     # compile TypeScript to dist/
VISUAL_INGEST_SMOKE=1 npm test    # live zen endpoint test (included in the suite)
```

## Privacy

MiMo-V2.5 Free may use submitted data for model improvement during its free period. Do not ingest confidential documents.

## License

MIT
