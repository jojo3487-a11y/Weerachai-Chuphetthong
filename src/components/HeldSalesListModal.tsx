import React from 'react';
import { 
  PlayCircle, 
  Trash2, 
  X, 
  Clock, 
  Package, 
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { HeldSale } from '../types';

interface HeldSalesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldSales: HeldSale[];
  currentCartItemCount: number;
  onResumeHeldSale: (heldSaleId: string) => void;
  onDeleteHeldSale: (heldSaleId: string) => void;
}

export const HeldSalesListModal: React.FC<HeldSalesListModalProps> = ({
  isOpen,
  onClose,
  heldSales,
  currentCartItemCount,
  onResumeHeldSale,
  onDeleteHeldSale,
}) => {
  if (!isOpen) return null;

  const handleResume = (id: string) => {
    onResumeHeldSale(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">รายการบิลที่พักไว้ (F6)</h3>
              <p className="text-xs text-stone-400">
                มีบิลที่พักไว้ทั้งหมด {heldSales.length} รายการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Note if current cart is active */}
          {currentCartItemCount > 0 && heldSales.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                ปัจจุบันมีสินค้าอยู่ในตะกร้า ({currentCartItemCount} ชิ้น) หากเลือกดึงบิลเก่า ระบบจะ<strong>สลับบิลปัจจุบันไปพักไว้ให้อัตโนมัติ</strong> ข้อมูลไม่สูญหาย
              </span>
            </div>
          )}

          {/* List of held sales */}
          {heldSales.length === 0 ? (
            <div className="p-12 text-center text-stone-400 space-y-2">
              <Clock className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="text-sm font-semibold text-stone-700">ไม่มีบิลที่พักไว้ในขณะนี้</h4>
              <p className="text-xs text-stone-400">
                เมื่อลูกค้าขอไปหยิบสินค้าเพิ่ม สามารถกด <strong>F4</strong> หรือปุ่ม <strong>"พักบิล"</strong> เพื่อรับลูกค้ารายต่อไปได้ทันที
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {heldSales.map((held) => {
                const totalItems = held.items.reduce((s, i) => s + i.quantity, 0);
                const timeStr = new Date(held.createdAt).toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={held.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-white hover:border-amber-400 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0 pr-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900 truncate">
                          {held.label}
                        </span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {timeStr}
                        </span>
                      </div>

                      {/* Summary of items in held bill */}
                      <p className="text-stone-500 line-clamp-1">
                        {held.items.map((i) => `${i.product.name} x${i.quantity}`).join(', ')}
                      </p>

                      <div className="flex items-center gap-3 pt-0.5 text-[11px] text-stone-600">
                        <span>{held.items.length} รายการ ({totalItems} ชิ้น)</span>
                        <span>·</span>
                        <span className="font-bold font-mono text-emerald-800 text-xs tabular-nums">
                          ฿{held.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`ต้องการยกเลิกบิลที่พัก "${held.label}" หรือไม่?`)) {
                            onDeleteHeldSale(held.id);
                          }
                        }}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบบิลนี้ทิ้ง"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResume(held.id)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>ดึงบิลนี้มาขายต่อ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-between items-center text-xs text-stone-500">
          <span className="text-[11px] text-stone-400">
            คีย์ลัด: <strong>F4</strong> = พักบิล, <strong>F6</strong> = ดูบิลที่พัก, <strong>F2</strong> = คิดเงิน
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
