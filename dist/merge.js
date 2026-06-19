export function mergePage(pageClass, embeddedText, vision) {
    if (vision.vision_status !== "ok") {
        if (embeddedText) {
            return embeddedText + "\n\n[vision failed — visual description unavailable]";
        }
        return "[vision failed — no text could be extracted; image stored for manual review]";
    }
    switch (pageClass) {
        case "image-only":
        case "image":
            return (vision.full_transcription +
                "\n\n## Visual description\n" +
                vision.visual_description);
        case "text-rich":
            return (embeddedText +
                "\n\n## Visual description\n" +
                vision.visual_description +
                "\n\n## Text not in embedded layer\n" +
                (vision.extra_text || "None"));
        case "mixed":
            return (embeddedText +
                "\n\n## Image-region content\n" +
                (vision.extra_text || "None") +
                "\n\n## Visual description\n" +
                vision.visual_description);
    }
}
