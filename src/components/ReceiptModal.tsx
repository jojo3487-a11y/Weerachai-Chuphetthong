import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { SaleRecord, StoreSettings } from '../types';

interface ReceiptModalProps {
  sale: SaleRecord | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  settings,
  onClose,
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.timestamp).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-stone-200 flex flex-col max-h-[92vh]">
        {/* Top notification bar */}
        <div className="px-5 py-3 bg-emerald-600 text-white flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>ทำรายการสำเร็จ</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Slip Area */}
        <div className="p-6 overflow-y-auto bg-stone-50">
          <div
            id="printable-receipt"
            className="bg-white p-5 rounded-xl shadow-xs border border-stone-200 font-mono text-xs text-stone-800 leading-relaxed space-y-3"
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-stone-300 pb-3">
              <h2 className="text-base font-bold text-stone-900 font-sans">
                {settings.storeName}
              </h2>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                {settings.address}
              </p>
              <p className="text-[11px] text-stone-500">โทร. {settings.phone}</p>
              <div className="mt-2 text-[10px] text-stone-400">
                เลขที่บิล: {sale.id}
              </div>
              <div className="text-[10px] text-stone-400">{formattedDate}</div>
            </div>

            {/* Items list */}
            <div className="space-y-1.5 border-b border-dashed border-stone-300 pb-3">
              <div className="flex justify-between text-[11px] font-semibold text-stone-600">
                <span>รายการ</span>
                <span>จำนวน x ราคา = รวม</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div className="pr-2 font-sans truncate max-w-[170px]">
                    {item.name}
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    {item.quantity} x {item.sellPrice} = ฿{item.total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 border-b border-dashed border-stone-300 pb-3">
              <div className="flex justify-between">
                <span>ยอดรวมสินค้า:</span>
                <span className="tabular-nums">฿{sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>ส่วนลด:</span>
                  <span className="tabular-nums">-฿{sale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-stone-900 pt-1">
                <span>ยอดสุทธิ:</span>
                <span className="tabular-nums">฿{sale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment specifics */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-stone-300 pb-3">
              <div className="flex justify-between">
                <span>วิธีชำระ:</span>
                <span className="font-semibold font-sans">
                  {sale.paymentMethod === 'cash' && 'เงินสด (Cash)'}
                  {sale.paymentMethod === 'promptpay' && (
                    sale.qrProvider === 'kshop'
                      ? 'สแกน QR K SHOP (กสิกรไทย)'
                      : sale.qrProvider === 'tungngern'
                      ? 'สแกน QR ถุงเงิน (กรุงไทย)'
                      : 'สแกน QR พร้อมเพย์'
                  )}
                  {sale.paymentMethod === 'credit' && 'แปะโป้ง (จดเชื่อ)'}
                </span>
              </div>

              {sale.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between">
                    <span>รับเงินมา:</span>
                    <span className="tabular-nums">฿{(sale.cashReceived || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>เงินทอน:</span>
                    <span className="tabular-nums">฿{(sale.change || 0).toFixed(2)}</span>
                  </div>
                </>
              )}

              {sale.paymentMethod === 'credit' && (
                <div className="p-2 bg-amber-50 rounded text-amber-900 font-sans text-[11px]">
                  <strong>ลงบันทึกแปะโป้ง:</strong> {sale.customerName}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-2 text-[10px] text-stone-500 font-sans">
              <p>{settings.receiptFooter}</p>
              <p className="mt-1 text-stone-400">ขอบคุณทุกท่านที่ไว้วางใจ</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 bg-white border-t border-stone-200 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>พิมพ์ใบเสร็จ (Print)</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            เปิดบิลใหม่ (ขายต่อ)
          </button>
        </div>
      </div>
    </div>
  );
};
