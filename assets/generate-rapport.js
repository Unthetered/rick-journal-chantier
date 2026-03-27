const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, HeadingLevel, Footer, PageNumber, TabStopType, TabStopPosition
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Colours ───────────────────────────────────────────────────────────────────
const NAVY  = "1B2A4A";
const RED   = "C0392B";
const GREY  = "666666";
const LGREY = "F5F5F5";
const WHITE = "FFFFFF";

// ── Page dimensions (A4, 2.5 cm margins) ─────────────────────────────────────
// 1 cm = 567 DXA ; 2.5 cm = 1418 DXA
const PAGE_W  = 11906;
const PAGE_H  = 16838;
const MARGIN  = 1418;
const CONTENT = PAGE_W - MARGIN * 2;   // 9070 DXA

// ── Helpers ───────────────────────────────────────────────────────────────────
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function cell(children, opts = {}) {
  return new TableCell({
    borders: noBorders,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    verticalAlign: opts.vAlign ?? VerticalAlign.TOP,
    margins: { top: 80, bottom: 80, left: opts.leftPad ?? 0, right: opts.rightPad ?? 0 },
    children,
  });
}

function redDivider() {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: RED, space: 1 } },
    children: [],
  });
}

function sectionTitle(text) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [CONTENT],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            shading: { fill: NAVY, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 180, right: 180 },
            width: { size: CONTENT, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text, bold: true, color: WHITE, size: 22, font: "Calibri" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function spacer(pts = 120) {
  return new Paragraph({ spacing: { before: pts, after: 0 }, children: [] });
}

// ── Logo or placeholder ───────────────────────────────────────────────────────
const logoPath = path.join(__dirname, "logo-maestro.png");
let logoElement;
if (fs.existsSync(logoPath)) {
  const logoData = fs.readFileSync(logoPath);
  logoElement = new Paragraph({
    children: [new ImageRun({
      type: "png",
      data: logoData,
      transformation: { width: 113, height: 111 }, // ~4 cm at 72dpi
      altText: { title: "Maestro Mobilité", description: "Logo", name: "logo-maestro" },
    })],
  });
} else {
  logoElement = new Paragraph({
    children: [new TextRun({ text: "[LOGO MAESTRO MOBILITÉ]", bold: true, color: NAVY, size: 24, font: "Calibri" })],
  });
}

// ── Header table (logo left / info right) ────────────────────────────────────
const COL_L = Math.round(CONTENT * 0.4);
const COL_R = CONTENT - COL_L;

const headerTable = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [COL_L, COL_R],
  rows: [
    new TableRow({
      children: [
        // Left — logo + address
        cell([
          logoElement,
          new Paragraph({
            spacing: { before: 60 },
            children: [new TextRun({ text: "7441 rue Boyer", color: GREY, size: 16, font: "Calibri" })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Montr\u00e9al, Qu\u00e9bec, H2R 2R9", color: GREY, size: 16, font: "Calibri" })],
          }),
        ], { width: COL_L }),
        // Right — report info
        cell([
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "RAPPORT JOURNALIER DE CHANTIER", bold: true, color: NAVY, size: 22, font: "Calibri" })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 60 },
            children: [new TextRun({ text: "Date\u00a0: 27 mars 2026", color: NAVY, size: 20, font: "Calibri" })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Chantier\u00a0: [NOM DU CHANTIER]", color: NAVY, size: 20, font: "Calibri" })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "No. projet\u00a0: [NUM\u00c9RO]", color: NAVY, size: 20, font: "Calibri" })],
          }),
        ], { width: COL_R }),
      ],
    }),
  ],
});

// ── Client block ─────────────────────────────────────────────────────────────
const COL_LABEL = Math.round(CONTENT * 0.28);
const COL_VAL   = CONTENT - COL_LABEL;

function clientRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({
        borders: noBorders,
        width: { size: COL_LABEL, type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 120, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, font: "Calibri", color: NAVY })] })],
      }),
      new TableCell({
        borders: noBorders,
        width: { size: COL_VAL, type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 80, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 18, font: "Calibri" })] })],
      }),
    ],
  });
}

const clientBlock = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [COL_LABEL, COL_VAL],
  rows: [
    clientRow("Contact", "[Nom du contact]"),
    clientRow("Adresse", "[Adresse du client]"),
    clientRow("No. contrat", "[Num\u00e9ro de contrat]"),
  ],
});

// ── Activities ────────────────────────────────────────────────────────────────
const activities = [
  ["07:30", "Arriv\u00e9e sur le chantier. V\u00e9rification de l\u2019\u00c9PI de l\u2019\u00e9quipe."],
  ["08:15", "D\u00e9but de la FC du boulevard Saint-Laurent, secteur nord."],
  ["10:45", "Livraison de signalisation re\u00e7ue \u2014 45 panneaux type B."],
  ["14:30", "Inspection de la FC par l\u2019ing\u00e9nieur de chantier."],
  ["16:00", "Fin des travaux. Nettoyage du site compl\u00e9t\u00e9."],
];

