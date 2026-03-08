import type { Component, Plugin } from "grapesjs";
import type { PluginOptions } from "./types";
import {
  ensureFooter,
  ensureHeader,
  getColumnCount,
  isBorderEnabled,
  makeCollectionRow,
  makeRow,
  syncTableTraitsFromCss,
  syncTableTraitToCss,
} from "./utils";
import {
  bodyStylesCategory,
  cellTraits,
  changePropTraitNames,
  getStyleTraits,
  headerStylesCategory,
  tableSettingsTraits,
  trTraits,
} from "./traits";
import { tableCss } from "./styles";

export const components: Plugin<PluginOptions> = (editor) => {
  const domc = editor.DomComponents;

  const tableBodyDelegate = {
    move: (component: Component) => component.closestType("table"),
    select: (component: Component) => component.closestType("table"),
  };

  domc.addType("thead", {
    model: {
      defaults: {
        name: "Table head",
        selectable: false,
        hoverable: false,
        delegate: tableBodyDelegate,
      },
    },
  });

  domc.addType("tbody", {
    model: {
      defaults: {
        name: "Table body",
        selectable: false,
        hoverable: false,
        delegate: tableBodyDelegate,
      },
    },
  });

  domc.addType("data-collection-tbody", {
    extend: "data-collection",
    model: {
      defaults: {
        name: "Table body",
        selectable: false,
        hoverable: false,
        tagName: "tbody",
        draggable: ["table"],
        droppable: ["tr"],
        delegate: tableBodyDelegate,
      },
    },
  });

  domc.addType("tfoot", {
    model: {
      defaults: {
        name: "Table foot",
        selectable: false,
        hoverable: false,
        delegate: tableBodyDelegate,
      },
    },
  });

  domc.addType("tr", {
    model: {
      defaults: {
        name: "Table row",
        tagName: "tr",
        draggable: ["thead", "tbody", "tfoot"],
        droppable: ["th", "td"],
        stylable: [],
        traits: [],
        selectable: false,
        hoverable: false,
        delegate: tableBodyDelegate,
        attributes: {
          class: "table-row-zebra",
        },
      },
    },
    isComponent(el) {
      return el?.tagName?.toLowerCase() === "tr";
    },
  });

  domc.addType("data-collection-tr", {
    extend: "data-collection-item",
    model: {
      defaults: {
        name: "Table row",
        tagName: "tr",
        draggable: ["thead", "tbody", "tfoot"],
        droppable: ["th", "td"],
        stylable: [],
        traits: [],
        selectable: false,
        hoverable: false,
        delegate: tableBodyDelegate,
        attributes: {
          class: "table-row-zebra",
        },
      },
    },
  });

  domc.addType("cell", {
    model: {
      defaults: {
        name: "Table cell",
        stylable: ["text-align", "border-radius"],
        traits: [...trTraits, ...cellTraits],
        copyable: false,
        delegate: {
          move: (component: Component) => component.closestType("table"),
        },
        attributes: {
          class: "table-cell",
        },
      },
    },
    view: {
      events() {
        return { dblclick: "selectParent" };
      },
      selectParent() {
        editor.select(this.model.parent());
      },
    },
  });

  domc.addType("table", {
    model: {
      defaults: {
        name: "Table",
        components: [
          {
            type: "tbody",
            components: [
              makeRow("body", 3),
              makeRow("body", 3),
              makeRow("body", 3),
            ],
          },
          `<style>${tableCss}</style>`,
        ],
        attributes: {
          class: "table",
        },
        stylable: ["border", "border-radius", "border-collapse"],
        traits: [
          ...tableSettingsTraits,
          ...getStyleTraits("header", headerStylesCategory),
          ...getStyleTraits("body", bodyStylesCategory),
        ],
      },

      syncHeaderAndFooter() {
        const cols = Math.max(1, getColumnCount(this));

        if (String(this.get("header") ?? "0") === "1") ensureHeader(this, cols);
        else this.findFirstType("thead")?.remove();

        if (String(this.get("footer") ?? "0") === "1") ensureFooter(this, cols);
        else this.findFirstType("tfoot")?.remove();
      },

      init() {
        this.on("change:header change:footer", this.syncHeaderAndFooter);
        this.syncHeaderAndFooter();

        syncTableTraitsFromCss(this, editor);

        const traitNames = changePropTraitNames;

        traitNames.forEach((name) => {
          this.on(`change:${name}`, () => {
            syncTableTraitToCss(name, this.get(name), editor);
          });
        });
        this.on("change:dataResolver", this.setDataResolver);
      },
      setDataResolver() {
        this.findFirstType("data-collection-tbody")?.set(
          "dataResolver",
          this.get("dataResolver"),
        );
      },
      getDataResolver() {
        return this.findFirstType("data-collection-tbody")?.get("dataResolver");
      },
      onDataSourceChange() {
        const path = this.get("data-source");
        console.log(path);
        if (!path) {
          this.components().reset([
            {
              type: "tbody",
              components: [
                makeRow("body", 3),
                makeRow("body", 3),
                makeRow("body", 3),
              ],
            },
            `<style>${tableCss}</style>`,
          ]);
          return;
        }
        this.setDataResolver({
          collectionId: crypto.randomUUID(),
          dataSource: {
            type: "data-variable",
            path,
          },
        });
        this.components().reset([
          {
            type: "data-collection-tbody",
            components: [makeCollectionRow(3)],
          },
          `<style>${tableCss}</style>`,
        ]);
      },
    },
  });

  editor.on("component:styleUpdate:border-style", () => {
    if (editor.getSelected()?.getType() !== "table") return;

    const selectors = {
      "header-vertical-borders": {
        selector: ".table-header-cell",
        direction: "vertical" as const,
      },
      "header-horizontal-borders": {
        selector: ".table-header-cell",
        direction: "horizontal" as const,
      },
      "body-vertical-borders": {
        selector: ".table-cell",
        direction: "vertical" as const,
      },
      "body-horizontal-borders": {
        selector: ".table-cell",
        direction: "horizontal" as const,
      },
    };

    Object.entries(selectors).forEach(([traitName, config]) => {
      syncTableTraitToCss(
        traitName,
        isBorderEnabled(config.selector, config.direction, editor) ? "1" : "0",
        editor,
      );
    });
  });
};
