import type { Component, Editor } from "grapesjs";
import { TableSection } from "./types";
import { BODY_SELECTOR, HEADER_SELECTOR, ZEBRA_SELECTOR } from "./consts";
import { changePropTraitNames } from "./traits";

export function ensureSection(
  table: Component,
  tag: "thead" | "tbody" | "tfoot",
) {
  let section =
    table.findFirstType(tag) || table.findFirstType(`data-collection-${tag}`);
  if (!section) {
    const toInsertAt =
      tag === "thead"
        ? 0
        : tag === "tbody"
          ? table.findFirstType("thead")
            ? 1
            : 0
          : table.components().length;

    section = table.append(
      {
        type: tag,
        components: [makeRow(tag === "thead" ? "head" : "body", 1)],
      },
      { at: toInsertAt },
    )[0];
  }
  return section;
}

export function getRowCount(table: Component) {
  const tbody = ensureSection(table, "tbody");
  return tbody.components().length;
}

export function getColumnCount(table: Component) {
  const tbody = ensureSection(table, "tbody");
  const firstRow = tbody.components().at(0);
  if (!firstRow) return 0;
  return firstRow.components().length;
}

export function makeCell(tag: "td" | "th") {
  return {
    type: "cell",
    tagName: tag,
    components: [
      {
        type: "text",
        content: "Edit text",
      },
    ],
    ...(tag === "th"
      ? {
          attributes: {
            class: "table-header-cell",
          },
        }
      : {}),
  };
}

export function makeRow(kind: "head" | "body" | "foot", cols: number) {
  const cellTag = kind === "head" ? "th" : "td";
  return {
    type: "tr",
    components: Array.from({ length: cols }).map(() => makeCell(cellTag)),
  };
}

export function makeCollectionRow(cols: number) {
  return {
    type: "data-collection-tr",
    components: Array.from({ length: cols }).map(() => makeCell("td")),
  };
}

export function normalizeColumnsInSection(
  section: Component,
  desiredCols: number,
  at?: number,
) {
  const rows = section.components();
  rows.forEach((row) => {
    const cells = row.components();
    const current = cells.length;

    if (current < desiredCols) {
      const kind =
        section.get("tagName")?.toLowerCase() === "thead" ? "head" : "body";
      const tag = kind === "head" ? "th" : "td";
      for (let i = current; i < desiredCols; i++)
        row.append(makeCell(tag), { at });
    } else if (current > desiredCols) {
      for (let i = current - 1; i >= desiredCols; i--)
        cells.at(at || i)?.remove();
    }
  });
}

export function normalizeAllColumns(
  table: Component,
  desiredCols: number,
  at?: number,
) {
  const thead = table.findFirstType("thead");
  const tbody = ensureSection(table, "tbody");
  const tfoot = table.findFirstType("tfoot");
  if (thead) normalizeColumnsInSection(thead, desiredCols, at);
  normalizeColumnsInSection(tbody, desiredCols, at);
  if (tfoot) normalizeColumnsInSection(tfoot, desiredCols, at);
}

export function ensureBodyRows(table: Component, rows: number, cols: number) {
  const tbody = ensureSection(table, "tbody");
  const current = tbody.components().length;

  if (current < rows) {
    for (let i = current; i < rows; i++) tbody.append(makeRow("body", cols));
  } else if (current > rows) {
    for (let i = current - 1; i >= rows; i--)
      tbody.components().at(i)?.remove();
  }
}

export function ensureHeader(table: Component, cols: number) {
  const thead = ensureSection(table, "thead");
  if (thead.components().length === 0) thead.append(makeRow("head", cols));
  normalizeColumnsInSection(thead, cols);
}

export function ensureFooter(table: Component, cols: number) {
  const tfoot = ensureSection(table, "tfoot");
  if (tfoot.components().length === 0) tfoot.append(makeRow("foot", cols));
  normalizeColumnsInSection(tfoot, cols);
}

export function getActiveTable(editor: Editor) {
  let current = editor.getSelected();
  if (!current) return null;

  while (current) {
    if (current.getType() === "table") {
      return current;
    }
    current = current.parent();
  }

  return null;
}

function getColspan(cell: Component) {
  const attrs = cell.getAttrToHTML();
  return Number(attrs.colspan ?? 1);
}

function setColspan(cell: Component, colspan: number) {
  cell.addAttributes({ colspan });
}

function areSequentialIndexes(indexes: number[]) {
  const sorted = [...indexes].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) return false;
  }
  return true;
}

export function cloneComponent(component: Component) {
  const clonedComponent = JSON.parse(JSON.stringify(component));
  const componentStyle = component.getStyle();
  clonedComponent.style = componentStyle;

  if (clonedComponent.attributes?.id) delete clonedComponent.attributes.id;
  return clonedComponent;
}

