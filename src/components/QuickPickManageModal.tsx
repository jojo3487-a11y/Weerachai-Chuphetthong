import React, { useState, useMemo } from 'react';
import { X, Search, Flame, Plus, Check, Star, Trash2 } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { playTouchClickSound } from '../utils/sound';

interface QuickPickManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onToggleQuickPick: (productId: string) => void;
}

const CATEGORIES: (ProductCategory | 'ทั้งหมด')[] = [
  'ทั้งหมด',
  'เครื่องดื่ม',
  'ขนมและบะหมี่',
  'เครื่องปรุงและของแห้ง',
  'ของใช้ในบ้าน',
  'ไข่และของสด',
  'บุหรี่และของใช้ผู้ใหญ่',
];

export const QuickPickManageModal: React.FC<QuickPickManageModalProps> = ({
  isOpen,
  onClose,
  products,
  onToggleQuickPick,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ทั้งหมด'>('ทั้งหมด');

  const quickPickCount = useMemo(() => {
    return products.filter((p) => p.quickPick).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>จัดการปุ่มลัดขายดีด่วน</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold font-mono">
                  {quickPickCount} รายการ
                </span>
              </h3>
              <p className="text-xs text-stone-300">
                เลือกสินค้าที่ต้องการเพิ่มหรือลบออกจากปุ่มลัดขายด่วนหน้าเคาน์เตอร์
              </p>
            </div>
          </div>
          <button
            onClick={() => { playTouchClickSound(); onClose(); }}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-700/60 transition-colors cursor-pointer touch-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า, บาร์โค้ด เพื่อเพิ่ม/ลบปุ่มลัด..."
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { playTouchClickSound(); setSelectedCategory(cat); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer touch-btn ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-amber-400 shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 touch-scroll divide-y divide-stone-100">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-2">
              <Star className="w-10 h-10 mx-auto text-stone-300" />
              <p className="text-sm font-semibold text-stone-600">ไม่พบสินค้า</p>
              <p className="text-xs text-stone-400">ลองค้นหาด้วยคำอื่น</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isPinned = !!p.quickPick;
              return (
                <div
                  key={p.id}
                  className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-2xl transition-colors ${
                    isPinned ? 'bg-amber-50/60 border border-amber-200/80' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPinned ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-100 text-stone-400'
                    }`}>
                      {isPinned ? <Flame className="w-4 h-4 fill-stone-950" /> : <Star className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-stone-900 truncate">
                          {p.name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 shrink-0">
                          {p.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                        <span className="font-mono font-bold text-emerald-700">฿{p.sellPrice} / {p.unit}</span>
                        <span className="text-stone-300">•</span>
                        <span className="font-mono text-stone-400 truncate">รหัส: {p.barcode}</span>
                        <span className="text-stone-300">•</span>
                        <span className="text-stone-500">คงเหลือ: {p.stock}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playTouchClickSound();
                      onToggleQuickPick(p.id);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer touch-btn shrink-0 ${
                      isPinned
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 active:scale-95'
                        : 'bg-stone-900 hover:bg-stone-800 text-amber-400 active:scale-95 shadow-xs'
                    }`}
                  >
                    {isPinned ? (
                      <>
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>ลบออกจากปุ่มลัด</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มลงปุ่มลัด</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-500">
            แตะเพื่อเพิ่มหรือลบสินค้า ปุ่มลัดจะอัปเดตหน้าเคาน์เตอร์ทันที
          </span>
          <button
            type="button"
            onClick={() => { playTouchClickSound(); onClose(); }}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl cursor-pointer touch-btn"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
