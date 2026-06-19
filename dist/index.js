import { makeTool } from "./tool.js";
const plugin = {
    id: "visual-ingest",
    server: async (_input, options) => ({
        tool: {
            read_visual: makeTool(options),
        },
    }),
};
export default plugin;
