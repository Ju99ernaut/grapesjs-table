import type { Plugin } from "grapesjs";
import type { PluginOptions, RequiredPluginOptions } from "./types";
import { commands } from "./commands";
import { components } from "./components";
import { blocks } from "./blocks";
import { styles } from "./styles";

const plugin: Plugin<PluginOptions> = (editor, opt = {}) => {
  const opts: RequiredPluginOptions = {
    id: "table",
    block: {},
    label: "Table",
    category: "Basic",
    ...opt,
  };

  commands(editor, opts);
  styles(editor, opts);
  components(editor, opts);
  blocks(editor, opts);
};

export default plugin;
