const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, Footer, PageBreak, TabStopType, TabStopPosition,
  PageNumber
} = require("docx");
const fs   = require("fs");
const path = require("path");

// ── Colours ───────────────────────────────────────────────────────────────────
const NAVY  = "1B2A4A";
const RED   = "C0392B";
const GREY  = "666666";
const LGREY = "F5F5F5";
const WHITE = "FFFFFF";

// ── Page dimensions (A4, 2.5 cm margins) ─────────────────────────────────────
const PAGE_W     = 11906;
const PAGE_H     = 16838;
const MARGIN     = 1418;
const MARGIN_TOP = 720;
const CONTENT    = PAGE_W - MARGIN * 2;

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

// ── Date / time formatting ────────────────────────────────────────────────────
function fmtTime(t) {
  return new Date(t).toLocaleTimeString("fr-CA", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto",
  });
}

function fmtDateFR(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// ── Logo ──────────────────────────────────────────────────────────────────────
const logoPath = path.join(__dirname, "logo-maestro.jpeg");
let logoElement;
if (fs.existsSync(logoPath)) {
  const logoData = fs.readFileSync(logoPath);
  logoElement = new Paragraph({
    children: [new ImageRun({
      type: "jpg",
      data: logoData,
      transformation: { width: 113, height: 111 },
      altText: { title: "Maestro Mobilité", description: "Logo", name: "logo-maestro" },
    })],
  });
} else {
  logoElement = new Paragraph({
    children: [new TextRun({ text: "[LOGO MAESTRO MOBILITÉ]", bold: true, color: NAVY, size: 24, font: "Calibri" })],
  });
}

// ── Header table (dynamic date + chantier) ────────────────────────────────────
const COL_L  = Math.round(CONTENT * 0.4);
const COL_R  = CONTENT - COL_L;
const LOGO_W = 1500;
const ADDR_W = COL_L - LOGO_W;

function buildHeaderTable(dateFR, projectName) {
  const logoAdresseTable = new Table({
    width: { size: COL_L, type: WidthType.DXA },
    columnWidths: [LOGO_W, ADDR_W],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: LOGO_W, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 0, bottom: 0, left: 0, right: 120 },
          children: [logoElement],
        }),
        new TableCell({
          borders: noBorders,
          width: { size: ADDR_W, type: WidthType.DXA },
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          children: [
            new Paragraph({ children: [new TextRun({ text: "7441 rue Boyer",          color: GREY, size: 16, font: "Calibri" })] }),
            new Paragraph({ children: [new TextRun({ text: "Montréal, Québec",        color: GREY, size: 16, font: "Calibri" })] }),
            new Paragraph({ children: [new TextRun({ text: "H2R 2R9",                 color: GREY, size: 16, font: "Calibri" })] }),
          ],
        }),
      ],
    })],
  });

  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [COL_L, COL_R],
    rows: [new TableRow({
      children: [
        cell([logoAdresseTable], { width: COL_L }),
        cell([
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "RAPPORT JOURNALIER DE CHANTIER", bold: true, color: NAVY, size: 22, font: "Calibri" })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 60 },
            children: [new TextRun({ text: `Date\u00a0: ${dateFR}`, color: NAVY, size: 20, font: "Calibri" })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `Chantier\u00a0: ${projectName}`, color: NAVY, size: 20, font: "Calibri" })],
          }),
        ], { width: COL_R }),
      ],
    })],
  });
}

// ── Client block (placeholders — à remplir manuellement) ─────────────────────
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
    clientRow("Contact",                          "[Nom du contact]"),
    clientRow("Adresse",                          "[Adresse du client]"),
    clientRow("No. Projet Donneur d\u2019ouvrage","[Numéro]"),
    clientRow("No. Projet Client",                "[Numéro]"),
  ],
});