export function mergeCellsSameRowSequential(cells: Component[]) {
  const rows = cells.map((cell) => cell.parent()?.getId()).filter(Boolean);
  const indexes = cells.map((cell) => cell.index());

  if (new Set(rows).size !== 1 || !areSequentialIndexes(indexes)) return;

  const master = cells[0];

  const totalColspan = cells.reduce((sum, cell) => sum + getColspan(cell), 0);
  setColspan(master, totalColspan);

  for (let i = 1; i < cells.length; i++) {
    const cell = cells[i];

    const childComps = cell.components();
    childComps.forEach((component) => {
      master.append(cloneComponent(component));
    });
  }

  for (let i = 1; i < cells.length; i++) {
    cells[i].remove();
  }
}

export function splitCellByColspan(cell: Component) {
  const row = cell.parent();
  if (!row) return;

  const colspan = getColspan(cell);
  if (colspan <= 1) return;

  setColspan(cell, 1);

  const insertAt = cell.index() + 1;
  for (let i = 0; i < colspan - 1; i++) {
    row.append(makeCell(cell.tagName as "td"), { at: insertAt + i });
  }
}

function styleToCss(style: Record<string, unknown>) {
  return Object.entries(style)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([property, value]) => `${property}: ${String(value)};`)
    .join(" ");
}

function setStyle(
  selector: string,
  style: Record<string, unknown>,
  editor: Editor,
) {
  const rule = editor.CssComposer.getRule(selector);

  if (rule) {
    rule.addStyle(style);
    return;
  }

  editor.CssComposer.addRules(`${selector} { ${styleToCss(style)} }`);
  const newRule = editor.CssComposer.getRule(selector);
  newRule?.addStyle(style);
}

export function getStyleValue(
  selector: string,
  property: string,
  editor: Editor,
): unknown {
  const rule = editor.CssComposer.getRule(selector);
  const ruleStyle = rule?.getStyle() ?? {};
  return ruleStyle[property];
}

export const isBorderEnabled = (
  selector: string,
  direction: "vertical" | "horizontal",
  editor: Editor,
) => {
  if (direction === "vertical") {
    const left = getStyleValue(selector, "border-left-style", editor);
    const right = getStyleValue(selector, "border-right-style", editor);
    return left !== "none" || right !== "none";
  }

  const top = getStyleValue(selector, "border-top-style", editor);
  const bottom = getStyleValue(selector, "border-bottom-style", editor);
  return top !== "none" || bottom !== "none";
};

function toTraitNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function getCurrentTable(editor: Editor) {
  const selected = editor.getSelected();
  const isSelectedTable = selected?.getType() === "table";
  return isSelectedTable ? selected : selected?.closestType("table");
}

function getBorderWidth(editor: Editor) {
  const table = getCurrentTable(editor);
  const tableEl = table?.getEl();

  const defaultBorderWidth = tableEl
    ? // @ts-expect-error Index BS
      getComputedStyle(tableEl)["border-width"]
    : undefined;

  return (
    defaultBorderWidth
      .split(" ")
      .find((value: string) => value && !value.startsWith("0")) || "1px"
  );
}

function getBorderColor(editor: Editor) {
  const table = getCurrentTable(editor);
  const tableEl = table?.getEl();

  const defaultBorderColor = tableEl
    ? // @ts-expect-error Index BS
      getComputedStyle(tableEl)["border-color"]
    : undefined;

  return (
    defaultBorderColor
      .split(" ")
      .find((value: string) => value && value !== "transparent") || "black"
  );
}

function getBorderStyle(editor: Editor) {
  const table = getCurrentTable(editor);
  const tableEl = table?.getEl();

  const defaultBorderStyle = tableEl
    ? // @ts-expect-error Index BS
      getComputedStyle(tableEl)["border-style"]
    : undefined;

  return (
    defaultBorderStyle.find((value: string) => value && value !== "none") ||
    "solid"
  );
}

function getSectionTraitStyle(
  section: TableSection,
  traitName: string,
  value: unknown,
  editor: Editor,
): Record<string, unknown> | null {
  switch (traitName) {
    case `${section}-background`:
      return { "background-color": value };

    case `${section}-color`:
      return { color: value };

    case `${section}-font-size`:
      return { "font-size": `${value}px` };

    case `${section}-vertical-borders`:
      return value === "1"
        ? {
            "border-left-style": getBorderStyle(editor),
            "border-right-style": getBorderStyle(editor),
            "border-left-width": getBorderWidth(editor),
            "border-right-width": getBorderWidth(editor),
            "border-left-color": getBorderColor(editor),
            "border-right-color": getBorderColor(editor),
          }
        : {
            "border-left-style": "none",
            "border-right-style": "none",
          };

    case `${section}-horizontal-borders`:
      return value === "1"
        ? {
            "border-top-style": getBorderStyle(editor),
            "border-bottom-style": getBorderStyle(editor),
            "border-top-width": getBorderWidth(editor),
            "border-bottom-width": getBorderWidth(editor),
            "border-top-color": getBorderColor(editor),
            "border-bottom-color": getBorderColor(editor),
          }
        : {
            "border-top-style": "none",
            "border-bottom-style": "none",
          };

    case `${section}-zebra-background`:
      if (section !== "body") return null;
      return { "background-color": value };

    case `${section}-zebra-color`:
      if (section !== "body") return null;
      return { color: value };

    default:
      return null;
  }
}

