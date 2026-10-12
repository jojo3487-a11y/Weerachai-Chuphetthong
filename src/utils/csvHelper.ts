import { Product, ProductCategory } from '../types';

export interface CSVParseResult {
  products: Product[];
  errors: string[];
  totalRows: number;
}

const VALID_CATEGORIES: ProductCategory[] = [
  'เครื่องดื่ม',
  'ขนมและบะหมี่',
  'เครื่องปรุงและของแห้ง',
  'ของใช้ในบ้าน',
  'ไข่และของสด',
  'บุหรี่และของใช้ผู้ใหญ่',
];

/**
 * Split a CSV line respecting quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Normalize category string to a valid ProductCategory
 */
function normalizeCategory(raw: string): ProductCategory {
  const clean = raw.trim();
  const matched = VALID_CATEGORIES.find(c => c === clean || clean.includes(c));
  if (matched) return matched;

  // Fuzzy matches
  if (clean.includes('ดื่ม') || clean.includes('น้ำ') || clean.includes('กาแฟ') || clean.includes('นม')) {
    return 'เครื่องดื่ม';
  }
  if (clean.includes('ขนม') || clean.includes('มาม่า') || clean.includes('บะหมี่') || clean.includes('ซอง')) {
    return 'ขนมและบะหมี่';
  }
  if (clean.includes('ไข่') || clean.includes('สด') || clean.includes('ข้าว') || clean.includes('ผัก')) {
    return 'ไข่และของสด';
  }
  if (clean.includes('ซัก') || clean.includes('ล้าง') || clean.includes('ยาสระ') || clean.includes('บ้าน')) {
    return 'ของใช้ในบ้าน';
  }
  if (clean.includes('บุหรี่') || clean.includes('ไฟแช็ก') || clean.includes('เหล้า') || clean.includes('เบียร์')) {
    return 'บุหรี่และของใช้ผู้ใหญ่';
  }

  return 'เครื่องปรุงและของแห้ง';
}

/**
 * Parse CSV string to Product array
 */
export function parseCSVToProducts(csvText: string): CSVParseResult {
  // Remove UTF-8 BOM if present
  let cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) {
    return { products: [], errors: ['ไฟล์ CSV ว่างเปล่า'], totalRows: 0 };
  }

  // Detect delimiter (, or ;)
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  // Split lines
  const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return { products: [], errors: ['ไฟล์ต้องมีหัวตาราง (Header) และข้อมูลอย่างน้อย 1 รายการ'], totalRows: 0 };
  }

  // Parse header
  const rawHeaders = parseCSVLine(lines[0], delimiter).map(h => h.trim().toLowerCase());
  
  // Map header column indices
  let barcodeIdx = -1;
  let nameIdx = -1;
  let categoryIdx = -1;
  let costPriceIdx = -1;
  let sellPriceIdx = -1;
  let stockIdx = -1;
  let unitIdx = -1;
  let lowStockIdx = -1;
  let quickPickIdx = -1;

  rawHeaders.forEach((header, index) => {
    if (header.includes('บาร์โค้ด') || header.includes('barcode') || header.includes('code') || header.includes('รหัส')) {
      if (barcodeIdx === -1) barcodeIdx = index;
    } else if (header.includes('ชื่อ') || header.includes('name') || header.includes('รายการ') || header.includes('สินค้า')) {
      if (nameIdx === -1) nameIdx = index;
    } else if (header.includes('หมวด') || header.includes('category') || header.includes('ประเภท')) {
      if (categoryIdx === -1) categoryIdx = index;
    } else if (header.includes('ทุน') || header.includes('cost')) {
      if (costPriceIdx === -1) costPriceIdx = index;
    } else if (header.includes('ขาย') || header.includes('price') || header.includes('ราคาหน้าร้าน') || header.includes('ราคา')) {
      if (sellPriceIdx === -1) sellPriceIdx = index;
    } else if (header.includes('สต็อก') || header.includes('stock') || header.includes('คงเหลือ') || header.includes('จำนวน') || header.includes('qty')) {
      if (stockIdx === -1) stockIdx = index;
    } else if (header.includes('หน่วย') || header.includes('unit')) {
      if (unitIdx === -1) unitIdx = index;
    } else if (header.includes('เตือน') || header.includes('alert') || header.includes('ต่ำ') || header.includes('threshold')) {
      if (lowStockIdx === -1) lowStockIdx = index;
    } else if (header.includes('ขายดี') || header.includes('quick') || header.includes('ด่วน')) {
      if (quickPickIdx === -1) quickPickIdx = index;
    }
  });

  // Fallback if header names are not matching (assume standard positions)
  if (nameIdx === -1) nameIdx = 1;
  if (barcodeIdx === -1) barcodeIdx = 0;
  if (sellPriceIdx === -1) sellPriceIdx = 4;

  const products: Product[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i], delimiter);
    if (row.length === 0 || row.every(cell => !cell.trim())) continue;

    const name = nameIdx >= 0 && row[nameIdx] ? row[nameIdx].trim() : '';
    if (!name) {
      errors.push(`แถวที่ ${i + 1}: ข้ามเนื่องจากไม่มีชื่อสินค้า`);
      continue;
    }

    const rawBarcode = barcodeIdx >= 0 && row[barcodeIdx] ? row[barcodeIdx].trim() : '';
    const barcode = rawBarcode || `885${Date.now().toString().slice(-7)}${i.toString().padStart(3, '0')}`;
    
    const rawCategory = categoryIdx >= 0 && row[categoryIdx] ? row[categoryIdx].trim() : '';
    const category = normalizeCategory(rawCategory);

    const rawCost = costPriceIdx >= 0 && row[costPriceIdx] ? parseFloat(row[costPriceIdx].replace(/[^0-9.]/g, '')) : 0;
    const costPrice = isNaN(rawCost) ? 0 : rawCost;

    const rawSell = sellPriceIdx >= 0 && row[sellPriceIdx] ? parseFloat(row[sellPriceIdx].replace(/[^0-9.]/g, '')) : 0;
    const sellPrice = isNaN(rawSell) || rawSell <= 0 ? (costPrice > 0 ? Math.round(costPrice * 1.25) : 10) : rawSell;

    const rawStock = stockIdx >= 0 && row[stockIdx] ? parseInt(row[stockIdx].replace(/[^0-9-]/g, '')) : 10;
    const stock = isNaN(rawStock) ? 10 : rawStock;

    const unit = unitIdx >= 0 && row[unitIdx] ? row[unitIdx].trim() : 'ชิ้น';

    const rawLow = lowStockIdx >= 0 && row[lowStockIdx] ? parseInt(row[lowStockIdx].replace(/[^0-9]/g, '')) : 5;
    const lowStockThreshold = isNaN(rawLow) ? 5 : rawLow;

    let quickPick = false;
    if (quickPickIdx >= 0 && row[quickPickIdx]) {
      const qVal = row[quickPickIdx].trim().toLowerCase();
      quickPick = qVal === 'yes' || qVal === 'true' || qVal === '1' || qVal === 'ใช่' || qVal === 'ขายดี';
    }

    products.push({
      id: `prod-csv-${Date.now()}-${i}`,
      barcode,
      name,
      category,
      costPrice,
      sellPrice,
      stock,
      unit: unit || 'ชิ้น',
      lowStockThreshold,
      quickPick,
    });
  }

  return {
    products,
    errors,
    totalRows: lines.length - 1,
  };
}