// ── Section 1 — Activités (dynamic) ──────────────────────────────────────────
function buildActivityRows(activities) {
  if (!activities.length) {
    return [new Paragraph({ children: [new TextRun({ text: "(aucune activité)", color: GREY, italics: true, size: 20, font: "Calibri" })] })];
  }
  return activities.map(a => new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text: `[${fmtTime(a.entry_time)}]`, bold: true, size: 20, font: "Calibri", color: NAVY }),
      new TextRun({ text: `\u00a0${a.content}`, size: 20, font: "Calibri" }),
    ],
  }));
}

// ── Section 2 — Événements (dynamic) ─────────────────────────────────────────
const leftRedBorder = { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 8 } };

function eventSubSection(evt) {
  const parts = [
    new Paragraph({
      border: leftRedBorder,
      spacing: { before: 100, after: 40 },
      indent: { left: 200 },
      children: [new TextRun({ text: `${evt.num}  ${evt.title}`, bold: true, size: 21, font: "Calibri", color: NAVY })],
    }),
    new Paragraph({
      indent: { left: 200 },
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({ text: "Emplacement\u00a0: ", bold: true, size: 19, font: "Calibri" }),
        new TextRun({ text: evt.location || "—", size: 19, font: "Calibri" }),
      ],
    }),
    new Paragraph({
      indent: { left: 200 },
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({ text: "Description\u00a0: ", bold: true, size: 19, font: "Calibri" }),
        new TextRun({ text: evt.description || "—", size: 19, font: "Calibri" }),
      ],
    }),
  ];
  if (evt.annexe) {
    parts.push(new Paragraph({
      indent: { left: 200 },
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({ text: "Photos\u00a0: ", bold: true, size: 19, font: "Calibri" }),
        new TextRun({ text: `Voir ${evt.annexe} \u2014 Événement ${evt.num} ${evt.title}`, size: 19, font: "Calibri", color: GREY, italics: true }),
      ],
    }));
  }
  return parts;
}

function buildEventBlocks(events) {
  if (!events.length) {
    return [new Paragraph({ children: [new TextRun({ text: "(aucun événement)", color: GREY, italics: true, size: 20, font: "Calibri" })] })];
  }
  return events.flatMap((e, i) => eventSubSection({
    num:    `2.${i + 1}`,
    title:  e.title,
    description: e.description,
    location:    e.location,
    annexe: e.has_photos ? `Annexe ${String.fromCharCode(65 + i)}` : null,
  }));
}

// ── Section 3 — Quantités (dynamic) ──────────────────────────────────────────
const QC = [2000, 1600, 3270, 1000, 1200]; // sum = 9070 = CONTENT

function qtyHeaderRow() {
  const hBorder  = { style: BorderStyle.SINGLE, size: 4, color: NAVY };
  const hBorders = { top: hBorder, bottom: hBorder, left: noBorder, right: noBorder };
  return new TableRow({
    children: ["Entrepreneur", "Discipline", "Item", "Qt\u00e9", "Unit\u00e9"].map((h, i) =>
      new TableCell({
        borders: hBorders,
        shading: { fill: "E8ECF2", type: ShadingType.CLEAR },
        width: { size: QC[i], type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Calibri", color: NAVY })] })],
      })
    ),
  });
}

function qtyDataRow(entrepreneur, discipline, item, qte, unite) {
  const b       = { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" };
  const borders = { top: b, bottom: b, left: noBorder, right: noBorder };
  return new TableRow({
    children: [entrepreneur, discipline, item, qte, unite].map((v, i) =>
      new TableCell({
        borders,
        width: { size: QC[i], type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: String(v ?? ""), size: 18, font: "Calibri" })] })],
      })
    ),
  });
}

function buildQtyTable(quantities) {
  const dataRows = quantities.length
    ? quantities.map(q => qtyDataRow(q.entrepreneur ?? "", q.discipline ?? "", q.item, q.qty ?? "", q.unit ?? ""))
    : [qtyDataRow("—", "—", "(aucune quantité)", "", "")];
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: QC,
    rows: [qtyHeaderRow(), ...dataRows],
  });
}