function getSelectorPrefix(editor: Editor) {
  const table = getCurrentTable(editor);
  const tableId = table?.getId();
  return tableId ? `#${tableId} ` : "";
}

function syncSectionTraitToCss(
  section: TableSection,
  traitName: string,
  value: unknown,
  editor: Editor,
) {
  const selectorPrefix = getSelectorPrefix(editor);
  const selector = traitName.includes("zebra")
    ? ZEBRA_SELECTOR
    : section === "header"
      ? HEADER_SELECTOR
      : BODY_SELECTOR;

  const style = getSectionTraitStyle(section, traitName, value, editor);
  if (!style) return;

  setStyle(`${selectorPrefix}${selector}`, style, editor);
}

function syncVerticalAlignToCss(value: unknown, editor: Editor) {
  const selectorPrefix = getSelectorPrefix(editor);
  setStyle(
    `${selectorPrefix}${HEADER_SELECTOR}`,
    { "vertical-align": value },
    editor,
  );
  setStyle(
    `${selectorPrefix}${BODY_SELECTOR}`,
    { "vertical-align": value },
    editor,
  );
}

function getSectionTraitValueFromCss(
  section: TableSection,
  traitName: string,
  editor: Editor,
) {
  const selectorPrefix = getSelectorPrefix(editor);
  const selector = section === "header" ? HEADER_SELECTOR : BODY_SELECTOR;
  const prefixedSelector = `${selectorPrefix}${selector}`;

  switch (traitName) {
    case `${section}-background`:
      return (
        getStyleValue(prefixedSelector, "background-color", editor) ??
        getStyleValue(selector, "background-color", editor)
      );

    case `${section}-color`:
      return (
        getStyleValue(prefixedSelector, "color", editor) ??
        getStyleValue(selector, "color", editor)
      );

    case `${section}-font-size`:
      return (
        toTraitNumber(getStyleValue(prefixedSelector, "font-size", editor)) ??
        toTraitNumber(getStyleValue(selector, "font-size", editor))
      );

    case `${section}-vertical-borders`: {
      const left =
        getStyleValue(prefixedSelector, "border-left-style", editor) ??
        getStyleValue(selector, "border-left-style", editor);
      const right =
        getStyleValue(prefixedSelector, "border-right-style", editor) ??
        getStyleValue(selector, "border-right-style", editor);
      return left === "none" && right === "none" ? "0" : "1";
    }

    case `${section}-horizontal-borders`: {
      const top =
        getStyleValue(prefixedSelector, "border-top-style", editor) ??
        getStyleValue(selector, "border-top-style", editor);
      const bottom =
        getStyleValue(prefixedSelector, "border-bottom-style", editor) ??
        getStyleValue(selector, "border-bottom-style", editor);
      return top === "none" && bottom === "none" ? "0" : "1";
    }

    case "body-zebra-background":
      return (
        getStyleValue(
          `${selectorPrefix}${ZEBRA_SELECTOR}`,
          "background-color",
          editor,
        ) ?? getStyleValue(ZEBRA_SELECTOR, "background-color", editor)
      );

    case "body-zebra-color":
      return (
        getStyleValue(`${selectorPrefix}${ZEBRA_SELECTOR}`, "color", editor) ??
        getStyleValue(ZEBRA_SELECTOR, "color", editor)
      );

    default:
      return undefined;
  }
}

function getVerticalAlignFromCss(editor: Editor) {
  const selectorPrefix = getSelectorPrefix(editor);
  return (
    getStyleValue(
      `${selectorPrefix}${HEADER_SELECTOR}`,
      "vertical-align",
      editor,
    ) ??
    getStyleValue(
      `${selectorPrefix}${BODY_SELECTOR}`,
      "vertical-align",
      editor,
    ) ??
    getStyleValue(HEADER_SELECTOR, "vertical-align", editor) ??
    getStyleValue(BODY_SELECTOR, "vertical-align", editor) ??
    "top"
  );
}

export function syncTableTraitToCss(
  traitName: string,
  value: unknown,
  editor: Editor,
) {
  if (traitName === "cell-vertical-align") {
    syncVerticalAlignToCss(value, editor);
    return;
  }

  if (traitName.startsWith("header-")) {
    syncSectionTraitToCss("header", traitName, value, editor);
    return;
  }

  if (traitName.startsWith("body-")) {
    syncSectionTraitToCss("body", traitName, value, editor);
  }
}

export function syncTableTraitsFromCss(component: Component, editor: Editor) {
  const traitNames = changePropTraitNames;

  for (const traitName of traitNames) {
    let value: unknown;

    if (traitName === "cell-vertical-align") {
      value = getVerticalAlignFromCss(editor);
    } else if (traitName.startsWith("header-")) {
      value = getSectionTraitValueFromCss("header", traitName, editor);
    } else {
      value = getSectionTraitValueFromCss("body", traitName, editor);
    }

    if (value !== undefined) {
      component.set(traitName, value);
    }
  }
}
