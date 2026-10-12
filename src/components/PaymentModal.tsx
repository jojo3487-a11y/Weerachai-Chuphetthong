import React, { useState, useMemo, useEffect } from 'react';
import { 
  Banknote, 
  QrCode, 
  BookOpen, 
  X, 
  Check, 
  AlertCircle,
  UserPlus,
  Download,
  Copy,
  ExternalLink,
  Smartphone,
  Store,
  Info
} from 'lucide-react';
import { PaymentMethod, CustomerDebt, StoreSettings, QrPaymentProvider } from '../types';
import { 
  generatePromptPayPayload, 
  generateQRMatrix, 
  generateQrDataUrl,
  QR_PROVIDERS_META 
} from '../utils/promptpay';
import { playTouchClickSound, playCashRegisterSound } from '../utils/sound';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  debts: CustomerDebt[];
  settings: StoreSettings;
  onConfirmPayment: (
    method: PaymentMethod,
    cashReceived?: number,
    change?: number,
    customerId?: string,
    customerName?: string,
    discount?: number,
    qrProvider?: QrPaymentProvider
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  debts,
  settings,
  onConfirmPayment,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [selectedQrProvider, setSelectedQrProvider] = useState<QrPaymentProvider>('promptpay');
  const [cashInput, setCashInput] = useState<string>('');
  const [discountInput, setDiscountInput] = useState<string>('');
  
  // Debt fields
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [isCreatingNewDebtor, setIsCreatingNewDebtor] = useState(false);

  // QR rendering & copy state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [appLaunchNotice, setAppLaunchNotice] = useState<string | null>(null);

  const discount = Math.max(0, parseFloat(discountInput) || 0);
  const netTotal = Math.max(0, totalAmount - discount);
  const cashGiven = parseFloat(cashInput) || 0;
  const change = Math.max(0, cashGiven - netTotal);
  const isCashInsufficient = method === 'cash' && cashGiven < netTotal;

  // Selected customer for credit
  const selectedCustomer = useMemo(() => {
    return debts.find((d) => d.id === selectedCustomerId);
  }, [debts, selectedCustomerId]);

  // Target ID based on selected QR Provider
  const activeTargetId = useMemo(() => {
    if (selectedQrProvider === 'kshop') {
      return settings.kShopId || settings.promptPayId || '0891234567';
    }
    if (selectedQrProvider === 'tungngern') {
      return settings.tungNgernId || settings.promptPayId || '0891234567';
    }
    return settings.promptPayId || '0891234567';
  }, [selectedQrProvider, settings]);

  // PromptPay / Thai QR EMVCo payload
  const promptPayPayload = useMemo(() => {
    return generatePromptPayPayload(activeTargetId, netTotal);
  }, [activeTargetId, netTotal]);

  // Fallback matrix
  const qrMatrix = useMemo(() => {
    return generateQRMatrix(promptPayPayload, 25);
  }, [promptPayPayload]);

  // Generate crisp real QR PNG Data URL
  useEffect(() => {
    let isCurrent = true;
    if (isOpen && method === 'promptpay' && promptPayPayload) {
      generateQrDataUrl(promptPayPayload, 380).then((url) => {
        if (isCurrent && url) {
          setQrDataUrl(url);
        }
      });
    }
    return () => {
      isCurrent = false;
    };
  }, [isOpen, method, promptPayPayload]);

  if (!isOpen) return null;

  const handleAddCash = (amount: number) => {
    playTouchClickSound();
    const current = parseFloat(cashInput) || 0;
    setCashInput((current + amount).toString());
  };

  const handleExactCash = () => {
    playTouchClickSound();
    setCashInput(netTotal.toString());
  };

  const handleKeypadPress = (val: string) => {
    playTouchClickSound();
    setCashInput((prev) => {
      if (val === 'C') return '';
      if (val === 'DEL') return prev.slice(0, -1);
      if (val === '.') {
        if (prev.includes('.')) return prev;
        return prev ? prev + '.' : '0.';
      }
      return prev + val;
    });
  };

  const handleCopyQrDetails = async () => {
    playTouchClickSound();
    try {
      const providerLabel = selectedQrProvider === 'kshop' 
        ? 'K SHOP (กสิกรไทย)' 
        : selectedQrProvider === 'tungngern' 
        ? 'ถุงเงิน (กรุงไทย)' 
        : 'พร้อมเพย์ (Thai QR)';
      
      const copyText = `ร้าน: ${settings.storeName}\nยอดชำระ: ${netTotal.toFixed(2)} บาท\nช่องทาง: ${providerLabel}\nหมายเลข/ID: ${activeTargetId}\nโค้ดชำระเงิน: ${promptPayPayload}`;
      
      await navigator.clipboard.writeText(copyText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      // Fallback
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    playTouchClickSound();
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${selectedQrProvider}-${netTotal.toFixed(2)}THB.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenMerchantApp = (provider: 'kshop' | 'tungngern') => {
    playTouchClickSound();
    const meta = QR_PROVIDERS_META[provider];
    
    // Attempt deep link scheme
    try {
      const link = document.createElement('a');
      link.href = meta.appScheme;
      link.target = '_top';
      link.click();
    } catch (e) {
      console.warn('Deep link launch fallback:', e);
    }

    setAppLaunchNotice(
      provider === 'kshop'
        ? 'ส่งคำสั่งเปิดแอป K SHOP แล้ว (หากอยู่บนแท็บเล็ต/มือถือ เครื่องจะสลับไปแอปทันที)'
        : 'ส่งคำสั่งเปิดแอป ถุงเงิน แล้ว (หากอยู่บนแท็บเล็ต/มือถือ เครื่องจะสลับไปแอปทันที)'
    );
    setTimeout(() => setAppLaunchNotice(null), 4000);
  };

  const handleConfirm = () => {
    playCashRegisterSound();
    if (method === 'cash') {
      if (cashGiven < netTotal) return;
      onConfirmPayment('cash', cashGiven, change, undefined, undefined, discount);
    } else if (method === 'promptpay') {
      onConfirmPayment('promptpay', undefined, undefined, undefined, undefined, discount, selectedQrProvider);
    } else if (method === 'credit') {
      const finalName = isCreatingNewDebtor ? newCustomerName.trim() : (selectedCustomer?.name || '');
      if (!finalName) return;
      onConfirmPayment(
        'credit',
        undefined,
        undefined,
        isCreatingNewDebtor ? undefined : selectedCustomer?.id,
        finalName,
        discount
      );
    }
  };

  const currentProviderMeta = QR_PROVIDERS_META[selectedQrProvider];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200 flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-base sm:text-lg">ชำระเงิน / ปิดการขาย</h3>
            <p className="text-[11px] sm:text-xs text-stone-400">เลือกช่องทางการชำระเงิน และคำนวณเงินทอนอัตโนมัติ</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer touch-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Amount banner */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] sm:text-xs text-stone-500 font-medium">ยอดชำระสุทธิ</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono tabular-nums">
                ฿{netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <label className="text-[11px] sm:text-xs text-stone-500 block mb-1">ส่วนลดพิเศษ (฿)</label>
              <input
                type="number"
                min="0"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="0.00"
                className="w-24 px-2 py-1.5 text-sm text-right border border-stone-300 rounded-xl font-mono focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Payment Method Selector (Large touch buttons) */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 rounded-2xl">
            <button
              type="button"
              onClick={() => { playTouchClickSound(); setMethod('cash'); if (!cashInput) handleExactCash(); }}
              className={`flex items-center justify-center gap-1.5 py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all touch-btn cursor-pointer ${
                method === 'cash'
                  ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>เงินสด</span>
            </button>

            <button
              type="button"
              onClick={() => { playTouchClickSound(); setMethod('promptpay'); }}
              className={`flex items-center justify-center gap-1.5 py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all touch-btn cursor-pointer ${
                method === 'promptpay'
                  ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>สแกน QR</span>
            </button>

            <button
              type="button"
              onClick={() => { playTouchClickSound(); setMethod('credit'); }}
              className={`flex items-center justify-center gap-1.5 py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all touch-btn cursor-pointer ${
                method === 'credit'
                  ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>แปะโป้ง (จดเชื่อ)</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: CASH OPTION */}
          {/* ========================================================================= */}
          {method === 'cash' && (
            <div className="space-y-3.5">
              {/* Cash Input display */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  รับเงินสดมา (บาท):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-xl font-bold">
                    ฿
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 text-2xl font-mono font-black text-stone-900 border-2 border-stone-300 rounded-2xl focus:border-emerald-500 focus:outline-hidden bg-stone-50"
                  />
                  {cashInput && (
                    <button
                      type="button"
                      onClick={() => { playTouchClickSound(); setCashInput(''); }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600 px-2 py-1 rounded-lg touch-btn cursor-pointer"
                    >
                      ล้าง
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Banknote Presets + Accumulation */}
              <div>
                <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5 font-medium">
                  <span>แตะเพื่อใส่ธนบัตร:</span>
                  <span className="text-[11px] text-stone-400">แตะซ้ำเพื่อเพิ่มยอด</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="py-2.5 px-2 bg-stone-200 hover:bg-stone-300 text-stone-900 text-xs font-bold rounded-xl transition-all touch-btn cursor-pointer text-center"
                  >
                    พอดี (฿{netTotal})
                  </button>
                  {[
                    { amt: 20, label: '฿20' },
                    { amt: 50, label: '฿50' },
                    { amt: 100, label: '฿100' },
                    { amt: 500, label: '฿500' },
                    { amt: 1000, label: '฿1,000' },
                  ].map((note) => (
                    <button
                      key={note.amt}
                      type="button"
                      onClick={() => handleAddCash(note.amt)}
                      className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-xl transition-all touch-btn cursor-pointer text-center"
                    >
                      {note.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* On-Screen Touch Numpad */}
              <div className="pt-1">
                <div className="grid grid-cols-4 gap-1.5">
                  {['7', '8', '9', 'C'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleKeypadPress(k)}
                      className={`h-11 font-bold font-mono text-lg rounded-xl touch-btn transition-colors cursor-pointer ${
                        k === 'C'
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                          : 'bg-white hover:bg-stone-100 border border-stone-200 text-stone-900'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                  {['4', '5', '6', 'DEL'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleKeypadPress(k)}
                      className={`h-11 font-bold text-lg rounded-xl touch-btn transition-colors cursor-pointer ${
                        k === 'DEL'
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-sans font-bold'
                          : 'bg-white hover:bg-stone-100 border border-stone-200 text-stone-900 font-mono'
                      }`}
                    >
                      {k === 'DEL' ? '⌫ ลบ' : k}
                    </button>
                  ))}
                  {['1', '2', '3'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleKeypadPress(k)}
                      className="h-11 bg-white hover:bg-stone-100 border border-stone-200 text-stone-900 font-bold font-mono text-lg rounded-xl touch-btn cursor-pointer"
                    >
                      {k}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('00')}
                    className="h-11 bg-white hover:bg-stone-100 border border-stone-200 text-stone-900 font-bold font-mono text-lg rounded-xl touch-btn cursor-pointer"
                  >
                    00
                  </button>

                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="col-span-2 h-11 bg-white hover:bg-stone-100 border border-stone-200 text-stone-900 font-bold font-mono text-lg rounded-xl touch-btn cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('.')}
                    className="h-11 bg-white hover:bg-stone-100 border border-stone-200 text-stone-900 font-bold font-mono text-lg rounded-xl touch-btn cursor-pointer"
                  >
                    .
                  </button>
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="h-11 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl touch-btn cursor-pointer"
                  >
                    พอดี
                  </button>
                </div>
              </div>

              {/* Change display */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isCashInsufficient
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold uppercase">
                    {isCashInsufficient ? 'ยังขาดอีก' : 'เงินทอนให้ลูกค้า'}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums">
                    ฿{Math.abs(change).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                {isCashInsufficient ? (
                  <div className="flex items-center gap-1 text-xs text-rose-600 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>เงินไม่พอ (ขาด ฿{(netTotal - cashGiven).toLocaleString()})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
                    <Check className="w-4 h-4" />
                    <span>รับเงินครบแล้ว</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: QR PAYMENT (K SHOP, ถุงเงิน, พร้อมเพย์) */}
          {/* ========================================================================= */}
          {method === 'promptpay' && (
            <div className="space-y-3.5">
              {/* QR Provider Selector Strip */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  เลือกช่องทาง QR Code รับเงิน:
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl">
                  {/* Option 1: K SHOP (กสิกรไทย) */}
                  <button
                    type="button"
                    onClick={() => { playTouchClickSound(); setSelectedQrProvider('kshop'); }}
                    className={`py-2 px-1.5 sm:px-2 rounded-lg font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer touch-btn ${
                      selectedQrProvider === 'kshop'
                        ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500'
                        : 'text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                    <span className="truncate">K SHOP</span>
                  </button>

                  {/* Option 2: ถุงเงิน (กรุงไทย) */}
                  <button
                    type="button"
                    onClick={() => { playTouchClickSound(); setSelectedQrProvider('tungngern'); }}
                    className={`py-2 px-1.5 sm:px-2 rounded-lg font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer touch-btn ${
                      selectedQrProvider === 'tungngern'
                        ? 'bg-sky-600 text-white shadow-xs ring-1 ring-sky-500'
                        : 'text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-300"></span>
                    <span className="truncate">ถุงเงิน</span>
                  </button>

                  {/* Option 3: พร้อมเพย์ ทั่วไป */}
                  <button
                    type="button"
                    onClick={() => { playTouchClickSound(); setSelectedQrProvider('promptpay'); }}
                    className={`py-2 px-1.5 sm:px-2 rounded-lg font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer touch-btn ${
                      selectedQrProvider === 'promptpay'
                        ? 'bg-blue-800 text-white shadow-xs ring-1 ring-blue-700'
                        : 'text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                    <span className="truncate">พร้อมเพย์</span>
                  </button>
                </div>
              </div>

              {/* QR Provider Brand Banner */}
              <div className={`p-3.5 rounded-2xl text-white shadow-xs transition-colors ${
                selectedQrProvider === 'kshop'
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 border border-emerald-700'
                  : selectedQrProvider === 'tungngern'
                  ? 'bg-gradient-to-r from-sky-800 to-sky-950 border border-sky-700'
                  : 'bg-gradient-to-r from-blue-900 to-stone-900 border border-blue-700'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        selectedQrProvider === 'kshop'
                          ? 'bg-emerald-500 text-stone-950'
                          : selectedQrProvider === 'tungngern'
                          ? 'bg-sky-400 text-stone-950'
                          : 'bg-blue-400 text-stone-950'
                      }`}>
                        {currentProviderMeta.badgeText}
                      </span>
                      <span className="text-xs text-stone-300 font-medium">{currentProviderMeta.bankName}</span>
                    </div>
                    <div className="font-bold text-sm sm:text-base mt-1 text-white">{settings.storeName}</div>
                    <div className="text-xs text-stone-300 font-mono mt-0.5">
                      ID/เบอร์ร้าน: <span className="font-bold text-white">{activeTargetId}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-stone-300 block">ยอดที่ต้องชำระ</span>
                    <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 tabular-nums">
                      ฿{netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-stone-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                  <span>{currentProviderMeta.acceptedAppsNotice}</span>
                </div>
              </div>

              {/* QR Code Graphic Box */}
              <div className="bg-stone-50 border-2 border-stone-200 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 shadow-inner">
                <div className="relative bg-white p-3 rounded-2xl border-2 border-stone-800 shadow-md flex items-center justify-center">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt={`QR Code ${currentProviderMeta.name}`}
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    /* Fallback SVG */
                    <div className="w-48 h-48 sm:w-56 sm:h-56">
                      <svg viewBox="0 0 25 25" className="w-full h-full">
                        {qrMatrix.map((row, r) =>
                          row.map((col, c) =>
                            col ? (
                              <rect
                                key={`${r}-${c}`}
                                x={c}
                                y={r}
                                width="1"
                                height="1"
                                fill="#0f172a"
                              />
                            ) : null
                          )
                        )}
                      </svg>
                    </div>
                  )}

                  {/* Logo Center Tag */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`px-2 py-1 rounded-md text-[10px] font-black text-white shadow-md border ${
                      selectedQrProvider === 'kshop'
                        ? 'bg-emerald-600 border-white'
                        : selectedQrProvider === 'tungngern'
                        ? 'bg-sky-600 border-white'
                        : 'bg-blue-800 border-white'
                    }`}>
                      {selectedQrProvider === 'kshop' ? 'K SHOP' : selectedQrProvider === 'tungngern' ? 'ถุงเงิน' : 'Thai QR'}
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-0.5">
                  <p className="text-xs font-bold text-stone-800">
                    ให้ลูกค้าสแกนคิวอาร์โค้ดนี้ ยอดเงิน ฿{netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} จะขึ้นบนหน้าจอทันที
                  </p>
                  <p className="text-[11px] text-stone-500">
                    มาตรฐาน BOT Thai QR • มีระบบป้องกันยอดผิดพลาด
                  </p>
                </div>

                {/* Quick Action Buttons for Cashier */}
                <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-stone-200">
                  {/* Deep Link to K SHOP or Tung Ngern App */}
                  {(selectedQrProvider === 'kshop' || selectedQrProvider === 'tungngern') && (
                    <button
                      type="button"
                      onClick={() => handleOpenMerchantApp(selectedQrProvider)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer touch-btn ${
                        selectedQrProvider === 'kshop'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-sky-600 hover:bg-sky-700 text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>
                        {selectedQrProvider === 'kshop' ? '📱 เปิดแอป K SHOP' : '📱 เปิดแอป ถุงเงิน'}
                      </span>
                    </button>
                  )}

                  {/* Download QR Image */}
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer touch-btn"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-500" />
                    <span>บันทึกรูป QR</span>
                  </button>

                  {/* Copy Details */}
                  <button
                    type="button"
                    onClick={handleCopyQrDetails}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer touch-btn"
                  >
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                    <span>{copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอกข้อมูล'}</span>
                  </button>
                </div>

                {/* Notice feedback if user pressed launch */}
                {appLaunchNotice && (
                  <div className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center animate-fade-in">
                    {appLaunchNotice}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CREDIT / แปะโป้ง OPTION */}
          {/* ========================================================================= */}
          {method === 'credit' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 leading-relaxed">
                <strong>ระบบแปะโป้ง (สมุดจดเชื่อชุมชน):</strong> รายการนี้จะถูกบันทึกเข้าประวัติลูกหนี้ และตัดสต็อกสินค้าทันที สามารถติดตามและบันทึกรับเงินย้อนหลังได้ในเมนูสมุดแปะโป้ง
              </div>

              {!isCreatingNewDebtor ? (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-stone-700">
                    เลือกลูกค้าประจำที่มีประวัติ:
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                  >
                    <option value="">-- เลือกลูกค้าในสมุด --</option>
                    {debts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (ค้างอยู่เดิม ฿{d.totalDebt.toLocaleString()})
                      </option>
                    ))}
                  </select>

                  {selectedCustomer && (
                    <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-1.5 border border-stone-200">
                      <div className="flex justify-between">
                        <span className="text-stone-500">ยอดค้างชำระเดิม:</span>
                        <span className="font-bold text-rose-600 font-mono">
                          ฿{selectedCustomer.totalDebt.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-stone-200">
                        <span className="text-stone-800">ยอดหนี้รวมหลังบิลนี้:</span>
                        <span className="text-amber-700 font-mono">
                          ฿{(selectedCustomer.totalDebt + netTotal).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsCreatingNewDebtor(true)}
                    className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มลูกค้าคนใหม่ (ยังไม่มีในสมุด)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-stone-700">
                      ชื่อลูกค้าใหม่ (เช่น ป้าจันทร์, ลุงชัย):
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewDebtor(false)}
                      className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                    >
                      เลือกจากรายชื่อเดิม
                    </button>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="พิมพ์ชื่อลูกค้าใหม่..."
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer touch-btn"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              (method === 'cash' && isCashInsufficient) ||
              (method === 'credit' &&
                ((isCreatingNewDebtor && !newCustomerName.trim()) ||
                  (!isCreatingNewDebtor && !selectedCustomerId)))
            }
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer touch-btn"
          >
            <Check className="w-4 h-4" />
            <span>
              {method === 'cash' && `รับเงิน & ปิดบิล`}
              {method === 'promptpay' && `ยืนยันได้รับเงินแล้ว (สแกน QR)`}
              {method === 'credit' && `บันทึกลงสมุดแปะโป้ง`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
