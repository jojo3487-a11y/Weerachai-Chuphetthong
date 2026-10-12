import React, { useRef, useEffect, useState } from 'react';
import { 
  Search, 
  Scan, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Flame, 
  Package, 
  AlertTriangle,
  PauseCircle,
  Clock,
  Tablet,
  Calculator,
  Edit3,
  Receipt,
  Settings2,
  X,
  Check,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { Product, CartItem, ProductCategory, HeldSale } from '../types';
import { CartTouchQuantityModal } from './CartTouchQuantityModal';
import { QuickPickManageModal } from './QuickPickManageModal';
import { playTouchClickSound } from '../utils/sound';

interface PosViewProps {
  products: Product[];
  filteredProducts: Product[];
  cart: CartItem[];
  heldSales: HeldSale[];
  searchQuery: string;
  selectedCategory?: ProductCategory | 'ทั้งหมด';
  cartTotal: number;
  cartItemCount: number;
  isTouchMode?: boolean;
  onToggleTouchMode?: () => void;
  onOpenNumpad?: () => void;
  onOpenPastBills?: () => void;
  onSearchChange: (q: string) => void;
  onCategoryChange?: (cat: ProductCategory | 'ทั้งหมด') => void;
  onAddToCart: (product: Product, qty?: number) => void;
  onUpdateCartQuantity: (productId: string, qty: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onOpenScanner: () => void;
  onOpenPayment: () => void;
  onOpenHoldSale: () => void;
  onOpenHeldList: () => void;
  onScanBarcode: (code: string) => boolean;
  onToggleQuickPick?: (productId: string) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  filteredProducts,
  cart,
  heldSales,
  searchQuery,
  cartTotal,
  cartItemCount,
  isTouchMode = false,
  onToggleTouchMode,
  onOpenNumpad,
  onOpenPastBills,
  onSearchChange,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
  onOpenScanner,
  onOpenPayment,
  onOpenHoldSale,
  onOpenHeldList,
  onScanBarcode,
  onToggleQuickPick,
}) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedTouchItem, setSelectedTouchItem] = useState<CartItem | null>(null);
  const [isQuickPickModalOpen, setIsQuickPickModalOpen] = useState(false);
  const [isEditingQuickPicks, setIsEditingQuickPicks] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Quick Pick items
  const quickPicks = products.filter((p) => p.quickPick);

  // Search suggestions when typing in search box
  const searchSuggestions = searchQuery.trim() ? filteredProducts.slice(0, 8) : [];

  // Handle hardware barcode scanner / Enter in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchQuery.trim();
      if (!code) return;

      // Try exact barcode / id match
      const scanned = onScanBarcode(code);
      if (scanned) {
        onSearchChange('');
        setShowSearchDropdown(false);
      } else if (filteredProducts.length === 1) {
        onAddToCart(filteredProducts[0], 1);
        onSearchChange('');
        setShowSearchDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
    }
  };

  // Global function keys:
  // F2: คิดเงิน (Checkout)
  // F4: พักบิลปัจจุบัน (Hold sale)
  // F6: เรียกคืนบิลที่พักไว้ (Resume held sale)
  // F7: เรียกดูบิลย้อนหลัง (Past bills)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        if (cart.length > 0) {
          e.preventDefault();
          onOpenPayment();
        }
      } else if (e.key === 'F4') {
        if (cart.length > 0) {
          e.preventDefault();
          onOpenHoldSale();
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        onOpenHeldList();
      } else if (e.key === 'F7') {
        e.preventDefault();
        onOpenPastBills?.();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [cart, onOpenPayment, onOpenHoldSale, onOpenHeldList, onOpenPastBills]);

  // Map cart items for quick lookup in quick pick buttons
  const cartItemMap = React.useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => {
      map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cart]);

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* 1. TOP BAR: Search & POS Action Shortcuts */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-stone-200">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
          {/* Search / Barcode Input with Autocomplete dropdown */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder="สแกนบาร์โค้ด หรือค้นหาชื่อสินค้า แล้วกด Enter..."
              className="w-full pl-9 pr-16 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { 
                  playTouchClickSound(); 
                  onSearchChange(''); 
                  setShowSearchDropdown(false); 
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 cursor-pointer touch-btn px-2 py-0.5 rounded bg-stone-100"
              >
                ล้าง
              </button>
            )}

            {/* Instant Search Suggestions Popover */}
            {showSearchDropdown && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden max-h-80 overflow-y-auto divide-y divide-stone-100 animate-in fade-in duration-150">
                <div className="p-2 bg-stone-50 flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span>ผลการค้นหา ({filteredProducts.length} รายการ)</span>
                  <button
                    type="button"
                    onClick={() => setShowSearchDropdown(false)}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {searchSuggestions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-400">
                    ไม่พบสินค้าที่ตรงกับ &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  searchSuggestions.map((product) => {
                    const inCartQty = cartItemMap.get(product.id) || 0;
                    const isOutOfStock = product.stock <= 0;
                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          if (!isOutOfStock) {
                            playTouchClickSound();
                            onAddToCart(product, 1);
                            onSearchChange('');
                            setShowSearchDropdown(false);
                          }
                        }}
                        className={`p-2.5 sm:p-3 flex items-center justify-between gap-3 hover:bg-amber-50/60 transition-colors cursor-pointer ${
                          isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-stone-900 truncate">
                              {product.name}
                            </h5>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                              {product.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                            <span className="font-mono text-stone-400">บาร์โค้ด: {product.barcode}</span>
                            <span>•</span>
                            <span>เหลือ: {product.stock} {product.unit}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right">
                            <span className="font-black text-emerald-700 font-mono text-sm">
                              ฿{product.sellPrice}
                            </span>
                            {inCartQty > 0 && (
                              <div className="text-[10px] text-amber-600 font-bold">
                                ในตะกร้าแล้ว: {inCartQty}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>เพิ่ม</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none shrink-0">
            {/* Touch Numpad Trigger Button */}
            {onOpenNumpad && (
              <button
                type="button"
                onClick={() => { playTouchClickSound(); onOpenNumpad(); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer touch-btn"
                title="เปิดแป้นพิมพ์ตัวเลขหน้าจอสัมผัส (Touchscreen Keypad)"
              >
                <Calculator className="w-4 h-4" />
                <span>แป้นตัวเลข</span>
              </button>
            )}

            {/* Past Bills Trigger Button (F7) */}
            {onOpenPastBills && (
              <button
                type="button"
                onClick={() => { playTouchClickSound(); onOpenPastBills(); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-200 shadow-2xs transition-colors shrink-0 cursor-pointer touch-btn"
                title="เรียกดูบิลย้อนหลังพร้อมรายละเอียดสินค้า (F7)"
              >
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>บิลย้อนหลัง (F7)</span>
              </button>
            )}

            {/* Barcode Scanner Button */}
            <button
              type="button"
              onClick={() => { playTouchClickSound(); onOpenScanner(); }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer touch-btn"
              title="เปิดกล้องสแกนบาร์โค้ด"
            >
              <Scan className="w-4 h-4" />
              <span>สแกนบาร์โค้ด</span>
            </button>

            {/* Held Sales Shortcut (F6) */}
            {heldSales.length > 0 && (
              <button
                type="button"
                onClick={() => { playTouchClickSound(); onOpenHeldList(); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer touch-btn animate-pulse"
                title="เรียกคืนบิลที่พักไว้ (F6)"
              >
                <Clock className="w-4 h-4" />
                <span>บิลพักไว้ ({heldSales.length})</span>
              </button>
            )}

            {/* Touch Mode Quick Switch Button */}
            {onToggleTouchMode && (
              <button
                type="button"
                onClick={() => { playTouchClickSound(); onToggleTouchMode(); }}
                className={`p-2 rounded-xl border text-xs font-semibold transition-colors shrink-0 cursor-pointer touch-btn ${
                  isTouchMode
                    ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                    : 'bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-900'
                }`}
                title={isTouchMode ? 'โหมดจอสัมผัส: เปิดอยู่ (ปุ่มใหญ่พิเศษ)' : 'คลิกเพื่อเปิดโหมดจอสัมผัส'}
              >
                <Tablet className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. QUICK PICK BUTTONS STRIP: สินค้าขายดีด่วน (สามารถเพิ่ม/ลดสินค้าได้) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs border border-stone-200 space-y-3 select-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-stone-900">
                ปุ่มลัดขายดีด่วน
              </span>
              <span className="text-xs text-stone-400 font-mono ml-1.5">
                ({quickPicks.length} รายการ)
              </span>
            </div>
          </div>

          {/* Quick Pick Management Controls: เพิ่ม/ลด สินค้าในปุ่มลัด */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playTouchClickSound();
                setIsEditingQuickPicks(!isEditingQuickPicks);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer touch-btn ${
                isEditingQuickPicks
                  ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
              title="เปิด/ปิด โหมดแก้ไขปุ่มลัด (กดลบปุ่มลัดได้ทันที)"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{isEditingQuickPicks ? 'เสร็จสิ้นการแก้ไข' : 'แก้ไขปุ่มลัด'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTouchClickSound();
                setIsQuickPickModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer touch-btn"
              title="เพิ่มหรือลบสินค้าในปุ่มลัดขายด่วน"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่ม/ลดปุ่มลัด</span>
            </button>
          </div>
        </div>

        {/* Quick Pick Items Grid: 2 cols on mobile, 3-4 on tablet, 5-8 on wide POS screens */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-2.5">
          {quickPicks.map((product) => {
            const inCartQty = cartItemMap.get(product.id) || 0;
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className={`relative group rounded-2xl border transition-all text-left flex flex-col justify-between overflow-hidden ${
                  inCartQty > 0
                    ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                    : 'border-stone-200 bg-stone-50/70 hover:border-amber-300 hover:bg-white'
                } ${isTouchMode ? 'p-3' : 'p-2.5'}`}
              >
                {/* Delete / Remove quick pick button in edit mode */}
                {isEditingQuickPicks && onToggleQuickPick && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playTouchClickSound();
                      onToggleQuickPick(product.id);
                    }}
                    className="absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md cursor-pointer touch-btn"
                    title="ลบสินค้านี้ออกจากปุ่มลัด"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Clickable Area to Add to Cart */}
                <div
                  onClick={() => {
                    if (!isOutOfStock) {
                      playTouchClickSound();
                      onAddToCart(product, 1);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1 group-hover:text-amber-900">
                      {product.name}
                    </span>
                  </div>

                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-black text-emerald-700 font-mono text-sm tabular-nums">
                      ฿{product.sellPrice}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      เหลือ {product.stock}
                    </span>
                  </div>
                </div>

                {/* Direct Quantity Controls on Quick Pick Button if item is in cart */}
                {inCartQty > 0 ? (
                  <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTouchClickSound();
                        onUpdateCartQuantity(product.id, inCartQty - 1);
                      }}
                      className="w-6 h-6 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center cursor-pointer touch-btn"
                      title="ลดจำนวนในตะกร้า"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <span className="font-mono font-bold text-xs text-amber-900 px-1 bg-amber-200/60 rounded">
                      ในตะกร้า: {inCartQty}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTouchClickSound();
                        onUpdateCartQuantity(product.id, inCartQty + 1);
                      }}
                      disabled={inCartQty >= product.stock}
                      className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-stone-950 font-bold flex items-center justify-center cursor-pointer touch-btn"
                      title="เพิ่มจำนวนในตะกร้า"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center justify-end">
                    <span className="text-[10px] text-stone-400 group-hover:text-amber-600 flex items-center gap-0.5">
                      <Plus className="w-3 h-3" />
                      <span>แตะใส่ตะกร้า</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* "+ เพิ่มปุ่มลัด" slot */}
          <button
            type="button"
            onClick={() => {
              playTouchClickSound();
              setIsQuickPickModalOpen(true);
            }}
            className="border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/40 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-stone-400 hover:text-amber-700 transition-all cursor-pointer min-h-[76px] touch-btn"
          >
            <Plus className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold">เพิ่มปุ่มลัด</span>
          </button>
        </div>
      </div>

      {/* 3. WIDE EXPANDED CART SCREEN (รายการในตะกร้า กว้างขึ้น เต็มตา สบายจอ) */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
        {/* Cart Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">รายการสินค้าในตะกร้า</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold font-mono">
                  {cartItemCount} ชิ้น ({cart.length} รายการ)
                </span>
              </div>
              <p className="text-xs text-stone-300">
                แตะที่รายการเพื่อเปลี่ยนจำนวนด่วน หรือกดปุ่ม +/-
              </p>
            </div>
          </div>

          {/* Quick Cart Actions */}
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => { playTouchClickSound(); onOpenHoldSale(); }}
                className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 transition-colors cursor-pointer touch-btn"
                title="พักบิลลูกค้านี้ชั่วคราว (F4)"
              >
                <PauseCircle className="w-4 h-4 text-amber-400" />
                <span>พักบิล (F4)</span>
              </button>
            )}

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => { playTouchClickSound(); onClearCart(); }}
                className="text-xs text-rose-300 hover:text-rose-100 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-colors cursor-pointer touch-btn"
                title="ล้างรายการทั้งหมดในตะกร้า"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>ล้างตะกร้า</span>
              </button>
            )}
          </div>
        </div>

        {/* Cart Table Container (Wide View) */}
        <div className="p-3 sm:p-5 overflow-x-auto min-h-[320px]">
          {cart.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center text-stone-400">
                <Package className="w-8 h-8 text-stone-300" />
              </div>
              <h4 className="text-base font-bold text-stone-700">
                ยังไม่มีสินค้าในตะกร้า
              </h4>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md">
                ยิงบาร์โค้ด, แตะปุ่มลัดขายดีด่วนด้านบน, ค้นหาชื่อสินค้า, หรือใช้แป้นตัวเลขเพื่อเริ่มต้นคิดเงิน
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-stone-500">
                <span className="px-2.5 py-1 rounded-lg bg-stone-100 font-mono">F2 คิดเงิน</span>
                <span className="px-2.5 py-1 rounded-lg bg-stone-100 font-mono">F4 พักบิล</span>
                <span className="px-2.5 py-1 rounded-lg bg-stone-100 font-mono">F6 เรียกคืนบิล</span>
                <span className="px-2.5 py-1 rounded-lg bg-stone-100 font-mono">F7 บิลย้อนหลัง</span>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Touch Cards View (Only rendered on small phone screens < sm) */}
              <div className="sm:hidden divide-y divide-stone-100">
                {cart.map((item, index) => {
                  const lineTotal = item.product.sellPrice * item.quantity;
                  return (
                    <div 
                      key={item.product.id} 
                      className="p-3 bg-white hover:bg-amber-50/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            playTouchClickSound();
                            setSelectedTouchItem(item);
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-stone-400">#{index + 1}</span>
                            <span className="font-bold text-stone-900 text-sm">{item.product.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mt-0.5">
                            <span className="text-emerald-700 font-bold">฿{item.product.sellPrice.toLocaleString()} / {item.product.unit}</span>
                            <span>•</span>
                            <span>คงเหลือ {item.product.stock}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            playTouchClickSound();
                            onRemoveFromCart(item.product.id);
                          }}
                          className="p-2 text-stone-300 hover:text-rose-600 rounded-xl touch-btn"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                        {/* Touch Quantity Stepper */}
                        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl border border-stone-200">
                          <button
                            type="button"
                            onClick={() => {
                              playTouchClickSound();
                              onUpdateCartQuantity(item.product.id, item.quantity - 1);
                            }}
                            className="w-8 h-8 rounded-lg bg-white text-stone-700 flex items-center justify-center font-bold text-sm shadow-2xs touch-btn active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playTouchClickSound();
                              setSelectedTouchItem(item);
                            }}
                            className="min-w-[42px] px-2 py-1 text-center font-mono font-black text-sm text-stone-900 touch-btn"
                            title="แตะเพื่อระบุจำนวน"
                          >
                            {item.quantity}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playTouchClickSound();
                              onUpdateCartQuantity(item.product.id, item.quantity + 1);
                            }}
                            disabled={item.quantity >= item.product.stock}
                            className="w-8 h-8 rounded-lg bg-white disabled:opacity-40 text-stone-700 flex items-center justify-center font-bold text-sm shadow-2xs touch-btn active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Calculated Line Total */}
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 block">รวมเป็นเงิน</span>
                          <span className="font-mono font-black text-emerald-800 text-base tabular-nums">
                            ฿{lineTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tablet & Desktop Widescreen Table (Rendered on screens >= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                      <th className="py-3 px-3 w-12 text-center">#</th>
                      <th className="py-3 px-3">รายการสินค้า</th>
                      <th className="py-3 px-3 w-32 text-right">ราคาต่อหน่วย</th>
                      <th className="py-3 px-3 w-48 text-center">จำนวน (ชิ้น)</th>
                      <th className="py-3 px-3 w-36 text-right">รวมเป็นเงิน</th>
                      <th className="py-3 px-3 w-16 text-center">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {cart.map((item, index) => {
                  const lineTotal = item.product.sellPrice * item.quantity;

                  return (
                    <tr 
                      key={item.product.id}
                      className="hover:bg-amber-50/40 transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="py-3.5 px-3 text-center text-xs font-mono text-stone-400">
                        {index + 1}
                      </td>

                      {/* Product Name & Details */}
                      <td className="py-3.5 px-3">
                        <div 
                          onClick={() => setSelectedTouchItem(item)}
                          className="cursor-pointer group-hover:text-amber-900"
                          title="แตะเพื่อเลือกจำนวนแบบพิเศษ"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm sm:text-base">
                              {item.product.name}
                            </span>
                            <Edit3 className="w-3.5 h-3.5 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-400 font-mono">
                            <span>รหัส: {item.product.barcode}</span>
                            <span>•</span>
                            <span className="text-stone-500">คงเหลือ {item.product.stock} {item.product.unit}</span>
                          </div>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-mono font-bold text-stone-800 text-sm sm:text-base tabular-nums">
                          ฿{item.product.sellPrice.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          ต่อ {item.product.unit}
                        </div>
                      </td>

                      {/* Quantity Stepper */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              playTouchClickSound();
                              onUpdateCartQuantity(item.product.id, item.quantity - 1);
                            }}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer touch-btn active:scale-95"
                            title="ลดจำนวน 1 ชิ้น"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              playTouchClickSound();
                              setSelectedTouchItem(item);
                            }}
                            className="min-w-[48px] px-2.5 py-1.5 text-center font-mono font-black text-sm sm:text-base tabular-nums rounded-xl bg-stone-50 hover:bg-amber-100 hover:text-amber-900 border border-stone-200 transition-colors touch-btn"
                            title="แตะเพื่อเลือกจำนวนแบบรวดเร็ว (ครึ่งโหล, โหล, ลัง)"
                          >
                            {item.quantity}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              playTouchClickSound();
                              onUpdateCartQuantity(item.product.id, item.quantity + 1);
                            }}
                            disabled={item.quantity >= item.product.stock}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 flex items-center justify-center transition-colors cursor-pointer touch-btn active:scale-95"
                            title="เพิ่มจำนวน 1 ชิ้น"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Line Total */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-mono font-black text-stone-900 text-base sm:text-lg tabular-nums text-emerald-800">
                          ฿{lineTotal.toLocaleString()}
                        </span>
                      </td>

                      {/* Remove Button */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            playTouchClickSound();
                            onRemoveFromCart(item.product.id);
                          }}
                          className="p-2 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer touch-btn"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* 4. CART SUMMARY & CHECKOUT DOCK (Auto-adapts: Stacked on mobile, Wide on desktop) */}
        <div className="p-3 sm:p-5 lg:p-6 bg-stone-50 border-t border-stone-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          {/* Left Summary Details */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-stone-600">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-stone-200">
              <span className="text-stone-400">รายการในบิล:</span>
              <span className="font-bold text-stone-900 font-mono">{cart.length} รายการ</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-stone-200">
              <span className="text-stone-400">จำนวนรวม:</span>
              <span className="font-bold text-stone-900 font-mono">{cartItemCount} ชิ้น</span>
            </div>

            {heldSales.length > 0 && (
              <button
                type="button"
                onClick={() => { playTouchClickSound(); onOpenHeldList(); }}
                className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3 py-1.5 sm:py-2 rounded-xl border border-amber-300 transition-colors cursor-pointer touch-btn"
              >
                <Clock className="w-4 h-4 text-amber-700" />
                <span>บิลพัก ({heldSales.length}) [กด F6]</span>
              </button>
            )}
          </div>

          {/* Right Grand Total & Checkout Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
            <div className="flex sm:flex-col justify-between sm:justify-center sm:text-right items-baseline sm:items-end">
              <span className="text-xs text-stone-500 block">ยอดรวมทั้งสิ้น (สุทธิ)</span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 font-mono tabular-nums leading-none">
                ฿{cartTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                playTouchClickSound();
                onOpenPayment();
              }}
              disabled={cart.length === 0}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base sm:text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer touch-btn active:scale-98"
            >
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>คิดเงิน (F2)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Mobile Sticky Bottom Bar for quick checkout when scrolled */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 p-2.5 px-4 flex items-center justify-between gap-3 lg:hidden">
        <div>
          <span className="text-[11px] text-stone-400 block">ยอดรวม ({cartItemCount} ชิ้น)</span>
          <span className="text-xl font-black text-amber-400 font-mono tabular-nums">
            ฿{cartTotal.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNumpad && (
            <button
              type="button"
              onClick={() => { playTouchClickSound(); onOpenNumpad(); }}
              className="p-2.5 rounded-xl bg-stone-800 text-stone-200 font-bold text-xs touch-btn"
              title="แป้นตัวเลข"
            >
              <Calculator className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => { playTouchClickSound(); onOpenScanner(); }}
            className="p-2.5 rounded-xl bg-stone-800 text-amber-400 font-bold text-xs touch-btn"
            title="สแกนบาร์โค้ด"
          >
            <Scan className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => { playTouchClickSound(); onOpenPayment(); }}
            disabled={cart.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl touch-btn flex items-center gap-1.5 shadow-md"
          >
            <CreditCard className="w-4 h-4" />
            <span>คิดเงิน (F2)</span>
          </button>
        </div>
      </div>

      {/* Touch Quantity Stepper Modal */}
      {selectedTouchItem && (
        <CartTouchQuantityModal
          isOpen={!!selectedTouchItem}
          item={selectedTouchItem}
          onClose={() => setSelectedTouchItem(null)}
          onUpdateQuantity={onUpdateCartQuantity}
          onRemoveItem={onRemoveFromCart}
        />
      )}

      {/* Quick Pick Manager Modal */}
      {isQuickPickModalOpen && onToggleQuickPick && (
        <QuickPickManageModal
          isOpen={isQuickPickModalOpen}
          onClose={() => setIsQuickPickModalOpen(false)}
          products={products}
          onToggleQuickPick={onToggleQuickPick}
        />
      )}
    </div>
  );
};
