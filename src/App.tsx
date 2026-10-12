import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { PosView } from './components/PosView';
import { DebtLedgerView } from './components/DebtLedgerView';
import { InventoryView } from './components/InventoryView';
import { SalesReportsView } from './components/SalesReportsView';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { HoldSaleModal } from './components/HoldSaleModal';
import { HeldSalesListModal } from './components/HeldSalesListModal';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { TouchNumpadModal } from './components/TouchNumpadModal';
import { PastBillsModal } from './components/PastBillsModal';
import { useGroceryStore } from './hooks/useGroceryStore';
import { useGoogleDriveSync } from './hooks/useGoogleDriveSync';
import { SaleRecord, PaymentMethod } from './types';
import { Store, ShieldCheck, HeartHandshake, Cloud } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isHeldListModalOpen, setIsHeldListModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [isPastBillsOpen, setIsPastBillsOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<SaleRecord | null>(null);

  // Touchscreen Mode state (Auto-detects touch devices or restores user preference)
  const [isTouchMode, setIsTouchMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('grocery_pos_touch_mode');
      if (saved !== null) return saved === 'true';
      return 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0);
    }
    return false;
  });

  const handleToggleTouchMode = () => {
    setIsTouchMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('grocery_pos_touch_mode', next.toString());
      }
      return next;
    });
  };

  const {
    products,
    filteredProducts,
    cart,
    debts,
    sales,
    settings,
    lastSale,
    searchQuery,
    selectedCategory,
    cartTotal,
    cartItemCount,
    lowStockCount,
    totalOutstandingDebt,
    heldSales,
    holdCurrentSale,
    resumeHeldSale,
    deleteHeldSale,
    setSearchQuery,
    setSelectedCategory,
    setSettings,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    handleScanBarcode,
    completeSale,
    repayDebt,
    saveCustomerDebt,
    saveProduct,
    deleteProduct,
    toggleQuickPick,
    restockProduct,
    importProducts,
    applyRemoteDatabase,
    resetToSampleData,
  } = useGroceryStore();

  const {
    user: driveUser,
    isAuthenticated: isDriveConnected,
    syncStatus: driveSyncStatus,
    lastSyncedAt: driveLastSyncedAt,
    syncError: driveSyncError,
    fileInfo: driveFileInfo,
    autoSyncEnabled,
    setAutoSyncEnabled,
    loginWithGoogle,
    logoutGoogle,
    syncToDriveNow,
    pullFromDriveNow,
  } = useGoogleDriveSync({
    products,
    sales,
    debts,
    heldSales,
    settings,
    onApplyRemoteDatabase: applyRemoteDatabase,
  });

  const handleOpenPayment = () => {
    if (cart.length > 0) {
      setIsPaymentOpen(true);
    }
  };

  const handleConfirmPayment = (
    method: PaymentMethod,
    cashReceived?: number,
    change?: number,
    customerId?: string,
    customerName?: string,
    discount?: number,
    qrProvider?: import('./types').QrPaymentProvider
  ) => {
    const sale = completeSale(
      method,
      cashReceived,
      change,
      customerId,
      customerName,
      discount,
      qrProvider
    );
    setIsPaymentOpen(false);
    setViewingReceipt(sale);
    setIsReceiptOpen(true);
  };

  const handleViewReceipt = (sale: SaleRecord) => {
    setViewingReceipt(sale);
    setIsReceiptOpen(true);
  };

  const handleBarcodeScanned = (barcode: string) => {
    const success = handleScanBarcode(barcode);
    if (success) {
      setIsScannerOpen(false);
    }
  };

  const handleReorderPastBill = (sale: SaleRecord) => {
    // Add all items from the past bill back to the cart
    sale.items.forEach((item) => {
      const existingProduct = products.find(
        (p) => p.id === item.productId || (item.barcode && p.barcode === item.barcode)
      );

      if (existingProduct) {
        addToCart(existingProduct, item.quantity);
      } else {
        addToCart({
          id: item.productId,
          barcode: item.barcode || '',
          name: item.name,
          category: 'ของใช้ในบ้าน',
          costPrice: item.costPrice,
          sellPrice: item.sellPrice,
          stock: 99,
          unit: item.unit || 'ชิ้น',
          lowStockThreshold: 5,
        }, item.quantity);
      }
    });

    setActiveTab('pos');
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans">
      {/* Top Bar (Strict 3-zone contract) */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDriveSync={() => setIsDriveModalOpen(true)}
        onOpenPastBills={() => setIsPastBillsOpen(true)}
        isDriveConnected={isDriveConnected}
        driveSyncStatus={driveSyncStatus}
        cartCount={cartItemCount}
        lowStockCount={lowStockCount}
        totalDebt={totalOutstandingDebt}
        storeName={settings.storeName}
        heldSalesCount={heldSales.length}
        isTouchMode={isTouchMode}
        onToggleTouchMode={handleToggleTouchMode}
      />

      {/* Main Container: Auto-scales fluidly from 320px mobile to 1920px+ widescreen POS monitors */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Responsive Store Banner for POS View */}
        {activeTab === 'pos' && (
          <div className="relative overflow-hidden rounded-2xl bg-stone-900 text-white shadow-xs border border-stone-800">
            {/* Desktop / Tablet View (md and above) */}
            <div className="hidden md:flex relative z-10 items-center justify-between p-4 lg:p-5 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                    ระบบขายหน้าร้านของชำชุมชน
                  </span>
                  <span className="text-stone-400 text-xs">·</span>
                  <span className="text-stone-300 text-xs">{settings.storeOwner}</span>
                  {isTouchMode && (
                    <span className="bg-amber-400 text-stone-950 px-2 py-0.5 rounded text-[10px] font-bold">
                      โหมดจอสัมผัส
                    </span>
                  )}
                </div>
                <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white">
                  {settings.storeName}
                </h1>
                <p className="text-xs text-stone-300 max-w-xl">
                  {settings.address} · โทร {settings.phone} · พร้อมเพย์ {settings.promptPayId}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-colors touch-btn ${
                    isDriveConnected
                      ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300 hover:bg-emerald-900/70'
                      : 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                  }`}
                  title="คลิกเพื่อจัดการการซิงค์ฐานข้อมูล Google Drive"
                >
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isDriveConnected
                      ? driveSyncStatus === 'syncing'
                        ? 'กำลังซิงค์ Drive...'
                        : 'Drive ซิงค์ตลอดเวลา'
                      : 'เชื่อมต่อ Google Drive'}
                  </span>
                  {isDriveConnected && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        driveSyncStatus === 'syncing' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                      }`}
                    ></span>
                  )}
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 border border-stone-700 text-xs text-stone-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>บันทึกข้อมูลออฟไลน์ในเครื่อง</span>
                </div>
              </div>
            </div>

            {/* Mobile Compact View (< md): Saves vertical height for cart and quick picks */}
            <div className="md:hidden relative z-10 px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white truncate">
                    {settings.storeName}
                  </span>
                  {isTouchMode && (
                    <span className="bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0">
                      จอสัมผัส
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-400 flex items-center gap-1 truncate">
                  <span>โทร {settings.phone}</span>
                  <span>•</span>
                  <span>พร้อมเพย์ {settings.promptPayId}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div 
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800 text-[11px] text-stone-300"
                  title="บันทึกข้อมูลออฟไลน์ในเครื่อง"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px]">ออฟไลน์</span>
                </div>
              </div>
            </div>

            {/* Background subtle hero image scrim */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <img
                src="/src/assets/images/grocery_store_hero_1791555987514.jpg"
                alt="ร้านขายของชำ"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Tab 1: POS Cashier */}
        {activeTab === 'pos' && (
          <PosView
            products={products}
            filteredProducts={filteredProducts}
            cart={cart}
            heldSales={heldSales}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            cartTotal={cartTotal}
            cartItemCount={cartItemCount}
            isTouchMode={isTouchMode}
            onToggleTouchMode={handleToggleTouchMode}
            onOpenNumpad={() => setIsNumpadOpen(true)}
            onOpenPastBills={() => setIsPastBillsOpen(true)}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onAddToCart={addToCart}
            onUpdateCartQuantity={updateCartQuantity}
            onRemoveFromCart={removeFromCart}
            onClearCart={clearCart}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenPayment={handleOpenPayment}
            onOpenHoldSale={() => setIsHoldModalOpen(true)}
            onOpenHeldList={() => setIsHeldListModalOpen(true)}
            onScanBarcode={handleScanBarcode}
            onToggleQuickPick={toggleQuickPick}
          />
        )}

        {/* Tab 2: Debt Ledger (สมุดแปะโป้ง) */}
        {activeTab === 'debt' && (
          <DebtLedgerView
            debts={debts}
            totalOutstandingDebt={totalOutstandingDebt}
            settings={settings}
            onRepayDebt={repayDebt}
            onSaveCustomer={saveCustomerDebt}
          />
        )}

        {/* Tab 3: Inventory & Stock */}
        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            onSaveProduct={saveProduct}
            onDeleteProduct={deleteProduct}
            onRestockProduct={restockProduct}
            onResetSampleData={resetToSampleData}
            onImportProducts={importProducts}
          />
        )}

        {/* Tab 4: Sales Reports */}
        {activeTab === 'reports' && (
          <SalesReportsView
            sales={sales}
            settings={settings}
            onViewReceipt={handleViewReceipt}
            onOpenPastBills={() => setIsPastBillsOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 px-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {settings.storeName} — ระบบขายของร้านป้าศรี</p>
          <div className="flex flex-wrap items-center gap-3 text-stone-400">
            <span>F2: คิดเงิน</span>
            <span>·</span>
            <span className="text-amber-600 font-medium">F4: พักบิล</span>
            <span>·</span>
            <span className="text-amber-600 font-medium">F6: เรียกคืนบิลที่พักไว้</span>
            <span>·</span>
            <span className="text-amber-600 font-medium">F7: บิลย้อนหลัง</span>
            <span>·</span>
            <span>บาร์โค้ด USB</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        products={products}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalAmount={cartTotal}
        debts={debts}
        settings={settings}
        onConfirmPayment={handleConfirmPayment}
      />

      <ReceiptModal
        sale={viewingReceipt}
        settings={settings}
        onClose={() => {
          setIsReceiptOpen(false);
          setViewingReceipt(null);
        }}
      />

      <StoreSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onOpenDriveSync={() => setIsDriveModalOpen(true)}
        isDriveConnected={isDriveConnected}
      />

      {/* Google Drive Database Sync Modal */}
      <GoogleDriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        user={driveUser}
        isAuthenticated={isDriveConnected}
        syncStatus={driveSyncStatus}
        lastSyncedAt={driveLastSyncedAt}
        syncError={driveSyncError}
        fileInfo={driveFileInfo}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={setAutoSyncEnabled}
        onLogin={loginWithGoogle}
        onLogout={logoutGoogle}
        onSyncNow={syncToDriveNow}
        onPullNow={pullFromDriveNow}
      />

      {/* Hold Sale (พักการขาย) Modals */}
      <HoldSaleModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        onConfirmHold={holdCurrentSale}
      />

      <HeldSalesListModal
        isOpen={isHeldListModalOpen}
        onClose={() => setIsHeldListModalOpen(false)}
        heldSales={heldSales}
        currentCartItemCount={cartItemCount}
        onResumeHeldSale={resumeHeldSale}
        onDeleteHeldSale={deleteHeldSale}
      />

      {/* Touchscreen Numpad / Barcode Input Modal */}
      <TouchNumpadModal
        isOpen={isNumpadOpen}
        onClose={() => setIsNumpadOpen(false)}
        products={products}
        onAddToCart={addToCart}
        onScanBarcode={handleScanBarcode}
      />

      {/* Past Bills Modal (เรียกดูบิลย้อนหลังพร้อมรายละเอียด) */}
      <PastBillsModal
        isOpen={isPastBillsOpen}
        onClose={() => setIsPastBillsOpen(false)}
        sales={sales}
        products={products}
        settings={settings}
        onViewReceiptSlip={handleViewReceipt}
        onReorderToCart={handleReorderPastBill}
      />
    </div>
  );
}
