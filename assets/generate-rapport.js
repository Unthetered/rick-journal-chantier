const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, Footer, PageBreak, TabStopType, TabStopPosition
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
const PAGE_W  = 11906;
const PAGE_H  = 16838;
const MARGIN  = 1418;
const CONTENT = PAGE_W - MARGIN * 2;   // 9070 DXA

// ── Helpers ───────────────────────────────────────────────────────────────────
const noBorder  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
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
    rows: [new TableRow({
      children: [new TableCell({
        borders: noBorders,
        shading: { fill: NAVY, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        width: { size: CONTENT, type: WidthType.DXA },
        children: [new Paragraph({
          children: [new TextRun({ text, bold: true, color: WHITE, size: 22, font: "Calibri" })],
        })],
      })],
    })],
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
      transformation: { width: 113, height: 111 },
      altText: { title: "Maestro Mobilit\u00e9", description: "Logo", name: "logo-maestro" },
    })],
  });
} else {
  logoElement = new Paragraph({
    children: [new TextRun({ text: "[LOGO MAESTRO MOBILIT\u00c9]", bold: true, color: NAVY, size: 24, font: "Calibri" })],
  });
}

// ── Header table — logo left / info right (sans No. projet) ──────────────────
const COL_L = Math.round(CONTENT * 0.4);
const COL_R = CONTENT - COL_L;

const headerTable = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [COL_L, COL_R],
  rows: [new TableRow({
    children: [
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
        // No. projet removed per request
      ], { width: COL_R }),
    ],
  })],
});

// ── Client block — 4 rows ─────────────────────────────────────────────────────
const COL_LABEL = Math.round(CONTENT * 0.35);
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
    clientRow("No. Projet Donneur d\u2019ouvrage", "[Num\u00e9ro]"),
    clientRow("No. Projet Client", "[Num\u00e9ro]"),
  ],
});

// ── Section 1 — Activités ─────────────────────────────────────────────────────
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

// ── Section 2 — Événements et/ou Commentaires ─────────────────────────────────
// Sub-sections numbered 2.1, 2.2, etc. No timestamp. Photos → Annexes.
const leftRedBorder = { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 8 } };

const events = [
  {
    num: "2.1",
    title: "Bris de conduite souterraine",
    location: "Intersection Boyer / Rosemont",
    description: "Conduite d\u2019eau municipale touch\u00e9e lors des excavations. MTQ avis\u00e9 imm\u00e9diatement. Travaux suspendus dans ce secteur.",
    annexe: "Annexe A",
  },
  {
    num: "2.2",
    title: "Retard livraison mat\u00e9riaux",
    location: "Zone de d\u00e9p\u00f4t, secteur sud",
    description: "Camion de granulats arriv\u00e9 avec 2h de retard. Impact sur le planning de la journ\u00e9e.",
    annexe: null,
  },
];

function eventSubSection(evt) {
  const titlePara = new Paragraph({
    border: leftRedBorder,
    spacing: { before: 100, after: 40 },
    indent: { left: 200 },
    children: [
      new TextRun({ text: `${evt.num}  ${evt.title}`, bold: true, size: 21, font: "Calibri", color: NAVY }),
    ],
  });
  const locationPara = new Paragraph({
    indent: { left: 200 },
    spacing: { before: 0, after: 40 },
    children: [
      new TextRun({ text: "Emplacement\u00a0: ", bold: true, size: 19, font: "Calibri" }),
      new TextRun({ text: evt.location, size: 19, font: "Calibri" }),
    ],
  });
  const descPara = new Paragraph({
    indent: { left: 200 },
    spacing: { before: 0, after: 40 },
    children: [
      new TextRun({ text: "Description\u00a0: ", bold: true, size: 19, font: "Calibri" }),
      new TextRun({ text: evt.description, size: 19, font: "Calibri" }),
    ],
  });
  const parts = [titlePara, locationPara, descPara];
  if (evt.annexe) {
    parts.push(new Paragraph({
      indent: { left: 200 },
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({ text: "Photos\u00a0: ", bold: true, size: 19, font: "Calibri" }),
        new TextRun({ text: `Voir ${evt.annexe} \u2014 \u00c9v\u00e9nement ${evt.num} ${evt.title}`, size: 19, font: "Calibri", color: GREY, italics: true }),
      ],
    }));
  }
  return parts;
}

const eventBlocks = events.flatMap(eventSubSection);

// ── Section 3 — Quantités (5 colonnes) ───────────────────────────────────────
// Entrepreneur | Discipline | Item | Qté | Unité
const Q1 = 1600, Q2 = 1600, Q3 = 3270, Q4 = 900, Q5 = 700; // sum = 8070... adjust
// Recalculate to sum exactly to CONTENT (9070)
const QW = [1700, 1700, 3370, 900, 700]; // sum = 8370 — need 9070
// Let's be precise: 9070 / 5 = 1814 each, but uneven columns look better
const QCols = [1800, 1700, 3270, 1000, 800]; // 1800+1700+3270+1000+800 = 8570...
// Fine-tune: CONTENT = 9070
// Entrepreneur=2000, Discipline=1600, Item=3270, Qté=1000, Unité=1200 → 9070 ✓
const QC = [2000, 1600, 3270, 1000, 1200];

