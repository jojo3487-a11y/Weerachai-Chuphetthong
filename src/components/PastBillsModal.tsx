import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Calendar, 
  Printer, 
  Receipt, 
  Banknote, 
  QrCode, 
  BookOpen, 
  RotateCcw, 
  Copy, 
  Check, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Package,
  CalendarDays,
  ShoppingBag,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { SaleRecord, StoreSettings, Product } from '../types';
import { exportSalesToExcel } from '../utils/excelHelper';
import { playTouchClickSound, playSuccessSound } from '../utils/sound';

interface PastBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleRecord[];
  products: Product[];
  settings: StoreSettings;
  onViewReceiptSlip: (sale: SaleRecord) => void;
  onReorderToCart?: (sale: SaleRecord) => void;
}

type DateFilterOption = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';

export const PastBillsModal: React.FC<PastBillsModalProps> = ({
  isOpen,
  onClose,
  sales,
  products,
  settings,
  onViewReceiptSlip,
  onReorderToCart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('today');
  const [customDate, setCustomDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [showProfitDetail, setShowProfitDetail] = useState(false);

  // Helper date matching
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Filtered sales list
  const filteredSales = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter((sale) => {
      const saleDate = new Date(sale.timestamp);

      // 1. Date filter
      if (dateFilter === 'today') {
        if (!isSameDay(saleDate, today)) return false;
      } else if (dateFilter === 'yesterday') {
        if (!isSameDay(saleDate, yesterday)) return false;
      } else if (dateFilter === 'week') {
        if (saleDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'month') {
        if (saleDate < firstDayOfMonth) return false;
      } else if (dateFilter === 'custom' && customDate) {
        const [y, m, d] = customDate.split('-').map(Number);
        const targetDate = new Date(y, m - 1, d);
        if (!isSameDay(saleDate, targetDate)) return false;
      }

      // 2. Payment Method filter
      if (paymentFilter !== 'all' && sale.paymentMethod !== paymentFilter) {
        return false;
      }

      // 3. Search query (Bill ID, Customer Name, Item Name, Barcode)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = sale.id.toLowerCase().includes(q);
        const matchCustomer = sale.customerName?.toLowerCase().includes(q);
        const matchNote = sale.note?.toLowerCase().includes(q);
        const matchItem = sale.items.some(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.barcode?.toLowerCase().includes(q)
        );
        if (!matchId && !matchCustomer && !matchNote && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [sales, dateFilter, customDate, paymentFilter, searchQuery]);

  // Selected sale
  const activeSale = useMemo(() => {
    if (!selectedSaleId) {
      return filteredSales.length > 0 ? filteredSales[0] : null;
    }
    return sales.find((s) => s.id === selectedSaleId) || (filteredSales.length > 0 ? filteredSales[0] : null);
  }, [sales, selectedSaleId, filteredSales]);

  // Aggregate stats of filtered bills
  const summaryStats = useMemo(() => {
    const totalAmount = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
    const cashTotal = filteredSales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((acc, s) => acc + s.total, 0);
    const promptPayTotal = filteredSales
      .filter((s) => s.paymentMethod === 'promptpay')
      .reduce((acc, s) => acc + s.total, 0);
    const creditTotal = filteredSales
      .filter((s) => s.paymentMethod === 'credit')
      .reduce((acc, s) => acc + s.total, 0);

    return {
      count: filteredSales.length,
      totalAmount,
      totalProfit,
      cashTotal,
      promptPayTotal,
      creditTotal,
    };
  }, [filteredSales]);

  if (!isOpen) return null;

  const handleCopyBillInfo = () => {
    if (!activeSale) return;
    playTouchClickSound();
    const itemsText = activeSale.items
      .map((it) => `- ${it.name} x${it.quantity} ${it.unit || 'ชิ้น'} = ฿${it.total.toFixed(2)}`)
      .join('\n');
    const text = `บิลเลขที่: ${activeSale.id}\nวันที่: ${new Date(activeSale.timestamp).toLocaleString('th-TH')}\nร้าน: ${settings.storeName}\nยอดสุทธิ: ฿${activeSale.total.toFixed(2)}\nวิธีชำระ: ${activeSale.paymentMethod}\nรายการ:\n${itemsText}`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleReorder = () => {
    if (!activeSale || !onReorderToCart) return;
    playSuccessSound();
    onReorderToCart(activeSale);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-stone-50 rounded-2xl shadow-2xl w-full max-w-5xl h-[94vh] flex flex-col border border-stone-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="past-bills-title"
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 id="past-bills-title" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                เรียกดูบิลย้อนหลัง
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                  {summaryStats.count} บิล
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                ตรวจสอบประวัติบิล รายละเอียดสินค้า และพิมพ์ใบเสร็จย้อนหลัง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playTouchClickSound();
                exportSalesToExcel(filteredSales, settings);
              }}
              disabled={filteredSales.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer touch-btn"
              title="ส่งออกรายการบิลที่ค้นหาเป็น Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออก Excel</span>
            </button>

            <button
              onClick={() => {
                playTouchClickSound();
                onClose();
              }}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer touch-btn"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="bg-white p-3 sm:p-4 border-b border-stone-200 shrink-0 space-y-3">
          {/* Row 1: Search & Date Pills */}
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเลขที่บิล (RCP-...), ชื่อสินค้า, หรือลูกค้าแปะโป้ง..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Date Filters */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs">
              <button
                onClick={() => { playTouchClickSound(); setDateFilter('today'); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer touch-btn ${
                  dateFilter === 'today'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                วันนี้
              </button>
              <button
                onClick={() => { playTouchClickSound(); setDateFilter('yesterday'); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer touch-btn ${
                  dateFilter === 'yesterday'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                เมื่อวาน
              </button>
              <button
                onClick={() => { playTouchClickSound(); setDateFilter('week'); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer touch-btn ${
                  dateFilter === 'week'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                7 วัน
              </button>
              <button
                onClick={() => { playTouchClickSound(); setDateFilter('month'); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer touch-btn ${
                  dateFilter === 'month'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                เดือนนี้
              </button>
              <button
                onClick={() => { playTouchClickSound(); setDateFilter('all'); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer touch-btn ${
                  dateFilter === 'all'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                ทั้งหมด
              </button>

              <div className="flex items-center gap-1 pl-1">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setDateFilter('custom');
                  }}
                  className={`px-2 py-1 text-xs border rounded-lg focus:outline-hidden ${
                    dateFilter === 'custom'
                      ? 'border-amber-500 bg-amber-50/50 text-stone-900 font-semibold'
                      : 'border-stone-200 bg-stone-50 text-stone-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Payment Filter Tabs & Quick Stats */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-400 text-[11px] mr-1">วิธีชำระ:</span>
              <button
                onClick={() => { playTouchClickSound(); setPaymentFilter('all'); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer touch-btn ${
                  paymentFilter === 'all'
                    ? 'bg-stone-800 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => { playTouchClickSound(); setPaymentFilter('cash'); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer touch-btn ${
                  paymentFilter === 'cash'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Banknote className="w-3 h-3" />
                <span>เงินสด</span>
              </button>
              <button
                onClick={() => { playTouchClickSound(); setPaymentFilter('promptpay'); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer touch-btn ${
                  paymentFilter === 'promptpay'
                    ? 'bg-blue-700 text-white font-bold'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                <QrCode className="w-3 h-3" />
                <span>พร้อมเพย์</span>
              </button>
              <button
                onClick={() => { playTouchClickSound(); setPaymentFilter('credit'); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer touch-btn ${
                  paymentFilter === 'credit'
                    ? 'bg-amber-700 text-white font-bold'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>แปะโป้ง</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="text-stone-600">
                ยอดรวม: <span className="font-bold text-stone-900 tabular-nums">฿{summaryStats.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="text-emerald-700 font-semibold hidden sm:inline-block">
                (กำไร ~฿{summaryStats.totalProfit.toLocaleString('th-TH', { minimumFractionDigits: 2 })})
              </div>
            </div>
          </div>
        </div>

        {/* Content Body: 2-Column Master-Detail Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-stone-200 overflow-hidden">
          {/* Left Column (5 Cols): Bills List (Responsive: full width on mobile when no bill selected, hidden on mobile when viewing bill detail) */}
          <div className={`${selectedSaleId ? 'hidden md:flex' : 'flex'} md:col-span-5 flex-col min-h-0 bg-white`}>
            <div className="p-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>รายการบิล ({filteredSales.length})</span>
              <span>คลิกเพื่อดูรายละเอียด</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-1.5 space-y-1">
              {filteredSales.map((sale) => {
                const isSelected = activeSale?.id === sale.id;
                const saleDate = new Date(sale.timestamp);
                const timeString = saleDate.toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const dateString = saleDate.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                });

                return (
                  <button
                    key={sale.id}
                    onClick={() => {
                      playTouchClickSound();
                      setSelectedSaleId(sale.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer touch-btn ${
                      isSelected
                        ? 'bg-amber-500/10 border-2 border-amber-500 shadow-xs'
                        : 'hover:bg-stone-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-stone-900">
                            {sale.id}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {dateString} {timeString}
                          </span>
                        </div>

                        {/* Customer note if any */}
                        {sale.customerName && (
                          <div className="text-[11px] text-amber-800 font-medium truncate mt-0.5">
                            ลูกค้า: {sale.customerName}
                          </div>
                        )}

                        {/* Items preview snippet */}
                        <p className="text-[11px] text-stone-500 truncate mt-1">
                          {sale.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5">
                          {sale.paymentMethod === 'cash' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <Banknote className="w-2.5 h-2.5" />
                              <span>เงินสด</span>
                            </span>
                          )}
                          {sale.paymentMethod === 'promptpay' && (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              sale.qrProvider === 'kshop'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sale.qrProvider === 'tungngern'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              <QrCode className="w-2.5 h-2.5" />
                              <span>
                                {sale.qrProvider === 'kshop'
                                  ? 'K SHOP'
                                  : sale.qrProvider === 'tungngern'
                                  ? 'ถุงเงิน'
                                  : 'พร้อมเพย์ QR'}
                              </span>
                            </span>
                          )}
                          {sale.paymentMethod === 'credit' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900">
                              <BookOpen className="w-2.5 h-2.5" />
                              <span>แปะโป้ง</span>
                            </span>
                          )}
                          <span className="text-[10px] text-stone-400">
                            {sale.items.length} รายการ
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black font-mono text-stone-900 tabular-nums">
                          ฿{sale.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-mono">
                          กำไร +฿{sale.profit.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredSales.length === 0 && (
                <div className="py-16 text-center text-stone-400 space-y-2">
                  <Receipt className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">ไม่พบประวัติบิลตามเงื่อนไขที่ค้นหา</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (7 Cols): Full Detailed Bill Breakdown (Responsive: full width on mobile when bill selected, hidden on mobile when viewing list) */}
          <div className={`${!selectedSaleId ? 'hidden md:flex' : 'flex'} md:col-span-7 flex-col min-h-0 bg-stone-50 overflow-y-auto`}>
            {activeSale ? (
              <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
                {/* Mobile Back Button (< md) */}
                <div className="md:hidden pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSaleId(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-stone-950 text-xs font-bold shadow-2xs touch-btn cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>กลับไปหน้ารายการบิล</span>
                  </button>
                </div>

                {/* Active Bill Header Card */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 font-medium">เลขที่บิล:</span>
                        <span className="font-mono font-black text-base text-stone-900">
                          {activeSale.id}
                        </span>
                        <button
                          onClick={handleCopyBillInfo}
                          className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                          title="คัดลอกข้อมูลบิล"
                        >
                          {copiedId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {new Date(activeSale.timestamp).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Payment Status Pill */}
                    <div className="shrink-0">
                      {activeSale.paymentMethod === 'cash' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          <Banknote className="w-3.5 h-3.5" />
                          <span>ชำระด้วยเงินสด</span>
                        </span>
                      )}
                      {activeSale.paymentMethod === 'promptpay' && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          activeSale.qrProvider === 'kshop'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : activeSale.qrProvider === 'tungngern'
                            ? 'bg-sky-100 text-sky-950 border-sky-300'
                            : 'bg-blue-100 text-blue-900 border-blue-200'
                        }`}>
                          <QrCode className="w-3.5 h-3.5" />
                          <span>
                            {activeSale.qrProvider === 'kshop'
                              ? 'ชำระด้วย K SHOP QR (กสิกรไทย)'
                              : activeSale.qrProvider === 'tungngern'
                              ? 'ชำระด้วย ถุงเงิน QR (กรุงไทย)'
                              : 'ชำระด้วย พร้อมเพย์ QR'}
                          </span>
                        </span>
                      )}
                      {activeSale.paymentMethod === 'credit' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>บันทึกแปะโป้ง (ค้างชำระ)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Details (Cash received / change or Credit debtor) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-stone-400 text-[11px]">ยอดสุทธิ</span>
                      <div className="font-mono font-bold text-sm text-stone-900 tabular-nums">
                        ฿{activeSale.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {activeSale.paymentMethod === 'cash' && (
                      <>
                        <div>
                          <span className="text-stone-400 text-[11px]">รับเงินมา</span>
                          <div className="font-mono font-semibold text-sm text-stone-800 tabular-nums">
                            ฿{(activeSale.cashReceived || activeSale.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <span className="text-stone-400 text-[11px]">เงินทอน</span>
                          <div className="font-mono font-bold text-sm text-emerald-700 tabular-nums">
                            ฿{(activeSale.change || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </>
                    )}

                    {activeSale.paymentMethod === 'credit' && (
                      <>
                        <div>
                          <span className="text-stone-400 text-[11px]">ผู้ค้างชำระ</span>
                          <div className="font-semibold text-sm text-amber-900 truncate">
                            {activeSale.customerName || 'ไม่ระบุชื่อ'}
                          </div>
                        </div>
                        <div>
                          <span className="text-stone-400 text-[11px]">สถานะบัญชี</span>
                          <div className="text-xs text-amber-800 font-medium">
                            ลงสมุดบันทึกหนี้แล้ว
                          </div>
                        </div>
                      </>
                    )}

                    {activeSale.paymentMethod === 'promptpay' && (
                      <div className="col-span-2">
                        <span className="text-stone-400 text-[11px]">บัญชีพร้อมเพย์ร้าน</span>
                        <div className="font-mono font-medium text-xs text-blue-900">
                          {settings.promptPayId || 'PromptPay QR Code'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Detail Table */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                  <div className="p-3.5 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-stone-600" />
                      <h4 className="text-xs font-bold text-stone-900">
                        รายการสินค้า ({activeSale.items.length} รายการ)
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowProfitDetail(!showProfitDetail)}
                      className="text-[11px] text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
                    >
                      {showProfitDetail ? 'ซ่อนต้นทุน' : 'แสดงต้นทุน/กำไร'}
                    </button>
                  </div>

                  <div className="divide-y divide-stone-100">
                    <div className="grid grid-cols-12 px-4 py-2 bg-stone-50 text-[11px] font-semibold text-stone-500">
                      <span className="col-span-6">สินค้า</span>
                      <span className="col-span-2 text-center">จำนวน</span>
                      <span className="col-span-2 text-right">ราคา/หน่วย</span>
                      <span className="col-span-2 text-right">รวม</span>
                    </div>

                    {activeSale.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 px-4 py-3 items-center text-xs hover:bg-stone-50/50"
                      >
                        <div className="col-span-6 pr-2">
                          <div className="font-medium text-stone-900 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {item.barcode ? `บาร์โค้ด: ${item.barcode}` : 'ไม่มีบาร์โค้ด'}
                          </div>
                          {showProfitDetail && (
                            <div className="text-[10px] text-emerald-600 font-mono">
                              ทุน ฿{item.costPrice} • กำไร +฿{(item.sellPrice - item.costPrice) * item.quantity}
                            </div>
                          )}
                        </div>

                        <div className="col-span-2 text-center font-mono font-semibold text-stone-800">
                          {item.quantity} {item.unit || 'ชิ้น'}
                        </div>

                        <div className="col-span-2 text-right font-mono text-stone-600">
                          ฿{item.sellPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </div>

                        <div className="col-span-2 text-right font-mono font-bold text-stone-900 tabular-nums">
                          ฿{item.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bill Financial Summary */}
                  <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-stone-600">
                      <span>ยอดรวมสินค้า (Subtotal):</span>
                      <span>฿{activeSale.subtotal.toFixed(2)}</span>
                    </div>
                    {activeSale.discount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>ส่วนลด (Discount):</span>
                        <span>-฿{activeSale.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-stone-900 pt-1 border-t border-stone-200">
                      <span>ยอดสุทธิทั้งสิ้น (Net Total):</span>
                      <span className="text-base text-stone-950 font-black">
                        ฿{activeSale.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-700 pt-0.5">
                      <span>กำไรโดยประมาณของบิลนี้:</span>
                      <span className="font-bold">+฿{activeSale.profit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons for Selected Bill */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playTouchClickSound();
                      onViewReceiptSlip(activeSale);
                    }}
                    className="flex-1 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer touch-btn"
                  >
                    <Printer className="w-4 h-4" />
                    <span>ดูใบเสร็จ / พิมพ์สลิป (Print Slip)</span>
                  </button>

                  {onReorderToCart && (
                    <button
                      type="button"
                      onClick={handleReorder}
                      className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer touch-btn"
                      title="นำรายการสินค้าทั้งหมดในบิลนี้ไปเปิดขายใหม่ในตะกร้า"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>โหลดใส่ตะกร้าขายใหม่ (Re-order)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-stone-400 space-y-2">
                <Receipt className="w-12 h-12 opacity-30" />
                <h3 className="font-bold text-stone-600 text-sm">ยังไม่ได้เลือกบิล</h3>
                <p className="text-xs">โปรดเลือกบิลจากรายการทางซ้าย เพื่อดูรายละเอียดทั้งหมด</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