// ── Annexes photos (dynamic) ──────────────────────────────────────────────────
const PHOTO_SIZE = 3200;
const photoGapW  = CONTENT - PHOTO_SIZE * 2;

function photoPlaceholderCell(label) {
  return new TableCell({
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      left:   { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      right:  { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    },
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
    width: { size: PHOTO_SIZE, type: WidthType.DXA },
    margins: { top: 200, bottom: 200, left: 200, right: 200 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: label, color: GREY, size: 18, font: "Calibri", italics: true })],
    })],
  });
}

function spacerCell(w) {
  return new TableCell({
    borders: noBorders,
    width: { size: w, type: WidthType.DXA },
    children: [new Paragraph({ children: [] })],
  });
}

function buildPhotoGrid(photoCount) {
  const count = Math.max(photoCount || 0, 2);
  const rows  = [];
  for (let i = 0; i < count; i += 2) {
    const l1 = `Photo ${i + 1}`;
    const l2 = i + 1 < count ? `Photo ${i + 2}` : "";
    rows.push(new TableRow({
      height: { value: 3200, rule: "exact" },
      children: [
        photoPlaceholderCell(l1),
        spacerCell(photoGapW),
        l2 ? photoPlaceholderCell(l2) : spacerCell(PHOTO_SIZE),
      ],
    }));
  }
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [PHOTO_SIZE, photoGapW, PHOTO_SIZE],
    rows,
  });
}

function buildAnnexeChildren(events) {
  const children = [];
  events.filter(e => e.has_photos).forEach((e, i) => {
    const annexeLetter = String.fromCharCode(65 + i);
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(sectionTitle(`ANNEXE ${annexeLetter} \u2014 PHOTOS ÉVÉNEMENT 2.${i + 1} ${e.title.toUpperCase()}`));
    children.push(spacer(120));
    children.push(buildPhotoGrid(e.photo_count));
  });
  return children;
}

// ── Footer (dynamic date) ─────────────────────────────────────────────────────
function buildFooter(dateFR) {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: RED, space: 4 } },
        spacing: { before: 80 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: "Responsable de chantier\u00a0: _________________________   Signature\u00a0: _________________________", size: 16, font: "Calibri" }),
          new TextRun({ text: `\tDate\u00a0: ${dateFR}`, size: 16, font: "Calibri" }),
        ],
      }),
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: "Rapport généré par Maestro Mobilité", size: 14, color: GREY, font: "Calibri" }),
          new TextRun({ text: "\t", size: 14, font: "Calibri" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 14, color: GREY, font: "Calibri" }),
          new TextRun({ text: "\u00a0/\u00a0", size: 14, color: GREY, font: "Calibri" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: GREY, font: "Calibri" }),
        ],
      }),
    ],
  });
}

// ── Supabase fetch ────────────────────────────────────────────────────────────
async function fetchJournalData(journalId) {
  const SUPABASE_URL = process.env.SUPABASE_URL || "https://nfloyhivvvhfrwgqrvov.supabase.co";
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_KEY) {
    throw new Error(
      "Variable SUPABASE_SERVICE_ROLE_KEY manquante.\n" +
      "Usage : SUPABASE_SERVICE_ROLE_KEY=... node generate-rapport.js --journal-id <uuid>"
    );
  }
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
  const base    = `${SUPABASE_URL}/rest/v1`;

  const [jRes, actRes, evtRes, qtyRes] = await Promise.all([
    fetch(`${base}/journal_journals?id=eq.${journalId}&select=date,project_name,created_by`, { headers }).then(r => r.json()),
    fetch(`${base}/journal_activities?journal_id=eq.${journalId}&select=entry_time,content&order=entry_time`, { headers }).then(r => r.json()),
    fetch(`${base}/journal_events?journal_id=eq.${journalId}&select=entry_time,title,description,location,has_photos,photo_count&order=entry_time`, { headers }).then(r => r.json()),
    fetch(`${base}/journal_quantities?journal_id=eq.${journalId}&select=entrepreneur,discipline,item,qty,unit&order=entry_time`, { headers }).then(r => r.json()),
  ]);

  if (!Array.isArray(jRes) || !jRes.length) throw new Error(`Journal introuvable : ${journalId}`);
  return { journal: jRes[0], activities: actRes, events: evtRes, quantities: qtyRes };
}

