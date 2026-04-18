export const tableSettingsCategory = {
  id: "settings",
  label: "Table settings",
};
export const headerStylesCategory = { id: "header", label: "Header" };
export const bodyStylesCategory = { id: "body", label: "Body" };
export const footerStylesCategory = { id: "footer", label: "Footer" };
export const rowCategory = { id: "row", label: "Row" };
export const columnCategory = { id: "column", label: "Column" };

export const changePropTraitNames = [
  "cell-vertical-align",

  "header-background",
  "header-color",
  "header-font-size",
  "header-vertical-borders",
  "header-horizontal-borders",

  "body-background",
  "body-zebra-background",
  "body-zebra-color",
  "body-color",
  "body-font-size",
  "body-vertical-borders",
  "body-horizontal-borders",
];

export const tableSettingsTraits = [
  {
    type: "number",
    name: "cellpadding",
    label: "Cell Padding(px)",
    min: 1,
    placeholder: "0",
    category: tableSettingsCategory,
  },
  {
    type: "number",
    name: "cellspacing",
    label: "Cell Spacing(px)",
    min: 1,
    placeholder: "0",
    category: tableSettingsCategory,
  },
  {
    type: "select",
    name: "cell-vertical-align",
    label: "Vertical Align",
    changeProp: true,
    category: tableSettingsCategory,
    options: [
      { id: "top", label: "Top" },
      { id: "middle", label: "Middle" },
      { id: "bottom", label: "Bottom" },
    ],
  },
];

export const getStyleTraits = (
  section: "header" | "body",
  category: typeof tableSettingsCategory,
) => [
  ...(section !== "body"
    ? [
        {
          type: "checkbox",
          name: section,
          label: "Visible",
          changeProp: true,
          category,
        },
      ]
    : []),
  {
    type: "color",
    name: `${section}-background`,
    label: "Background",
    changeProp: true,
    placeholder: "inherit",
    category,
  },
  {
    type: "color",
    name: `${section}-color`,
    label: "Color",
    changeProp: true,
    placeholder: "inherit",
    category,
  },
  ...(section === "body"
    ? [
        {
          type: "color",
          name: `${section}-zebra-background`,
          label: "Zebra Background",
          changeProp: true,
          placeholder: "inherit",
          category,
        },
        {
          type: "color",
          name: `${section}-zebra-color`,
          label: "Zebra Color",
          changeProp: true,
          placeholder: "inherit",
          category,
        },
      ]
    : []),
  {
    type: "number",
    name: `${section}-font-size`,
    label: "Font Size(px)",
    min: 1,
    placeholder: "inherit",
    changeProp: true,
    category,
  },
  {
    type: "checkbox",
    name: `${section}-vertical-borders`,
    label: "Vertical borders",
    changeProp: true,
    category,
  },
  {
    type: "checkbox",
    name: `${section}-horizontal-borders`,
    label: "Horizontal borders",
    changeProp: true,
    category,
  },
];

export const trTraits = [
  {
    name: "insert-row-before",
    type: "button",
    text: "Insert Before",
    full: true,
    command: "table:insert-row-before",
    category: rowCategory,
  },
  {
    name: "insert-row-after",
    type: "button",
    text: "Insert After",
    full: true,
    command: "table:insert-row-after",
    category: rowCategory,
  },
  {
    name: "remove-row",
    type: "button",
    text: "Remove Row",
    full: true,
    command: "table:remove-row",
    category: rowCategory,
  },
];

export const cellTraits = [
  {
    name: "insert-column-before",
    type: "button",
    text: "Insert Before",
    full: true,
    command: "table:insert-column-before",
    category: columnCategory,
  },
  {
    name: "insert-column-after",
    type: "button",
    text: "Insert After",
    full: true,
    command: "table:insert-column-after",
    category: columnCategory,
  },
  {
    name: "remove-column",
    type: "button",
    text: "Remove Column",
    full: true,
    command: "table:remove-column",
    category: columnCategory,
  },
];
