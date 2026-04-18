import type { Plugin } from "grapesjs";
import { PluginOptions } from "./types";
import {
  ensureSection,
  getActiveTable,
  getColumnCount,
  makeRow,
  mergeCellsSameRowSequential,
  normalizeAllColumns,
  splitCellByColspan,
} from "./utils";

export const commands: Plugin<PluginOptions> = (editor) => {
  const cmd = editor.Commands;

  cmd.add("table:insert-row-before", {
    run() {
      const table = getActiveTable(editor);
      if (!table) return;

      const tbody = ensureSection(table, "tbody");
      const at = editor.getSelected()?.parent()?.index() ?? 0;
      const columns = Math.max(1, getColumnCount(table));
      tbody.append(makeRow("body", columns), { at });
      editor.refresh();
    },
  });

  cmd.add("table:insert-row-after", {
    run() {
      const table = getActiveTable(editor);
      if (!table) return;

      const tbody = ensureSection(table, "tbody");
      const at =
        editor.getSelected()?.parent()?.index() ??
        tbody.components().length - 1;
      const columns = Math.max(1, getColumnCount(table));
      tbody.append(makeRow("body", columns), { at: at + 1 });
      editor.refresh();
    },
  });

  cmd.add("table:remove-row", {
    run() {
      const table = getActiveTable(editor);
      if (!table) return;

      const tbody = ensureSection(table, "tbody");
      const rows = tbody.components();
      if (rows.length <= 1) return;
      const at = editor.getSelected()?.parent()?.index() ?? rows.length - 1;
      rows.at(at)?.remove();
      editor.refresh();
    },
  });

  cmd.add("table:merge-split-columns", {
    run() {
      const selectedAll = editor.getSelectedAll();

      if (!selectedAll.length) return;

      if (selectedAll.length === 1) {
        splitCellByColspan(selectedAll[0]);
        return;
      }

      mergeCellsSameRowSequential(selectedAll);
      editor.refresh();
    },
  });

  cmd.add("table:insert-column-before", {
    run() {
      const table = getActiveTable(editor);
      if (!table) return;

      const at = editor.getSelected()?.index() ?? 0;
      const cols = Math.max(1, getColumnCount(table)) + 1;
      normalizeAllColumns(table, cols, at);
      editor.refresh();
    },
  });

  cmd.add("table:insert-column-after", {
    run() {
      const table = getActiveTable(editor);
      if (!table) return;

      const tr = editor.getSelected()?.parent();
      const at =
        editor.getSelected()?.index() ?? (tr?.components().length || 1) - 1;
      const cols = Math.max(1, getColumnCount(table)) + 1;
      normalizeAllColumns(table, cols, at + 1);
      editor.refresh();
    },
  });

  cmd.add("table:remove-column", {
    run() {
      const table = getActiveTable(editor);
      if (!table) return;

      const tr = editor.getSelected()?.parent();
      const at =
        editor.getSelected()?.index() ?? (tr?.components().length || 1) - 1;
      const cols = Math.max(1, getColumnCount(table)) - 1;
      if (cols < 1) return;
      normalizeAllColumns(table, cols, at);
      editor.refresh();
    },
  });

  cmd.add("table:toggle-header", {
    run() {
      const table = getActiveTable(editor);
      if (!table) return;
      table.set("header", !table.get("header"));
      editor.refresh();
    },
  });

  cmd.add("table:toggle-footer", {
    run() {
      const table = getActiveTable(editor);
      if (!table) return;
      table.set("footer", !table.get("footer"));
      editor.refresh();
    },
  });
};
