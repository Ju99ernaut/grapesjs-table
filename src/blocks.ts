import type { Plugin } from "grapesjs";
import { PluginOptions } from "./types";

export const blocks: Plugin<PluginOptions> = (editor, opts = {}) => {
  const bm = editor.BlockManager;

  bm.add("table", {
    label: opts.label!,
    category: opts.category!,
    content: { type: "table" },
  });
};
