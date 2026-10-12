import * as XLSX from 'xlsx';
import { CustomerDebt, StoreSettings } from '../types';

/**
 * Export full debt ledger report into an Excel (.xlsx) file with multiple worksheets
 */
export function exportDebtLedgerToExcel(
  debts: CustomerDebt[],
  settings: StoreSettings
) {
  const workbook = XLSX.utils.book_new();
  const todayStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ==========================================
  // Sheet 1: สรุปยอดลูกหนี้คงค้าง (Summary Sheet)
  // ==========================================
  const summaryData: (string | number)[][] = [
    [`รายงานสรุปยอดลูกหนี้สมุดแปะโป้ง - ${settings.storeName}`],
    [`วันที่ออกรายงาน: ${todayStr} | เบอร์โทรติดต่อร้าน: ${settings.phone}`],
    [], // empty row
    [
      'ลำดับ',
      'ชื่อลูกค้า',
      'เบอร์โทรศัพท์',
      'ที่อยู่ / จุดสังเกต',
      'ยอดหนี้คงค้าง (บาท)',
      'ยอดหยิบเชื่อรวม (บาท)',
      'ยอดจ่ายคืนรวม (บาท)',
      'จำนวนรายการ',
      'วันที่บันทึกล่าสุด',
    ],
  ];

  let grandTotalDebt = 0;
  let grandTotalBorrowed = 0;
  let grandTotalRepaid = 0;

  debts.forEach((cust, index) => {
    const totalBorrowed = cust.transactions
      .filter((t) => t.type === 'borrow')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRepaid = cust.transactions
      .filter((t) => t.type === 'repay')
      .reduce((sum, t) => sum + t.amount, 0);

    grandTotalDebt += cust.totalDebt;
    grandTotalBorrowed += totalBorrowed;
    grandTotalRepaid += totalRepaid;

    summaryData.push([
      index + 1,
      cust.name,
      cust.phone || '-',
      cust.addressOrNote || '-',
      cust.totalDebt,
      totalBorrowed,
      totalRepaid,
      cust.transactions.length,
      new Date(cust.updatedAt).toLocaleDateString('th-TH'),
    ]);
  });

  // Total Summary Row
  summaryData.push([]);
  summaryData.push([
    'รวมทั้งหมด',
    `${debts.length} ราย`,
    '',
    '',
    grandTotalDebt,
    grandTotalBorrowed,
    grandTotalRepaid,
    '',
    '',
  ]);

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths for Sheet 1
  summarySheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 26 }, // ชื่อลูกค้า
    { wch: 16 }, // เบอร์โทร
    { wch: 32 }, // ที่อยู่/จุดสังเกต
    { wch: 20 }, // ยอดหนี้คงค้าง
    { wch: 20 }, // ยอดหยิบเชื่อรวม
    { wch: 20 }, // ยอดจ่ายคืนรวม
    { wch: 14 }, // จำนวนรายการ
    { wch: 18 }, // วันที่อัปเดต
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุปยอดหนี้คงค้าง');

  // ==========================================
  // Sheet 2: ประวัติรายการแปะ-จ่ายคืน ทั้งหมด (Detailed Transaction History)
  // ==========================================
  const historyData: (string | number)[][] = [
    [`บันทึกรายการแปะโป้งและจ่ายคืนทั้งหมด - ${settings.storeName}`],
    [`ข้อมูล ณ วันที่: ${todayStr}`],
    [],
    [
      'ลำดับ',
      'วันที่-เวลา',
      'ชื่อลูกค้า',
      'ประเภทรายการ',
      'จำนวนเงิน (บาท)',
      'รายละเอียดสินค้า / หมายเหตุ',
      'เลขที่บิลอ้างอิง',
    ],
  ];

  // Flatten all transactions with customer name, sorted newest first
  interface FlatTx {
    date: string;
    customerName: string;
    type: 'borrow' | 'repay';
    amount: number;
    note: string;
    saleId?: string;
  }

  const allTx: FlatTx[] = [];
  debts.forEach((cust) => {
    cust.transactions.forEach((tx) => {
      allTx.push({
        date: tx.date,
        customerName: cust.name,
        type: tx.type,
        amount: tx.amount,
        note: tx.note,
        saleId: tx.saleId,
      });
    });
  });

  allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  allTx.forEach((tx, idx) => {
    historyData.push([
      idx + 1,
      new Date(tx.date).toLocaleString('th-TH'),
      tx.customerName,
      tx.type === 'borrow' ? 'หยิบของเชื่อ (แปะโป้ง)' : 'นำเงินมาจ่ายคืน',
      tx.type === 'borrow' ? tx.amount : -tx.amount,
      tx.note,
      tx.saleId || '-',
    ]);
  });

  const historySheet = XLSX.utils.aoa_to_sheet(historyData);

  // Set column widths for Sheet 2
  historySheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 22 }, // วันที่-เวลา
    { wch: 24 }, // ชื่อลูกค้า
    { wch: 22 }, // ประเภทรายการ
    { wch: 18 }, // จำนวนเงิน
    { wch: 45 }, // รายละเอียด
    { wch: 22 }, // เลขที่บิล
  ];

  XLSX.utils.book_append_sheet(workbook, historySheet, 'ประวัติรายการทั้งหมด');

  // Generate binary and trigger download
  const dateFormatted = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `รายงานสมุดแปะโป้ง_${dateFormatted}.xlsx`);
}

