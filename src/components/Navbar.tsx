import { SlidersHorizontal, ShoppingBag, Cloud, RefreshCw, AlertCircle, Tablet, Receipt } from 'lucide-react';

export type ActiveTab = 'pos' | 'debt' | 'inventory' | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  onOpenDriveSync?: () => void;
  onOpenPastBills?: () => void;
  isDriveConnected?: boolean;
  driveSyncStatus?: 'disconnected' | 'idle' | 'syncing' | 'synced' | 'error';
  cartCount: number;
  lowStockCount: number;
  totalDebt: number;
  storeName?: string;
  heldSalesCount?: number;
  isTouchMode?: boolean;
  onToggleTouchMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenDriveSync,
  onOpenPastBills,
  isDriveConnected = false,
  driveSyncStatus = 'disconnected',
  cartCount,
  lowStockCount,
  totalDebt,
  storeName = 'ร้านป้าศรี (ศรีรวยการค้า) POS',
  heldSalesCount = 0,
  isTouchMode = false,
  onToggleTouchMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-md">
      <div className="w-full max-w-[1920px] mx-auto px-2.5 sm:px-4 lg:px-6">
        {/* Medium & Large Screens: Single row layout (Brand, Navigation Tabs, Tools) */}
        <div className="hidden md:flex h-16 items-center justify-between gap-4 lg:gap-6">
          {/* Zone 1: Brand wordmark */}
          <button
            onClick={() => onTabChange('pos')}
            className="text-lg lg:text-xl font-bold tracking-tight text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer touch-btn"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <span>{storeName.includes('POS') ? storeName : `${storeName} POS`}</span>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-1.5 lg:gap-3 text-xs lg:text-sm font-medium">
            <button
              onClick={() => onTabChange('pos')}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-btn ${
                activeTab === 'pos'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>ขายหน้าร้าน</span>
              {cartCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-stone-900 text-amber-300 text-xs rounded-full font-mono font-bold">
                  {cartCount}
                </span>
              )}
              {heldSalesCount > 0 && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-stone-950 text-xs rounded-full font-mono font-bold"
                  title={`มีบิลที่พักไว้ ${heldSalesCount} บิล`}
                >
                  พัก {heldSalesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('debt')}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-btn ${
                activeTab === 'debt'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>สมุดแปะโป้ง</span>
              {totalDebt > 0 && (
                <span className="ml-1.5 text-xs text-amber-400 font-mono font-bold">
                  (฿{totalDebt.toLocaleString()})
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('inventory')}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-btn ${
                activeTab === 'inventory'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>สินค้าและสต็อก</span>
              {lowStockCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-rose-600 text-white text-xs rounded-full font-mono font-bold">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('reports')}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-btn ${
                activeTab === 'reports'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>สรุปยอดขาย</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenDriveSync && (
              <button
                onClick={onOpenDriveSync}
                title={
                  isDriveConnected
                    ? 'ดูสถานะการซิงค์ข้อมูล Google Drive'
                    : 'คลิกเพื่อเชื่อมต่อ Google Drive สำหรับสำรองฐานข้อมูล'
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer border touch-btn ${
                  isDriveConnected
                    ? driveSyncStatus === 'syncing'
                      ? 'bg-amber-950/60 border-amber-600/60 text-amber-300'
                      : driveSyncStatus === 'error'
                      ? 'bg-rose-950/60 border-rose-600/60 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/50'
                    : 'bg-stone-800 hover:bg-stone-700 border-amber-500/40 text-amber-400'
                }`}
              >
                {isDriveConnected ? (
                  <>
                    {driveSyncStatus === 'syncing' ? (
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    ) : driveSyncStatus === 'error' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="hidden xl:inline">
                      {driveSyncStatus === 'syncing'
                        ? 'กำลังซิงค์ Drive...'
                        : driveSyncStatus === 'error'
                        ? 'Drive ผิดพลาด'
                        : 'Drive อัปเดตตลอดเวลา'}
                    </span>
                    <span className="xl:hidden">Drive</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden lg:inline">เชื่อมต่อ Drive</span>
                    <span className="lg:hidden">Drive</span>
                  </>
                )}
              </button>
            )}

            {onToggleTouchMode && (
              <button
                onClick={onToggleTouchMode}
                title={isTouchMode ? 'โหมดจอสัมผัสเปิดอยู่ - คลิกเพื่อปิด' : 'คลิกเพื่อเปิดโหมดจอสัมผัส (Touchscreen Mode)'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer border touch-btn ${
                  isTouchMode
                    ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-xs'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>
                  {isTouchMode ? 'จอสัมผัส: เปิด' : 'จอสัมผัส'}
                </span>
              </button>
            )}

            {onOpenPastBills && (
              <button
                onClick={onOpenPastBills}
                title="เรียกดูบิลย้อนหลังพร้อมรายละเอียด (F7)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-btn"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">บิลย้อนหลัง (F7)</span>
                <span className="lg:hidden">บิล (F7)</span>
              </button>
            )}

            <button
              onClick={onOpenSettings}
              title="ตั้งค่าร้านและพร้อมเพย์"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-btn"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">ตั้งค่าร้าน</span>
            </button>
          </div>
        </div>

        {/* Small Screens (< md): 2-tier responsive mobile header */}
        <div className="md:hidden py-2 space-y-2">
          {/* Mobile Top Row: Store Name & Quick Status/Tool Icons */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onTabChange('pos')}
              className="text-base font-bold text-amber-400 flex items-center gap-1.5 truncate cursor-pointer touch-btn"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{storeName}</span>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {onToggleTouchMode && (
                <button
                  onClick={onToggleTouchMode}
                  title="เปิด/ปิด โหมดจอสัมผัส"
                  className={`p-1.5 rounded-lg border text-xs font-bold transition-colors touch-btn ${
                    isTouchMode
                      ? 'bg-amber-400 text-stone-950 border-amber-300'
                      : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
              )}

              {onOpenPastBills && (
                <button
                  onClick={onOpenPastBills}
                  title="เรียกดูบิลย้อนหลัง"
                  className="p-1.5 rounded-lg bg-stone-800 text-amber-300 border border-stone-700 touch-btn"
                >
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                </button>
              )}

              {onOpenDriveSync && (
                <button
                  onClick={onOpenDriveSync}
                  title="สถานะ Google Drive"
                  className={`p-1.5 rounded-lg border text-xs transition-colors touch-btn ${
                    isDriveConnected
                      ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onOpenSettings}
                title="ตั้งค่าร้าน"
                className="p-1.5 rounded-lg bg-stone-800 text-stone-200 border border-stone-700 touch-btn"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Bottom Row: Horizontally scrollable tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5 touch-scroll">
            <button
              onClick={() => onTabChange('pos')}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer touch-btn ${
                activeTab === 'pos'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'bg-stone-800/80 text-stone-300 hover:text-white'
              }`}
            >
              <span>ขายหน้าร้าน</span>
              {cartCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-stone-900 text-amber-300 text-[10px] rounded-full font-mono font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('debt')}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer touch-btn ${
                activeTab === 'debt'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'bg-stone-800/80 text-stone-300 hover:text-white'
              }`}
            >
              <span>สมุดแปะโป้ง</span>
              {totalDebt > 0 && (
                <span className="ml-1 text-[10px] text-amber-400 font-mono font-bold">
                  ฿{Math.round(totalDebt).toLocaleString()}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('inventory')}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer touch-btn ${
                activeTab === 'inventory'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'bg-stone-800/80 text-stone-300 hover:text-white'
              }`}
            >
              <span>สินค้าและสต็อก</span>
              {lowStockCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] rounded-full font-mono font-bold">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('reports')}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer touch-btn ${
                activeTab === 'reports'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'bg-stone-800/80 text-stone-300 hover:text-white'
              }`}
            >
              <span>สรุปยอดขาย</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
