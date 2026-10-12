import React, { useState } from 'react';
import { X, Check, Trash2, Plus, Minus, Package, Sparkles } from 'lucide-react';
import { CartItem } from '../types';
import { playTouchClickSound } from '../utils/sound';

interface CartTouchQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const CartTouchQuantityModal: React.FC<CartTouchQuantityModalProps> = ({
  isOpen,
  onClose,
  item,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const [customQty, setCustomQty] = useState<string>('');

  if (!isOpen || !item) return null;

  const currentQty = item.quantity;
  const maxStock = item.product.stock;

  const handleSetQty = (qty: number) => {
    playTouchClickSound();
    const clamped = Math.min(Math.max(1, qty), maxStock);
    onUpdateQuantity(item.product.id, clamped);
    onClose();
  };

  const handleStep = (delta: number) => {
    playTouchClickSound();
    const next = Math.min(Math.max(1, currentQty + delta), maxStock);
    onUpdateQuantity(item.product.id, next);
  };

  const handleNumPress = (digit: string) => {
    playTouchClickSound();
    setCustomQty((prev) => {
      const nextStr = prev + digit;
      const num = parseInt(nextStr, 10);
      if (isNaN(num)) return '';
      return num > maxStock ? maxStock.toString() : nextStr;
    });
  };

  const handleClearCustom = () => {
    playTouchClickSound();
    setCustomQty('');
  };

  const handleConfirmCustom = () => {
    playTouchClickSound();
    const num = parseInt(customQty, 10);
    if (!isNaN(num) && num > 0) {
      handleSetQty(num);
    }
    setCustomQty('');
  };

  const handleDelete = () => {
    playTouchClickSound();
    onRemoveItem(item.product.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                ปรับจำนวนสินค้า (หน้าจอสัมผัส)
              </h3>
              <p className="text-[11px] text-stone-400">
                แตะเลือกจำนวนที่ต้องการ หรือกดปุ่มบวกลบ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer touch-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Product info banner */}
          <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <h4 className="font-bold text-sm text-stone-900 truncate">
                {item.product.name}
              </h4>
              <div className="text-xs text-stone-500 font-mono mt-0.5">
                ฿{item.product.sellPrice} / {item.product.unit} • ในคลังมีเหลือ {maxStock} {item.product.unit}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-stone-400 block">ยอดรวมสินค้านี้</span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                ฿{(item.product.sellPrice * (customQty ? parseInt(customQty, 10) || currentQty : currentQty)).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Stepper with Huge Touch Buttons */}
          <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-2xl flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              disabled={currentQty <= 1}
              className="w-14 h-14 rounded-2xl bg-white border border-stone-200 text-stone-800 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs touch-btn flex items-center justify-center text-xl font-bold cursor-pointer"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="text-center px-4">
              <span className="text-xs text-stone-500 block">จำนวนปัจจุบัน</span>
              <span className="text-3xl font-extrabold text-stone-900 font-mono">
                {customQty ? customQty : currentQty}
              </span>
              <span className="text-xs text-stone-500 ml-1">{item.product.unit}</span>
            </div>

            <button
              type="button"
              onClick={() => handleStep(1)}
              disabled={currentQty >= maxStock}
              className="w-14 h-14 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-md touch-btn flex items-center justify-center text-xl font-bold cursor-pointer"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Quantity Presets (ร้านชำไทยนิยม) */}
          <div>
            <div className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>จำนวนด่วนที่พบบ่อย (แตะเพื่อเปลี่ยนทันที):</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { qty: 1, label: '1 ชิ้น' },
                { qty: 2, label: '2' },
                { qty: 3, label: '3' },
                { qty: 4, label: '4' },
                { qty: 5, label: '5' },
                { qty: 6, label: '6 (ครึ่งโหล)' },
                { qty: 10, label: '10' },
                { qty: 12, label: '12 (1 โหล)' },
                { qty: 20, label: '20' },
                { qty: 24, label: '24 (1 ลัง)' },
                { qty: 30, label: '30 (1 แผง)' },
                { qty: maxStock, label: `ทั้งหมด (${maxStock})` },
              ].map((preset) => {
                const disabled = preset.qty > maxStock;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSetQty(preset.qty)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all touch-btn cursor-pointer ${
                      currentQty === preset.qty
                        ? 'bg-amber-500 text-stone-950 shadow-sm ring-2 ring-amber-400'
                        : disabled
                        ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Mini Numpad for Custom Quantity */}
          <div className="border-t border-stone-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-700">หรือระบุจำนวนเอง:</span>
              {customQty && (
                <button
                  type="button"
                  onClick={handleClearCustom}
                  className="text-xs text-rose-500 hover:underline touch-btn cursor-pointer"
                >
                  ล้างตัวเลข
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumPress(digit)}
                  className="py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-900 font-bold font-mono text-base rounded-xl border border-stone-200 touch-btn cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClearCustom}
                className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-xs rounded-xl border border-stone-200 touch-btn cursor-pointer"
              >
                C
              </button>

              <button
                type="button"
                onClick={handleConfirmCustom}
                disabled={!customQty}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 text-white font-bold text-xs rounded-xl touch-btn cursor-pointer disabled:cursor-not-allowed"
              >
                ตกลง
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 touch-btn cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>ลบรายการนี้</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 touch-btn cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>เสร็จสิ้น</span>
          </button>
        </div>

      </div>
    </div>
  );
};
