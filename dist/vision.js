export function buildPrompt(pageClass, embeddedText, question) {
    let prompt = "";
    if (question) {
        prompt += `The user is trying to answer: '${question}'. Prioritize and flag the most relevant content, but still transcribe and describe the whole page.\n\n`;
    }
    const hasEmbedded = pageClass === "text-rich" || pageClass === "mixed";
    if (hasEmbedded) {
        prompt += `You are processing one page of a document. Transcribe ALL text visible on this page — body, headers, captions, text inside figures/diagrams, logos, rendered LaTeX/math — AND describe all visual elements (figures, diagrams, charts, tables, layout). Respond as markdown with EXACTLY these top-level sections in this order:

## Full transcription
<every word of text you can see on the page, in reading order>

## Visual description
<description of every figure, diagram, chart, table, and the overall layout>

## Text not in embedded layer
<any text you see that is NOT in the embedded text layer provided below; if none, write 'None'.>

Embedded text layer for this page (use to verify, and to identify text NOT in it):
${embeddedText}`;
    }
    else {
        const isStandaloneImage = pageClass === "image";
        prompt += `You are processing ${isStandaloneImage ? "an image" : "one page of a document that has no embedded text layer (it is rendered as an image, e.g. a scan or poster)"}. Transcribe ALL text visible ${isStandaloneImage ? "in this image (including text in logos, diagrams, overlays, form fields)" : "on this page — body, headers, captions, text inside figures/diagrams, logos, rendered LaTeX/math"} — AND describe all visual elements. Respond as markdown with EXACTLY these top-level sections in this order:

## Full transcription
<every word of text you can see, in reading order>

## Visual description
<description of every visual element and the overall layout>`;
    }
    return { text: prompt };
}
export function parseVisionResponse(content, hasExtraTextSection) {
    const parseSection = (text, heading) => {
        const regex = new RegExp(`^##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "m");
        const match = text.match(regex);
        return match ? match[1].trim() : "";
    };
    const full_transcription = parseSection(content, "Full transcription");
    const visual_description = parseSection(content, "Visual description");
    const extra_text = hasExtraTextSection
        ? parseSection(content, "Text not in embedded layer")
        : null;
    const missing = !full_transcription || !visual_description;
    return {
        full_transcription,
        visual_description,
        extra_text,
        vision_status: missing ? "malformed" : "ok",
    };
}
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function callVision(config, imageBase64, pageClass, embeddedText, question) {
    const { text: promptText } = buildPrompt(pageClass, embeddedText, question);
    const hasExtra = pageClass === "text-rich" || pageClass === "mixed";
    const body = {
        model: config.model,
        max_tokens: config.max_tokens_per_call,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: promptText },
                    {
                        type: "image_url",
                        image_url: { url: `data:image/png;base64,${imageBase64}` },
                    },
                ],
            },
        ],
    };
    const headers = {
        "Content-Type": "application/json",
    };
    if (config.api_key) {
        headers["Authorization"] = `Bearer ${config.api_key}`;
    }
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
            await sleep(1000 * Math.pow(2, attempt - 1) + Math.random() * 500);
        }
        try {
            const resp = await fetch(config.endpoint, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            });
            if (resp.status === 429 || resp.status >= 500) {
                continue;
            }
            if (!resp.ok) {
                return {
                    full_transcription: "",
                    visual_description: "",
                    extra_text: null,
                    vision_status: "failed",
                };
            }
            const data = await resp.json();
            const content = data.choices?.[0]?.message?.content ?? "";
            if (!content) {
                return {
                    full_transcription: "",
                    visual_description: "",
                    extra_text: null,
                    vision_status: "failed",
                };
            }
            return parseVisionResponse(content, hasExtra);
        }
        catch {
            continue;
        }
    }
    return {
        full_transcription: "",
        visual_description: "",
        extra_text: null,
        vision_status: "failed",
    };
}
