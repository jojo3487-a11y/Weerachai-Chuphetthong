import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Product, 
  CartItem, 
  SaleRecord, 
  CustomerDebt, 
  StoreSettings, 
  PaymentMethod,
  ProductCategory,
  HeldSale
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_DEBTS, INITIAL_SETTINGS } from '../data/initialData';
import { playScanBeep, playCashRegisterSound, playErrorSound } from '../utils/sound';
import { StoreDatabasePayload } from '../services/googleDriveService';

const STORAGE_KEYS = {
  PRODUCTS: 'grocery_pos_products_v1',
  SALES: 'grocery_pos_sales_v1',
  DEBTS: 'grocery_pos_debts_v1',
  SETTINGS: 'grocery_pos_settings_v1',
  HELD_SALES: 'grocery_pos_held_sales_v1',
};

export function useGroceryStore() {
  // Load products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });

  // Load sales
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Load debts
  const [debts, setDebts] = useState<CustomerDebt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEBTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DEBTS;
  });

  // Load settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SETTINGS;
  });

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ทั้งหมด'>('ทั้งหมด');

  // Held sales state (พักการขาย)
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HELD_SALES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Last completed sale for receipt preview
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HELD_SALES, JSON.stringify(heldSales));
  }, [heldSales]);

  // Cart operations
  const addToCart = useCallback((product: Product, qty = 1) => {
    if (product.stock <= 0) {
      playErrorSound();
      return false;
    }

    playScanBeep();
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + qty;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: nextQty }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    return true;
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Quick barcode scan lookup & add
  const handleScanBarcode = useCallback((barcode: string): boolean => {
    const clean = barcode.trim();
    if (!clean) return false;
    const found = products.find(
      (p) => p.barcode === clean || p.id.toLowerCase() === clean.toLowerCase()
    );
    if (found) {
      addToCart(found, 1);
      return true;
    } else {
      playErrorSound();
      return false;
    }
  }, [products, addToCart]);

  // Cart totals
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);
  }, [cart]);

  const cartCostTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.costPrice * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Hold Sale operations (พักการขาย)
  const holdCurrentSale = useCallback((note?: string): HeldSale | null => {
    if (cart.length === 0) return null;

    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const defaultLabel = `บิลพัก #${heldSales.length + 1} (${timeStr})`;
    const finalLabel = note && note.trim() ? note.trim() : defaultLabel;

    const newHeld: HeldSale = {
      id: `HOLD-${Date.now()}`,
      label: finalLabel,
      note: note && note.trim() ? note.trim() : undefined,
      createdAt: new Date().toISOString(),
      items: [...cart],
      total: cartTotal,
    };

    setHeldSales((prev) => [newHeld, ...prev]);
    setCart([]);
    playScanBeep();
    return newHeld;
  }, [cart, cartTotal, heldSales.length]);

  const resumeHeldSale = useCallback((heldSaleId: string): boolean => {
    const target = heldSales.find((h) => h.id === heldSaleId);
    if (!target) return false;

    // If current cart is NOT empty, automatically hold current items so they aren't lost
    if (cart.length > 0) {
      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const currentHeld: HeldSale = {
        id: `HOLD-${Date.now()}`,
        label: `บิลสลับ (${timeStr})`,
        createdAt: new Date().toISOString(),
        items: [...cart],
        total: cartTotal,
      };

      setHeldSales((prev) => [
        currentHeld,
        ...prev.filter((h) => h.id !== heldSaleId),
      ]);
    } else {
      setHeldSales((prev) => prev.filter((h) => h.id !== heldSaleId));
    }

    setCart(target.items);
    playScanBeep();
    return true;
  }, [heldSales, cart, cartTotal]);

  const deleteHeldSale = useCallback((heldSaleId: string) => {
    setHeldSales((prev) => prev.filter((h) => h.id !== heldSaleId));
  }, []);

  // Finalize Sale
  const completeSale = useCallback((
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    change?: number,
    customerId?: string,
    customerName?: string,
    discount = 0,
    qrProvider?: import('../types').QrPaymentProvider
  ): SaleRecord => {
    const saleId = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalTotal = Math.max(0, cartTotal - discount);
    const profit = finalTotal - cartCostTotal;

    const saleItems = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      barcode: item.product.barcode,
      quantity: item.quantity,
      unit: item.product.unit,
      costPrice: item.product.costPrice,
      sellPrice: item.product.sellPrice,
      total: item.product.sellPrice * item.quantity,
    }));

    const newSale: SaleRecord = {
      id: saleId,
      timestamp: new Date().toISOString(),
      items: saleItems,
      subtotal: cartTotal,
      discount,
      total: finalTotal,
      totalCost: cartCostTotal,
      profit,
      paymentMethod,
      qrProvider: paymentMethod === 'promptpay' ? qrProvider : undefined,
      cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
      change: paymentMethod === 'cash' ? change : undefined,
      customerId,
      customerName,
      note: paymentMethod === 'credit' ? `แปะโป้งโดย: ${customerName}` : undefined,
    };

    // 1. Deduct Stock
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cart.find((ci) => ci.product.id === p.id);
        if (cartItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - cartItem.quantity),
          };
        }
        return p;
      })
    );

    // 2. If Debt / Credit, add to debt customer record
    if (paymentMethod === 'credit' && customerName) {
      setDebts((prev) => {
        const existingIdx = prev.findIndex(
          (d) => d.id === customerId || d.name.trim().toLowerCase() === customerName.trim().toLowerCase()
        );

        const itemListSummary = cart
          .map((i) => `${i.product.name} x${i.quantity}`)
          .join(', ');

        const newTx = {
          id: `tx-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'borrow' as const,
          amount: finalTotal,
          saleId,
          note: itemListSummary,
        };

        if (existingIdx >= 0) {
          const updated = [...prev];
          const cur = updated[existingIdx];
          updated[existingIdx] = {
            ...cur,
            totalDebt: cur.totalDebt + finalTotal,
            updatedAt: new Date().toISOString(),
            transactions: [newTx, ...cur.transactions],
          };
          return updated;
        } else {
          // New customer
          const newCustomer: CustomerDebt = {
            id: customerId || `debt-${Date.now()}`,
            name: customerName,
            phone: '',
            addressOrNote: 'ลูกค้าหน้าร้าน (เปิดสมุดใหม่)',
            totalDebt: finalTotal,
            updatedAt: new Date().toISOString(),
            transactions: [newTx],
          };
          return [newCustomer, ...prev];
        }
      });
    }

    // 3. Save sale
    setSales((prev) => [newSale, ...prev]);
    setLastSale(newSale);
    clearCart();
    playCashRegisterSound();

    return newSale;
  }, [cart, cartTotal, cartCostTotal, clearCart]);

  // Debt Repayment handler
  const repayDebt = useCallback((customerId: string, amount: number, note: string) => {
    if (amount <= 0) return;
    setDebts((prev) =>
      prev.map((cust) => {
        if (cust.id === customerId) {
          const newTx = {
            id: `tx-${Date.now()}`,
            date: new Date().toISOString(),
            type: 'repay' as const,
            amount,
            note: note || `ชำระหนี้บางส่วน/ทั้งหมด`,
          };
          return {
            ...cust,
            totalDebt: Math.max(0, cust.totalDebt - amount),
            updatedAt: new Date().toISOString(),
            transactions: [newTx, ...cust.transactions],
          };
        }
        return cust;
      })
    );
    playCashRegisterSound();
  }, []);

  // Add / Edit Customer in Debt book
  const saveCustomerDebt = useCallback((customer: Partial<CustomerDebt> & { name: string }) => {
    setDebts((prev) => {
      if (customer.id) {
        return prev.map((c) => (c.id === customer.id ? { ...c, ...customer, updatedAt: new Date().toISOString() } as CustomerDebt : c));
      } else {
        const newCust: CustomerDebt = {
          id: `debt-${Date.now()}`,
          name: customer.name,
          phone: customer.phone || '',
          addressOrNote: customer.addressOrNote || '',
          totalDebt: 0,
          transactions: [],
          updatedAt: new Date().toISOString(),
        };
        return [newCust, ...prev];
      }
    });
  }, []);

  // Product CRUD
  const saveProduct = useCallback((product: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = product;
        return updated;
      }
      return [product, ...prev];
    });
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const toggleQuickPick = useCallback((productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, quickPick: !p.quickPick } : p))
    );
  }, []);

  const restockProduct = useCallback((productId: string, addQuantity: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + addQuantity } : p))
    );
  }, []);

  const importProducts = useCallback((importedProducts: Product[], mode: 'merge' | 'replace' | 'skip_existing' = 'merge'): number => {
    if (!importedProducts || importedProducts.length === 0) return 0;

    let addedOrUpdatedCount = 0;

    setProducts((prev) => {
      if (mode === 'replace') {
        addedOrUpdatedCount = importedProducts.length;
        return importedProducts;
      }

      const productMap = new Map<string, Product>();
      // Key by barcode first, then id
      prev.forEach((p) => {
        productMap.set(p.barcode || p.id, p);
      });

      importedProducts.forEach((newP) => {
        const key = newP.barcode || newP.id;
        if (mode === 'skip_existing') {
          if (!productMap.has(key)) {
            productMap.set(key, newP);
            addedOrUpdatedCount++;
          }
        } else {
          // 'merge': update existing product details while preserving existing image or id
          const existing = productMap.get(key);
          if (existing) {
            productMap.set(key, {
              ...newP,
              id: existing.id,
              image: newP.image || existing.image,
            });
          } else {
            productMap.set(key, newP);
          }
          addedOrUpdatedCount++;
        }
      });

      return Array.from(productMap.values());
    });

    return addedOrUpdatedCount;
  }, []);

  const applyRemoteDatabase = useCallback((payload: StoreDatabasePayload) => {
    if (payload.products && Array.isArray(payload.products)) {
      setProducts(payload.products);
    }
    if (payload.sales && Array.isArray(payload.sales)) {
      setSales(payload.sales);
    }
    if (payload.debts && Array.isArray(payload.debts)) {
      setDebts(payload.debts);
    }
    if (payload.heldSales && Array.isArray(payload.heldSales)) {
      setHeldSales(payload.heldSales);
    }
    if (payload.settings) {
      setSettings(payload.settings);
    }
  }, []);

  const resetToSampleData = useCallback(() => {
    setProducts(INITIAL_PRODUCTS);
    setDebts(INITIAL_DEBTS);
    setSales([]);
    setSettings(INITIAL_SETTINGS);
    setCart([]);
    localStorage.clear();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Low stock products count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.lowStockThreshold).length;
  }, [products]);

  // Total outstanding debt in neighborhood
  const totalOutstandingDebt = useMemo(() => {
    return debts.reduce((sum, d) => sum + d.totalDebt, 0);
  }, [debts]);

  return {
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
    cartCostTotal,
    cartItemCount,
    lowStockCount,
    totalOutstandingDebt,
    setSearchQuery,
    setSelectedCategory,
    setSettings,
    setLastSale,
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
    heldSales,
    holdCurrentSale,
    resumeHeldSale,
    deleteHeldSale,
    applyRemoteDatabase,
    resetToSampleData,
  };
}