// ── Demo data (fallback sans --journal-id) ────────────────────────────────────
const DEMO_DATA = {
  journal:    { date: new Date().toISOString().split("T")[0], project_name: "DÉMO — Pont Champlain", created_by: "Éric" },
  activities: [
    { entry_time: new Date().toISOString(), content: "Arrivée sur le chantier. Vérification de l'ÉPI de l'équipe." },
    { entry_time: new Date().toISOString(), content: "Début de la FC du boulevard Saint-Laurent, secteur nord." },
  ],
  events: [
    { title: "Bris de conduite souterraine", description: "Conduite d'eau municipale touchée lors des excavations.", location: "Intersection Boyer / Rosemont", has_photos: true, photo_count: 4 },
  ],
  quantities: [
    { entrepreneur: "Maestro", discipline: "Signalisation", item: "FC Boulevard Saint-Laurent — secteur nord", qty: 320, unit: "m" },
    { entrepreneur: "Maestro", discipline: "Signalisation", item: "Panneaux type B", qty: 45, unit: "unités" },
  ],
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args       = process.argv.slice(2);
  const jIdx       = args.indexOf("--journal-id");
  const dIdx       = args.indexOf("--data-file");
  const journalId  = jIdx !== -1 ? args[jIdx + 1] : null;
  const dataFile   = dIdx !== -1 ? args[dIdx + 1] : null;

  let data;
  if (dataFile) {
    console.log(`📂 Chargement des données depuis ${dataFile}...`);
    data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
    console.log(`✅ ${data.activities.length} activité(s), ${data.events.length} événement(s), ${data.quantities.length} quantité(s)`);
  } else if (journalId) {
    console.log(`⏳ Récupération des données (journal_id: ${journalId})...`);
    data = await fetchJournalData(journalId);
    console.log(`✅ ${data.activities.length} activité(s), ${data.events.length} événement(s), ${data.quantities.length} quantité(s)`);
  } else {
    console.log("ℹ️  Aucun --journal-id fourni — utilisation des données de démo.");
    console.log("    Usage : SUPABASE_SERVICE_ROLE_KEY=... node generate-rapport.js --journal-id <uuid>");
    console.log("    Ou    : node generate-rapport.js --data-file <chemin.json>");
    data = DEMO_DATA;
  }

  const { journal, activities, events, quantities } = data;
  const dateFR = fmtDateFR(journal.date);

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN_TOP, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      footers: { default: buildFooter(dateFR) },
      children: [
        buildHeaderTable(dateFR, journal.project_name),
        redDivider(),
        spacer(100),
        new Paragraph({
          spacing: { before: 0, after: 60 },
          shading: { fill: LGREY, type: ShadingType.CLEAR },
          children: [new TextRun({ text: "  INFORMATIONS CLIENT", bold: true, color: NAVY, size: 20, font: "Calibri" })],
        }),
        clientBlock,
        spacer(160),
        sectionTitle("1.  ACTIVIT\u00c9S"),
        spacer(80),
        ...buildActivityRows(activities),
        spacer(160),
        sectionTitle("2.  \u00c9V\u00c9NEMENTS ET/OU COMMENTAIRES"),
        spacer(80),
        ...buildEventBlocks(events),
        spacer(160),
        sectionTitle("3.  QUANTIT\u00c9S"),
        spacer(80),
        buildQtyTable(quantities),
        spacer(200),
        ...buildAnnexeChildren(events),
      ],
    }],
  });

  const safeName = journal.project_name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_");
  const outPath = path.join(__dirname, `rapport_${safeName}_${journal.date}.docx`);

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ ${outPath}`);
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
