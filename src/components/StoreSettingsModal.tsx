import React, { useState } from 'react';
import { SlidersHorizontal, X, Check, Store, Cloud } from 'lucide-react';
import { StoreSettings } from '../types';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onOpenDriveSync?: () => void;
  isDriveConnected?: boolean;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onOpenDriveSync,
  isDriveConnected = false,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm">ตั้งค่าข้อมูลร้านค้า & พร้อมเพย์</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              ชื่อร้านค้า: *
            </label>
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Payment QR Codes Section */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-stone-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>ตั้งค่า QR Code รับเงิน (พร้อมเพย์, K SHOP, ถุงเงิน)</span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                1. พร้อมเพย์ทั่วไป (PromptPay ID): *
              </label>
              <input
                type="text"
                required
                value={formData.promptPayId}
                onChange={(e) => setFormData({ ...formData, promptPayId: e.target.value })}
                placeholder="08x-xxx-xxxx หรือ เลขประจำตัวประชาชน 13 หลัก"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono bg-white"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                * สแกนได้ด้วยทุกแอปธนาคารตามยอดบิลอัตโนมัติ
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-bold">K SHOP</span>
                  <span>รหัสร้านค้า K SHOP / เบอร์กสิกรไทย:</span>
                </label>
              </div>
              <input
                type="text"
                value={formData.kShopId || ''}
                onChange={(e) => setFormData({ ...formData, kShopId: e.target.value })}
                placeholder="เบอร์โทรที่ผูก K SHOP หรือ Merchant ID"
                className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono bg-white"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                * ใช้สร้าง QR K SHOP สำหรับรับเงิน และกดปุ่มลัดสลับเปิดแอป K SHOP ได้ทันที
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-sky-800 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-600 text-white font-bold">ถุงเงิน</span>
                  <span>รหัสร้านค้าถุงเงิน / เบอร์กรุงไทย:</span>
                </label>
              </div>
              <input
                type="text"
                value={formData.tungNgernId || ''}
                onChange={(e) => setFormData({ ...formData, tungNgernId: e.target.value })}
                placeholder="เบอร์โทรที่ลงทะเบียนถุงเงิน หรือ รหัสร้านค้า"
                className="w-full px-3 py-2 text-sm border border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono bg-white"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                * รองรับลูกค้าสแกนด้วยแอปเป๋าตัง (G-Wallet) และกดปุ่มลัดสลับเปิดแอปถุงเงิน
              </p>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              เบอร์โทรติดต่อหน้าร้าน:
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              ที่อยู่ร้านค้า (แสดงบนหัวใบเสร็จ):
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              ข้อความท้ายใบเสร็จ:
            </label>
            <input
              type="text"
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Google Drive Sync Quick Action */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDriveConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-stone-900 text-xs">ฐานข้อมูล Google Drive</p>
                <p className="text-[11px] text-stone-500">
                  {isDriveConnected ? 'เชื่อมต่อแล้ว (อัปเดตตลอดเวลา)' : 'ยังไม่ได้เชื่อมต่อ'}
                </p>
              </div>
            </div>

            {onOpenDriveSync && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDriveSync();
                }}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                {isDriveConnected ? 'จัดการการซิงค์' : 'เชื่อมต่อ'}
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
