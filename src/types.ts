import type { BlockProperties } from "grapesjs";

export type PluginOptions = {
  id?: string;
  label?: string;
  category?: string;
  block?: Partial<BlockProperties>;
};

export type RequiredPluginOptions = Required<PluginOptions>

export type TableSection = "header" | "body";