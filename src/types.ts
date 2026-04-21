import type {
  BlockProperties,
  AddComponentTypeOptions,
  ComponentDefinition,
} from "grapesjs";

export type PluginOptions = {
  id?: string;
  label?: string;
  category?: string;
  block?: Partial<BlockProperties>;
  cellModel?: Partial<AddComponentTypeOptions["model"]>;
  tableModel?: Partial<AddComponentTypeOptions["model"]>;
  cellDefaults?: ComponentDefinition;
  tableDefaults?: ComponentDefinition;
};

export type RequiredPluginOptions = Required<PluginOptions>;

export type TableSection = "header" | "body";
