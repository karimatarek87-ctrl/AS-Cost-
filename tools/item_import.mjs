import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const inputPath = process.argv[2];
const outputDir = process.argv[3];
const targetScript = process.argv[4];

if (!inputPath || !outputDir) {
  throw new Error('Usage: node item_import.mjs <input.xlsx> <output-directory>');
}

await fs.mkdir(outputDir, { recursive: true });
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const overview = await workbook.inspect({
  kind: 'workbook,sheet,table',
  maxChars: 10000,
  tableMaxRows: 12,
  tableMaxCols: 14,
  tableMaxCellChars: 120,
});
const formulaErrors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'formula error scan',
});

const sheets = [];
function columnName(index) {
  let value = index + 1;
  let name = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange(true);
  const values = used ? used.values : [];
  const formulas = used ? used.formulas : [];
  sheets.push({ name: sheet.name, values, formulas });

  const maxColumns = Math.max(1, ...values.map(row => row.length));
  const previewRange = `A1:${columnName(Math.min(maxColumns, 14) - 1)}${Math.min(Math.max(values.length, 1), 40)}`;
  const preview = await workbook.render({
    sheetName: sheet.name,
    range: previewRange,
    scale: 1.5,
    format: 'png',
  });
  const safeName = sheet.name.replace(/[^a-z0-9_-]+/gi, '_');
  await fs.writeFile(path.join(outputDir, `${safeName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

await fs.writeFile(path.join(outputDir, 'item-workbook.json'), JSON.stringify({ sheets }, null, 2));

function text(value) {
  return String(value ?? '').trim();
}

function price(value) {
  const match = text(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function slug(value) {
  return text(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeUnit(value) {
  const original = text(value);
  const key = original.toUpperCase();
  return ({ PCS: 'Piece', KG: 'kg', LTR: 'L', ML: 'ml', BOX: 'Box', PKT: 'Packet', GALLON: 'Gallon', BAG: 'Bag', CTN: 'Carton', CAR: 'Carton', BACKET: 'Bucket', '6': 'Unit' })[key] || original || 'Unit';
}

const itemSheet = sheets.find(sheet => sheet.name === 'Item');
const itemRows = (itemSheet?.values || []).slice(1).filter(row => text(row[0]));
const importedMaterials = itemRows.map((row, index) => {
  const name = text(row[0]);
  const serial = text(row[1]);
  const description = text(row[2]);
  const originalUnit = text(row[4]);
  const unit = normalizeUnit(originalUnit);
  const currentRate = price(row[5]) || price(row[3]);
  const identity = `${slug(serial) || 'no-serial'}-${slug(name).slice(0, 48) || index + 2}`;
  return {
    id: `mat-xlsx-${identity}`,
    name,
    category: 'Imported Items',
    supplier: '',
    purchasePrice: currentRate,
    purchaseUnit: unit,
    yieldPct: 100,
    conversions: [{ qty: 1, unit }],
    notes: `Excel serial: ${serial} | Description: ${description || name} | Valuation: ${text(row[6]) || 'not provided'} | Original unit: ${originalUnit || 'not provided'}`,
  };
});

if (targetScript) {
  const payload = JSON.stringify(importedMaterials);
  const batch = crypto.createHash('sha256').update(payload).digest('hex').slice(0, 12);
  const source = `// Generated from Item.xlsx. Re-run tools/item_import.mjs to refresh.\nwindow.ImportedRawMaterialsBatch = ${JSON.stringify(`Item.xlsx-${batch}`)};\nwindow.ImportedRawMaterials = ${payload};\n`;
  await fs.writeFile(targetScript, source, 'utf8');
}

const importSummary = {
  importedRows: importedMaterials.length,
  zeroPriceRows: importedMaterials.filter(item => item.purchasePrice === 0).length,
  units: [...new Set(importedMaterials.map(item => item.purchaseUnit))].sort(),
  targetScript: targetScript || null,
};
await fs.writeFile(path.join(outputDir, 'item-import-summary.json'), JSON.stringify(importSummary, null, 2));
console.log(overview.ndjson);
console.log(formulaErrors.ndjson);
console.log(JSON.stringify({ sheets: sheets.map(sheet => ({ name: sheet.name, rows: sheet.values.length, columns: Math.max(0, ...sheet.values.map(row => row.length)) })), outputDir, importSummary }, null, 2));
