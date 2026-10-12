import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Banknote, 
  QrCode, 
  BookOpen, 
  Receipt, 
  Printer, 
  Eye, 
  Filter,
  FileSpreadsheet,
  Search,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Calendar,
  Package
} from 'lucide-react';
import { SaleRecord, StoreSettings } from '../types';
import { exportSalesToExcel } from '../utils/excelHelper';
import { playTouchClickSound } from '../utils/sound';

interface SalesReportsViewProps {
  sales: SaleRecord[];
  settings: StoreSettings;
  onViewReceipt: (sale: SaleRecord) => void;
  onOpenPastBills?: () => void;
}

export const SalesReportsView: React.FC<SalesReportsViewProps> = ({
  sales,
  settings,
  onViewReceipt,
  onOpenPastBills,
}) => {
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | 'month'>('all');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Helper date
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter((s) => {
      // 1. Payment method
      if (filterMethod !== 'all' && s.paymentMethod !== filterMethod) {
        return false;
      }

      // 2. Date range
      const saleDate = new Date(s.timestamp);
      if (dateRange === 'today') {
        if (!isSameDay(saleDate, today)) return false;
      } else if (dateRange === '7days') {
        if (saleDate < sevenDaysAgo) return false;
      } else if (dateRange === 'month') {
        if (saleDate < firstDayOfMonth) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = s.id.toLowerCase().includes(q);
        const matchCustomer = s.customerName?.toLowerCase().includes(q);
        const matchItem = s.items.some((i) => i.name.toLowerCase().includes(q) || i.barcode?.includes(q));
        if (!matchId && !matchCustomer && !matchItem) return false;
      }

      return true;
    });
  }, [sales, filterMethod, dateRange, searchQuery]);

  // KPI Calculations based on filtered or all sales
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
  const totalBills = filteredSales.length;

  const cashSales = filteredSales
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.total, 0);

  const promptPaySales = filteredSales
    .filter((s) => s.paymentMethod === 'promptpay')
    .reduce((sum, s) => sum + s.total, 0);

  const creditSales = filteredSales
    .filter((s) => s.paymentMethod === 'credit')
    .reduce((sum, s) => sum + s.total, 0);

  // Top selling products aggregation
  const productSalesMap: { [name: string]: { name: string; qty: number; revenue: number } } = {};
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSalesMap[item.name]) {
        productSalesMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.name].qty += item.quantity;
      productSalesMap[item.name].revenue += item.total;
    });
  });

  const topSelling = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxQty = topSelling.length > 0 ? topSelling[0].qty : 1;

  const toggleExpand = (saleId: string) => {
    playTouchClickSound();
    setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200 space-y-1">
          <span className="text-xs text-stone-500 font-medium">ยอดขายรวม ({dateRange === 'all' ? 'ทั้งหมด' : dateRange === 'today' ? 'วันนี้' : dateRange === '7days' ? '7 วัน' : 'เดือนนี้'})</span>
          <div className="text-2xl font-black text-stone-900 font-mono tabular-nums">
            ฿{totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-stone-400">จาก {totalBills} บิล</p>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200 space-y-1">
          <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>กำไรเบื้องต้น</span>
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
            ฿{totalProfit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-stone-400">หักต้นทุนสินค้าแล้ว</p>
        </div>

        {/* Cash vs QR */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200 space-y-1">
          <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            <span>เงินสด / พร้อมเพย์</span>
          </span>
          <div className="text-lg font-bold text-stone-800 font-mono tabular-nums">
            สด ฿{cashSales.toLocaleString()}
          </div>
          <p className="text-xs text-blue-700 font-mono font-medium">
            โอน ฿{promptPaySales.toLocaleString()}
          </p>
        </div>

        {/* Credit Debt Sold */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200 space-y-1">
          <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>ยอดแปะโป้ง (จดเชื่อ)</span>
          </span>
          <div className="text-2xl font-black text-amber-700 font-mono tabular-nums">
            ฿{creditSales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-stone-400">รอเก็บเงินตามรอบ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top Selling Products List (Left 5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-stone-900">สินค้าขายดี 5 อันดับแรก</h3>
            </div>
            <span className="text-[11px] text-stone-400">ตามจำนวนชิ้น</span>
          </div>

          <div className="space-y-3">
            {topSelling.map((item, idx) => {
              const percent = Math.round((item.qty / maxQty) * 100);
              return (
                <div key={item.name} className="space-y-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-stone-800 truncate max-w-[200px]">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="font-mono font-bold text-stone-900 tabular-nums">
                      {item.qty} ชิ้น (฿{item.revenue.toLocaleString()})
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {topSelling.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-6">
                ยังไม่มีข้อมูลการขายสินค้าตามตัวกรองนี้
              </p>
            )}
          </div>
        </div>

        {/* All Sales History / Receipts (Right 7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden space-y-0">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-stone-600" />
              <h3 className="font-bold text-sm text-stone-900">
                ประวัติการเปิดบิลขาย ({filteredSales.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {onOpenPastBills && (
                <button
                  onClick={() => { playTouchClickSound(); onOpenPastBills(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg shadow-2xs transition-colors cursor-pointer touch-btn"
                  title="เปิดหน้าต่างค้นหาและดูรายละเอียดบิลย้อนหลังแบบเต็มจอ"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>ดูบิลละเอียดเต็มจอ</span>
                </button>
              )}

              <button
                onClick={() => exportSalesToExcel(filteredSales, settings)}
                disabled={filteredSales.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="ส่งออกรายงานยอดขายและประวัติบิลที่กรองเป็น Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Filter Bar in Report Card */}
          <div className="p-3 bg-white border-b border-stone-100 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto flex-1">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นเลขที่บิล, ชื่อสินค้า, หรือลูกค้า..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              {/* Date Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:outline-hidden"
              >
                <option value="all">ทุกช่วงเวลา</option>
                <option value="today">วันนี้</option>
                <option value="7days">7 วันล่าสุด</option>
                <option value="month">เดือนนี้</option>
              </select>

              {/* Payment Filter */}
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:outline-hidden"
              >
                <option value="all">ทุกวิธีชำระ</option>
                <option value="cash">เงินสด</option>
                <option value="promptpay">พร้อมเพย์ QR</option>
                <option value="credit">แปะโป้ง</option>
              </select>
            </div>
          </div>

          {/* Bill list with expandable details */}
          <div className="divide-y divide-stone-100 max-h-[540px] overflow-y-auto">
            {filteredSales.map((sale) => {
              const isExpanded = expandedSaleId === sale.id;

              return (
                <div
                  key={sale.id}
                  className="transition-colors hover:bg-stone-50/70"
                >
                  <div
                    onClick={() => toggleExpand(sale.id)}
                    className="p-4 flex items-center justify-between gap-3 text-xs cursor-pointer select-none"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">
                          {sale.id}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {new Date(sale.timestamp).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          {new Date(sale.timestamp).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-stone-500 truncate mt-0.5 max-w-[280px]">
                        {sale.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-[11px]">
                        {sale.paymentMethod === 'cash' && (
                          <span className="text-emerald-700 font-medium">เงินสด</span>
                        )}
                        {sale.paymentMethod === 'promptpay' && (
                          <span className="text-blue-700 font-medium">สแกนพร้อมเพย์</span>
                        )}
                        {sale.paymentMethod === 'credit' && (
                          <span className="text-amber-800 font-medium">
                            แปะโป้ง: {sale.customerName}
                          </span>
                        )}
                        <span className="text-stone-400">· {sale.items.length} รายการ</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <div className="font-mono font-bold text-sm text-stone-900 tabular-nums">
                          ฿{sale.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-mono tabular-nums">
                          กำไร +฿{sale.profit.toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTouchClickSound();
                          onViewReceipt(sale);
                        }}
                        title="ดูใบเสร็จ / พิมพ์ซ้ำ"
                        className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <div className="text-stone-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Item Breakdown Details */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 bg-amber-50/30 border-t border-dashed border-stone-200 text-xs space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold pt-1">
                        <span>รายละเอียดสินค้าในบิล:</span>
                        <span>{sale.items.length} รายการ</span>
                      </div>

                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-stone-200">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="truncate max-w-[220px]">
                              <span className="font-medium text-stone-800">{item.name}</span>
                              <span className="text-stone-400 text-[10px] ml-1.5">
                                ({item.quantity} {item.unit || 'ชิ้น'} × ฿{item.sellPrice})
                              </span>
                            </div>
                            <div className="font-mono font-bold text-stone-900 tabular-nums">
                              ฿{item.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        ))}

                        <div className="pt-2 border-t border-stone-100 flex justify-between font-mono text-[11px] text-stone-500">
                          <span>ยอดรวมสินค้า: ฿{sale.subtotal.toFixed(2)}</span>
                          {sale.discount > 0 && <span>ส่วนลด: -฿{sale.discount.toFixed(2)}</span>}
                          <span className="font-bold text-stone-900">สุทธิ: ฿{sale.total.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            playTouchClickSound();
                            onViewReceipt(sale);
                          }}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer touch-btn"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>พิมพ์สลิปใบเสร็จ</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSales.length === 0 && (
              <div className="p-12 text-center text-stone-400 text-xs">
                ยังไม่มีข้อมูลการขายในหมวดนี้ หรือไม่ตรงกับเงื่อนไขค้นหา
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