/**
 * Generate CSV text with UTF-8 BOM so Thai characters open cleanly in Microsoft Excel
 */
export function exportProductsToCSV(products: Product[]): string {
  const header = ['บาร์โค้ด', 'ชื่อสินค้า', 'หมวดหมู่', 'ราคาทุน', 'ราคาขาย', 'จำนวนคงเหลือ', 'หน่วยนับ', 'จุดเตือนใกล้หมด', 'ขายดีด่วน'];
  
  const escapeCell = (val: string | number | boolean): string => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = products.map(p => [
    escapeCell(p.barcode),
    escapeCell(p.name),
    escapeCell(p.category),
    escapeCell(p.costPrice.toFixed(2)),
    escapeCell(p.sellPrice.toFixed(2)),
    escapeCell(p.stock),
    escapeCell(p.unit),
    escapeCell(p.lowStockThreshold),
    escapeCell(p.quickPick ? 'ใช่' : 'ไม่'),
  ].join(','));

  // Prepend UTF-8 BOM (\uFEFF)
  return '\uFEFF' + [header.join(','), ...rows].join('\r\n');
}

/**
 * Sample CSV template content for download
 */
export function getSampleCSVContent(): string {
  const sampleProducts: Product[] = [
    {
      id: 'sample-1',
      barcode: '8850987101011',
      name: 'มาม่า ต้มยำกุ้งน้ำข้น (ซอง)',
      category: 'ขนมและบะหมี่',
      costPrice: 5.8,
      sellPrice: 7.0,
      stock: 48,
      unit: 'ซอง',
      lowStockThreshold: 10,
      quickPick: true,
    },
    {
      id: 'sample-2',
      barcode: '8851959132014',
      name: 'โค้ก ออริจินัล 325ml (กระป๋องเย็น)',
      category: 'เครื่องดื่ม',
      costPrice: 12.0,
      sellPrice: 15.0,
      stock: 30,
      unit: 'กระป๋อง',
      lowStockThreshold: 8,
      quickPick: true,
    },
    {
      id: 'sample-3',
      barcode: '8850024010011',
      name: 'น้ำปลาทิพรส 700ml',
      category: 'เครื่องปรุงและของแห้ง',
      costPrice: 28.0,
      sellPrice: 34.0,
      stock: 16,
      unit: 'ขวด',
      lowStockThreshold: 4,
      quickPick: true,
    },
    {
      id: 'sample-4',
      barcode: '8850066002228',
      name: 'น้ำยาล้างจานซันไลต์ 750ml',
      category: 'ของใช้ในบ้าน',
      costPrice: 28.0,
      sellPrice: 35.0,
      stock: 15,
      unit: 'ถุง',
      lowStockThreshold: 3,
      quickPick: false,
    },
    {
      id: 'sample-5',
      barcode: '8850055001111',
      name: 'ไข่ไก่สดเบอร์ 2',
      category: 'ไข่และของสด',
      costPrice: 3.8,
      sellPrice: 5.0,
      stock: 90,
      unit: 'ฟอง',
      lowStockThreshold: 20,
      quickPick: true,
    },
  ];

  return exportProductsToCSV(sampleProducts);
}

/**
 * Trigger file download in browser
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
