import type { Plugin } from "grapesjs";
import type { PluginOptions } from "./types";
import { commands } from "./commands";
import { components } from "./components";
import { blocks } from "./blocks";
import { styles } from "./styles";

const plugin: Plugin<PluginOptions> = (editor, opt = {}) => {
  const opts: PluginOptions = {
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
