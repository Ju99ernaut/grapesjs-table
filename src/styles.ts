import type { Plugin } from "grapesjs";
import { PluginOptions } from "./types";
import { BODY_SELECTOR, HEADER_SELECTOR } from "./consts";

export const tableCss = `.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid black;
}
.table-cell {
  border: 1px solid black;
  padding: 8px;
}
.table-header-cell {
  border: 1px solid black;
  padding: 8px;
  font-weight: bold;
  text-align: left;
}
.table-row-zebra:nth-child(2n) .table-cell {
  background-color: inherit;
  color: inherit;
}
`;

export const styles: Plugin<PluginOptions> = (editor) => {
  const privateCls = [
    ".table",
    HEADER_SELECTOR,
    BODY_SELECTOR,
    ".table-no-vertical",
    ".table-no-horizontal",
    ".table-zebra-row",
  ];
  editor.on(
    "selector:add",
    (selector) =>
      privateCls.indexOf(selector.getFullName()) >= 0 &&
      selector.set("private", true),
  );
};