function qtyHeaderRow() {
  const hBorder = { style: BorderStyle.SINGLE, size: 4, color: NAVY };
  const hBorders = { top: hBorder, bottom: hBorder, left: noBorder, right: noBorder };
  const headers = ["Entrepreneur", "Discipline", "Item", "Qt\u00e9", "Unit\u00e9"];
  return new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders: hBorders,
      shading: { fill: "E8ECF2", type: ShadingType.CLEAR },
      width: { size: QC[i], type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Calibri", color: NAVY })] })],
    })),
  });
}

function qtyDataRow(entrepreneur, discipline, item, qte, unite, isTotal = false) {
  const b = { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" };
  const borders = { top: b, bottom: b, left: noBorder, right: noBorder };
  const values = [entrepreneur, discipline, item, qte, unite];
  return new TableRow({
    children: values.map((v, i) => new TableCell({
      borders,
      width: { size: QC[i], type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      shading: isTotal ? { fill: "F0F0F0", type: ShadingType.CLEAR } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text: v, size: 18, font: "Calibri", bold: isTotal })] })],
    })),
  });
}

const qtyTable = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: QC,
  rows: [
    qtyHeaderRow(),
    qtyDataRow("Maestro", "Signalisation", "FC Boulevard Saint-Laurent \u2014 secteur nord", "320", "m"),
    qtyDataRow("Maestro", "Signalisation", "Panneaux type B", "45", "unit\u00e9s"),
    qtyDataRow("Sous-traitant A", "Excavation", "Tranch\u00e9e rue Boyer", "18", "m\u00b3"),
    qtyDataRow("", "", "TOTAL", "", "", true),
  ],
});

// ── Annexe A — Photos (6 par page, carrés centrés) ───────────────────────────
const PHOTO_SIZE = 3200; // ~5.6 cm en DXA (env. 3200 DXA)
const PHOTO_GAP  = (CONTENT - PHOTO_SIZE * 2) / 3; // 3 espaces pour 2 colonnes
// Placeholder photo en gris clair avec texte centré

function photoPlaceholderCell(label) {
  return new TableCell({
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    },
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
    width: { size: PHOTO_SIZE, type: WidthType.DXA },
    margins: { top: 200, bottom: 200, left: 200, right: 200 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: label, color: GREY, size: 18, font: "Calibri", italics: true })],
      }),
    ],
  });
}

function spacerCell(w) {
  return new TableCell({
    borders: noBorders,
    width: { size: w, type: WidthType.DXA },
    children: [new Paragraph({ children: [] })],
  });
}

// 3 rows × 2 photos = 6 photos par page
const photoGapW = CONTENT - PHOTO_SIZE * 2;
function photoRow(label1, label2) {
  return new TableRow({
    height: { value: 3200, rule: "exact" },
    children: [
      photoPlaceholderCell(label1),
      spacerCell(photoGapW),
      photoPlaceholderCell(label2),
    ],
  });
}

const annexePhotoTable = new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: [PHOTO_SIZE, photoGapW, PHOTO_SIZE],
  rows: [
    photoRow("Photo 1", "Photo 2"),
    photoRow("Photo 3", "Photo 4"),
    photoRow("Photo 5", "Photo 6"),
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
      // ── En-tête ──
      headerTable,
      redDivider(),
      spacer(100),

      // ── Infos client ──
      new Paragraph({
        spacing: { before: 0, after: 60 },
        shading: { fill: LGREY, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  INFORMATIONS CLIENT", bold: true, color: NAVY, size: 20, font: "Calibri" })],
      }),
      clientBlock,
      spacer(160),

      // ── Section 1 ──
      sectionTitle("1.  ACTIVIT\u00c9S"),
      spacer(80),
      ...activityRows,
      spacer(160),

      // ── Section 2 ──
      sectionTitle("2.  \u00c9V\u00c9NEMENTS ET/OU COMMENTAIRES"),
      spacer(80),
      ...eventBlocks,
      spacer(160),

      // ── Section 3 ──
      sectionTitle("3.  QUANTIT\u00c9S"),
      spacer(80),
      qtyTable,
      spacer(200),

      // ── Annexe A — page séparée ──
      new Paragraph({ children: [new PageBreak()] }),
      sectionTitle("ANNEXE A \u2014 PHOTOS \u00c9V\u00c9NEMENT 2.1 Bris de conduite souterraine"),
      spacer(120),
      annexePhotoTable,
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/Users/tpoupart/Desktop/Rick/assets/rapport-template.docx", buffer);
  console.log("\u2705 rapport-template.docx generated");
});