const activityRows = activities.map(([time, text]) =>
  new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text: `[${time}]`, bold: true, size: 20, font: "Calibri", color: NAVY }),
      new TextRun({ text: `\u00a0${text}`, size: 20, font: "Calibri" }),
    ],
  })
);

// ── Events ────────────────────────────────────────────────────────────────────
const leftRedBorder = { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 8 } };

const eventBlock = new Paragraph({
  border: leftRedBorder,
  spacing: { before: 60, after: 60 },
  indent: { left: 200 },
  children: [
    new TextRun({ text: "[11:20] Bris de conduite souterraine", bold: true, size: 20, font: "Calibri", color: NAVY, break: 0 }),
    new TextRun({ text: "\nEmplacement\u00a0: Intersection Boyer / Rosemont", size: 20, font: "Calibri", break: 1 }),
    new TextRun({ text: "\nDescription\u00a0: Conduite d\u2019eau municipale touch\u00e9e lors des excavations. MTQ avis\u00e9 imm\u00e9diatement. Travaux suspendus dans ce secteur.", size: 20, font: "Calibri", break: 1 }),
    new TextRun({ text: "\nPhotos\u00a0: oui \u2014 3 photo(s) jointe(s)", size: 20, font: "Calibri", color: GREY, break: 1 }),
  ],
});

// ── Quantities table ──────────────────────────────────────────────────────────
const QC1 = 1200, QC2 = 6270, QC3 = 1600;  // sum = 9070 = CONTENT

function qtyHeaderRow() {
  const hBorder = { style: BorderStyle.SINGLE, size: 4, color: NAVY };
  const hBorders = { top: hBorder, bottom: hBorder, left: noBorder, right: noBorder };
  function hCell(text, w) {
    return new TableCell({
      borders: hBorders,
      shading: { fill: "E8ECF2", type: ShadingType.CLEAR },
      width: { size: w, type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, font: "Calibri", color: NAVY })] })],
    });
  }
  return new TableRow({ children: [hCell("Heure", QC1), hCell("Item", QC2), hCell("Quantit\u00e9", QC3)] });
}

function qtyDataRow(time, item, qty, isTotal = false) {
  const b = { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" };
  const borders = { top: b, bottom: b, left: noBorder, right: noBorder };
  function dCell(text, w, bold = false) {
    return new TableCell({
      borders,
      width: { size: w, type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      shading: isTotal ? { fill: "F0F0F0", type: ShadingType.CLEAR } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: "Calibri", bold: bold || isTotal })] })],
    });
  }
  return new TableRow({ children: [dCell(time, QC1), dCell(item, QC2), dCell(qty, QC3)] });
}

const qtyTable = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [QC1, QC2, QC3],
  rows: [
    qtyHeaderRow(),
    qtyDataRow("08:15", "FC Boulevard Saint-Laurent \u2014 secteur nord", "320 m"),
    qtyDataRow("10:45", "Signalisation type B", "45 unit\u00e9s"),
    qtyDataRow("14:00", "Excavation tranch\u00e9e", "18 m\u00b3"),
    qtyDataRow("", "TOTAL", "", true),
  ],
});

// ── Footer ────────────────────────────────────────────────────────────────────
const docFooter = new Footer({
  children: [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: RED, space: 4 } },
      spacing: { before: 80 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: "Responsable de chantier\u00a0: _________________________   Signature\u00a0: _________________________", size: 16, font: "Calibri" }),
        new TextRun({ text: "\tDate\u00a0: 27 mars 2026", size: 16, font: "Calibri" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "Rapport g\u00e9n\u00e9r\u00e9 par Maestro Mobilit\u00e9", size: 14, color: GREY, font: "Calibri" })],
    }),
  ],
});

// ── Assemble document ─────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 20 } } },
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    footers: { default: docFooter },
    children: [
      // Header block
      headerTable,
      redDivider(),
      spacer(100),

      // Client info title
      new Paragraph({
        spacing: { before: 0, after: 60 },
        shading: { fill: LGREY, type: ShadingType.CLEAR },
        children: [
          new TextRun({ text: "  INFORMATIONS CLIENT", bold: true, color: NAVY, size: 20, font: "Calibri" }),
        ],
      }),
      clientBlock,
      spacer(160),

      // Section 1 — Activités
      sectionTitle("1.  ACTIVIT\u00c9S"),
      spacer(80),
      ...activityRows,
      spacer(160),

      // Section 2 — Événements
      sectionTitle("2.  \u00c9V\u00c9NEMENTS"),
      spacer(80),
      eventBlock,
      spacer(160),

      // Section 3 — Quantités
      sectionTitle("3.  QUANTIT\u00c9S FACTURABLES"),
      spacer(80),
      qtyTable,
      spacer(200),
    ],
  }],
});

// ── Write file ────────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/Users/tpoupart/Desktop/Rick/assets/rapport-template.docx", buffer);
  console.log("✅ rapport-template.docx generated");
});
