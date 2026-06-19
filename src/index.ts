import type { PluginModule } from "@opencode-ai/plugin";
import { makeTool } from "./tool.js";

const plugin: PluginModule = {
  id: "visual-ingest",
  server: async (_input, options) => ({
    tool: {
      read_visual: makeTool(options),
    },
  }),
};

export default plugin;
