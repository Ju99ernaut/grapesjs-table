import type { Component, Plugin } from "grapesjs";
import type { PluginOptions } from "./types";
import {
  cloneComponent,
  ensureFooter,
  ensureHeader,
  ensureSection,
  getColumnCount,
  isBorderEnabled,
  makeClonedRow,
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
        stylable: ["padding", "text-align", "border-radius"],
        traits: [...trTraits, ...cellTraits],
        copyable: false,
        delegate: {
          move: (component: Component) => component.closestType("table"),
        },
        attributes: {
          class: "table-cell",
        },
      },
      init() {
        const toolbar = this.get("toolbar");

        toolbar?.push({
          label:
            '<svg viewBox="0 0 1024 1024"><path d="M482.2 508.4L331.3 389c-3-2.4-7.3-0.2-7.3 3.6V478H184V184h204v128c0 2.2 1.8 4 4 4h60c2.2 0 4-1.8 4-4V144c0-15.5-12.5-28-28-28H144c-15.5 0-28 12.5-28 28v736c0 15.5 12.5 28 28 28h284c15.5 0 28-12.5 28-28V712c0-2.2-1.8-4-4-4h-60c-2.2 0-4 1.8-4 4v128H184V546h140v85.4c0 3.8 4.4 6 7.3 3.6l150.9-119.4c2.4-1.8 2.4-5.4 0-7.2zM880 116H596c-15.5 0-28 12.5-28 28v168c0 2.2 1.8 4 4 4h60c2.2 0 4-1.8 4-4V184h204v294H700v-85.4c0-3.8-4.3-6-7.3-3.6l-151 119.4c-2.3 1.8-2.3 5.3 0 7.1l151 119.5c2.9 2.3 7.3 0.2 7.3-3.6V546h140v294H636V712c0-2.2-1.8-4-4-4h-60c-2.2 0-4 1.8-4 4v168c0 15.5 12.5 28 28 28h284c15.5 0 28-12.5 28-28V144c0-15.5-12.5-28-28-28z" p-id="10228"></path></svg>',
          command: "table:merge-split-columns",
          attributes: {
            title: "Merge/Split Cells",
          },
        });
        this.set("toolbar", toolbar);
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
        stylable: [
          "border",
          "border-radius",
          "border-spacing",
          "border-collapse",
        ],
        traits: [
          ...tableSettingsTraits,
          ...getStyleTraits("header", headerStylesCategory),
          ...getStyleTraits("body", bodyStylesCategory),
        ],
        header: true,
      },

      syncHeaderAndFooter() {
        const cols = Math.max(1, getColumnCount(this));

        if (this.get("header")) ensureHeader(this, cols);
        else this.findFirstType("thead")?.remove();

        if (this.get("footer")) ensureFooter(this, cols);
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
        this.on("change:dataResolver", this.onDataSourceChange);
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
        const dataResolver = this.get("dataResolver");
        const thead = this.get("header") ? ensureSection(this, "thead") : null;
        const tbody = ensureSection(this, "tbody");
        const tfoot = this.get("footer") ? ensureSection(this, "tfoot") : null;
        this.components().reset([
          ...(thead ? [cloneComponent(thead)] : []),
          {
            ...cloneComponent(tbody),
            type: dataResolver ? "data-collection-tbody" : "tbody",
            components: [
              makeClonedRow(tbody.components().first(), !!dataResolver),
            ],
          },
          ...(tfoot ? [cloneComponent(tfoot)] : []),
        ]);
        if (dataResolver) this.setDataResolver();
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
        isBorderEnabled(config.selector, config.direction, editor),
        editor,
      );
    });
  });
};
