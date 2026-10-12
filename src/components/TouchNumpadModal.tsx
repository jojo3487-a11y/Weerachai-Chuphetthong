import React, { useState, useMemo } from 'react';
import { 
  X, 
  Delete, 
  CornerDownLeft, 
  Search, 
  Plus, 
  Package, 
  Check, 
  Barcode, 
  Sparkles 
} from 'lucide-react';
import { Product } from '../types';
import { playTouchClickSound, playScanBeep } from '../utils/sound';

interface TouchNumpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onScanBarcode: (code: string) => boolean;
}

export const TouchNumpadModal: React.FC<TouchNumpadModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart,
  onScanBarcode,
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [multiplier, setMultiplier] = useState<number>(1);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Filter matching products by barcode or name or id
  const matchingProducts = useMemo(() => {
    const q = inputVal.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => 
        p.barcode.toLowerCase().includes(q) || 
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [inputVal, products]);

  if (!isOpen) return null;

  const handleKeyPress = (char: string) => {
    playTouchClickSound();
    setInputVal((prev) => prev + char);
  };

  const handleBackspace = () => {
    playTouchClickSound();
    setInputVal((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    playTouchClickSound();
    setInputVal('');
  };

  const handleMultiplierChange = (m: number) => {
    playTouchClickSound();
    setMultiplier(m);
  };

  const handleSubmit = () => {
    const code = inputVal.trim();
    if (!code) return;

    // Check if barcode matches
    const exact = products.find((p) => p.barcode === code || p.id === code);
    if (exact) {
      playScanBeep();
      onAddToCart(exact, multiplier);
      setSuccessFeedback(`เพิ่ม "${exact.name}" (${multiplier} ชิ้น) แล้ว`);
      setInputVal('');
      setMultiplier(1);
      setTimeout(() => setSuccessFeedback(null), 2000);
      return;
    }

    // Try scanning barcode function
    const scanned = onScanBarcode(code);
    if (scanned) {
      setSuccessFeedback(`เพิ่มสินค้าสำเร็จ (${multiplier} ชิ้น)`);
      setInputVal('');
      setMultiplier(1);
      setTimeout(() => setSuccessFeedback(null), 2000);
    } else if (matchingProducts.length === 1) {
      playScanBeep();
      onAddToCart(matchingProducts[0], multiplier);
      setSuccessFeedback(`เพิ่ม "${matchingProducts[0].name}" (${multiplier} ชิ้น) แล้ว`);
      setInputVal('');
      setMultiplier(1);
      setTimeout(() => setSuccessFeedback(null), 2000);
    }
  };

  const handleAddProductDirect = (p: Product) => {
    playScanBeep();
    onAddToCart(p, multiplier);
    setSuccessFeedback(`เพิ่ม "${p.name}" (${multiplier} ชิ้น) แล้ว`);
    setInputVal('');
    setMultiplier(1);
    setTimeout(() => setSuccessFeedback(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-stone-200 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                แป้นตัวเลขจอสัมผัส (Touchscreen Keypad)
              </h3>
              <p className="text-[11px] text-stone-400">
                แตะใส่รหัสบาร์โค้ด หรือกำหนดจำนวนสินค้าด่วน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer touch-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast inside modal */}
        {successFeedback && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
            <Check className="w-4 h-4" />
            <span>{successFeedback}</span>
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Multiplier Quick Chips (จำนวนที่จะใส่ลงตะกร้า) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs text-stone-600">
              <span className="font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                คูณจำนวนชิ้น (Multiplier):
              </span>
              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                x {multiplier} ชิ้น
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {[
                { val: 1, label: 'x1 ชิ้น' },
                { val: 2, label: 'x2' },
                { val: 3, label: 'x3' },
                { val: 5, label: 'x5' },
                { val: 6, label: 'x6 ครึ่งโหล' },
                { val: 10, label: 'x10' },
                { val: 12, label: 'x12 โหล' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => handleMultiplierChange(chip.val)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all touch-btn cursor-pointer ${
                    multiplier === chip.val
                      ? 'bg-amber-500 text-stone-950 shadow-sm scale-102'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Barcode / Number Input Screen */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-white shadow-inner flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">
                บาร์โค้ด / ตัวเลขที่กด:
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-widest text-amber-400 truncate mt-0.5 min-h-[36px]">
                {inputVal || <span className="text-stone-600">_ _ _ _ _ _ _</span>}
              </div>
            </div>

            {inputVal && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-medium touch-btn cursor-pointer"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Real-time matched products */}
          {matchingProducts.length > 0 && (
            <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
              <div className="text-[11px] font-semibold text-stone-500 px-1">
                พบสินค้าตรงกับตัวเลข ({matchingProducts.length} รายการ):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchingProducts.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddProductDirect(prod)}
                    className="p-2.5 bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-400 rounded-xl text-left flex items-center justify-between gap-2 shadow-2xs touch-btn cursor-pointer transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        ฿{prod.sellPrice} • เหลือ {prod.stock} {prod.unit}
                      </div>
                    </div>
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Touch Numpad Grid (Large buttons, minimum 54px touch target) */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {/* Row 1 */}
            <button
              type="button"
              onClick={() => handleKeyPress('7')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('8')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('9')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              9
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 sm:h-16 bg-stone-100 hover:bg-stone-200 text-rose-600 text-base font-semibold rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex flex-col items-center justify-center cursor-pointer gap-0.5"
            >
              <Delete className="w-5 h-5" />
              <span className="text-[10px]">ลบ</span>
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => handleKeyPress('4')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('5')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('6')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              6
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="h-14 sm:h-16 bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-bold rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              C ล้าง
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => handleKeyPress('1')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('2')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('3')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              3
            </button>
            {/* Submit / Enter (Spans 2 rows) */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!inputVal}
              className="row-span-2 h-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md touch-btn flex flex-col items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <CornerDownLeft className="w-6 h-6" />
              <span>ใส่ตะกร้า</span>
              <span className="text-[10px] font-normal opacity-80">(Enter)</span>
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('00')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              00
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('.')}
              className="h-14 sm:h-16 bg-white hover:bg-stone-100 text-stone-900 text-2xl font-bold font-mono rounded-2xl border-2 border-stone-200 shadow-xs touch-btn flex items-center justify-center cursor-pointer"
            >
              .
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex justify-between items-center text-xs text-stone-500">
          <span>แตะตัวเลขรหัสบาร์โค้ดแล้วกดใส่ตะกร้าทันที</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-semibold touch-btn cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
