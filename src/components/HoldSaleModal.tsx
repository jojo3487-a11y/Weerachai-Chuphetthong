import React, { useState, useEffect } from 'react';
import { PauseCircle, X, Check, Clock } from 'lucide-react';
import { CartItem } from '../types';

interface HoldSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  cartTotal: number;
  onConfirmHold: (note: string) => void;
}

const QUICK_NOTES = [
  'ไปหยิบของเพิ่ม',
  'ลืมกระเป๋าเงิน / ไปเอาเงิน',
  'ไปถามคนข้างนอก',
  'รอคนมาจ่ายให้',
  'ลูกค้าประจำ พักไว้ก่อน',
];

export const HoldSaleModal: React.FC<HoldSaleModalProps> = ({
  isOpen,
  onClose,
  cart,
  cartTotal,
  onConfirmHold,
}) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmHold(note.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">พักการขายชั่วคราว (F4)</h3>
              <p className="text-xs text-stone-400">พักบิลลูกค้ารายนี้ไว้ เพื่อคิดเงินให้ลูกค้ารายถัดไปก่อน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Bill summary preview */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-amber-800 font-semibold block">รายการสินค้าในบิล:</span>
              <span className="text-stone-600 font-mono">
                {cart.length} รายการ ({cart.reduce((s, i) => s + i.quantity, 0)} ชิ้น)
              </span>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block text-[11px]">ยอดรวม</span>
              <span className="text-lg font-bold font-mono text-amber-900 tabular-nums">
                ฿{cartTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              ชื่อเรียก / บันทึกช่วยจำ (เช่น ลูกค้าเสื้อแดง, ไปเอาตังค์):
            </label>
            <input
              type="text"
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="พิมพ์ข้อความช่วยจำ หรือกดปุ่มลัดด้านล่าง..."
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Quick note chips */}
          <div>
            <span className="text-[11px] text-stone-500 font-medium block mb-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>ข้อความด่วน:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTES.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => setNote(text)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                    note === text
                      ? 'bg-amber-100 border-amber-400 text-amber-900 font-semibold'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ยืนยันพักบิล (Enter)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