/**
 * Export individual customer statement report into an Excel (.xlsx) file
 */
export function exportSingleCustomerDebtToExcel(
  customer: CustomerDebt,
  settings: StoreSettings
) {
  const workbook = XLSX.utils.book_new();
  const todayStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const data: (string | number)[][] = [
    [`ใบแจ้งยอดหนี้และประวัติการซื้อเชื่อ (แปะโป้ง) - ${settings.storeName}`],
    [`ชื่อลูกค้า: ${customer.name}`],
    [`เบอร์โทรศัพท์: ${customer.phone || '-'} | ที่อยู่/บันทึก: ${customer.addressOrNote || '-'}`],
    [`ยอดค้างชำระปัจจุบัน: ฿${customer.totalDebt.toLocaleString()} บาท (ข้อมูล ณ วันที่ ${todayStr})`],
    [],
    [
      'ลำดับ',
      'วันที่-เวลา',
      'ประเภท',
      'รายละเอียด / สินค้าที่ซื้อ',
      'ยอดเชื่อ (+บาท)',
      'ยอดจ่ายคืน (-บาท)',
      'เลขที่บิล',
    ],
  ];

  let totalBorrowed = 0;
  let totalRepaid = 0;

  customer.transactions.forEach((tx, idx) => {
    const isBorrow = tx.type === 'borrow';
    if (isBorrow) totalBorrowed += tx.amount;
    else totalRepaid += tx.amount;

    data.push([
      idx + 1,
      new Date(tx.date).toLocaleString('th-TH'),
      isBorrow ? 'หยิบของเชื่อ' : 'ชำระหนี้คืน',
      tx.note,
      isBorrow ? tx.amount : '',
      !isBorrow ? tx.amount : '',
      tx.saleId || '-',
    ]);
  });

  data.push([]);
  data.push([
    'สรุปรวม',
    '',
    '',
    '',
    totalBorrowed,
    totalRepaid,
    `คงค้าง: ฿${customer.totalDebt.toLocaleString()}`,
  ]);

  const sheet = XLSX.utils.aoa_to_sheet(data);

  sheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 22 }, // วันที่
    { wch: 16 }, // ประเภท
    { wch: 45 }, // รายละเอียด
    { wch: 18 }, // ยอดเชื่อ
    { wch: 18 }, // ยอดจ่ายคืน
    { wch: 22 }, // เลขที่บิล
  ];

  const safeCustomerName = customer.name.replace(/[/\\?%*:|"<>]/g, '_');
  XLSX.utils.book_append_sheet(workbook, sheet, 'ประวัติบัญชี');
  XLSX.writeFile(workbook, `สเตทเมนต์แปะโป้ง_${safeCustomerName}.xlsx`);
}

/**
 * Export daily/historical sales records and profit summary to Excel (.xlsx)
 */
export function exportSalesToExcel(
  sales: import('../types').SaleRecord[],
  settings: StoreSettings
) {
  const workbook = XLSX.utils.book_new();
  const todayStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const salesData: (string | number)[][] = [
    [`รายงานประวัติการขายสินค้าและกำไร - ${settings.storeName}`],
    [`ข้อมูล ณ วันที่: ${todayStr} | เบอร์โทรร้าน: ${settings.phone}`],
    [],
    [
      'ลำดับ',
      'เลขที่บิล',
      'วันที่-เวลา',
      'วิธีชำระเงิน',
      'ลูกค้า/หมายเหตุ',
      'รายการสินค้าที่ขาย',
      'ยอดขายรวม (บาท)',
      'ต้นทุนรวม (บาท)',
      'กำไรสุทธิ (บาท)',
    ],
  ];

  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;

  sales.forEach((s, idx) => {
    totalRevenue += s.total;
    totalCost += s.totalCost;
    totalProfit += s.profit;

    const itemsSummary = s.items.map((i) => `${i.name} x${i.quantity}`).join(', ');
    const paymentLabel =
      s.paymentMethod === 'cash'
        ? 'เงินสด'
        : s.paymentMethod === 'promptpay'
        ? 'พร้อมเพย์ QR'
        : `แปะโป้ง (${s.customerName || 'ลูกค้า'})`;

    salesData.push([
      idx + 1,
      s.id,
      new Date(s.timestamp).toLocaleString('th-TH'),
      paymentLabel,
      s.customerName || '-',
      itemsSummary,
      s.total,
      s.totalCost,
      s.profit,
    ]);
  });

  salesData.push([]);
  salesData.push([
    'รวมทั้งหมด',
    `${sales.length} บิล`,
    '',
    '',
    '',
    '',
    totalRevenue,
    totalCost,
    totalProfit,
  ]);

  const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
  salesSheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 22 }, // เลขที่บิล
    { wch: 22 }, // วันที่
    { wch: 20 }, // วิธีชำระ
    { wch: 20 }, // ลูกค้า
    { wch: 45 }, // รายการ
    { wch: 18 }, // ยอดขาย
    { wch: 18 }, // ต้นทุน
    { wch: 18 }, // กำไร
  ];

  XLSX.utils.book_append_sheet(workbook, salesSheet, 'ประวัติการขาย');

  const dateFormatted = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `รายงานยอดขาย_${dateFormatted}.xlsx`);
}

