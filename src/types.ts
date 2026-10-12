export type ProductCategory = 
  | 'เครื่องดื่ม'
  | 'ขนมและบะหมี่'
  | 'เครื่องปรุงและของแห้ง'
  | 'ของใช้ในบ้าน'
  | 'ไข่และของสด'
  | 'บุหรี่และของใช้ผู้ใหญ่';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  costPrice: number;
  sellPrice: number;
  stock: number;
  unit: string; // เช่น ซอง, ขวด, กระป๋อง, ฟอง, กก., ถุง, ชิ้น, แพ็ค
  lowStockThreshold: number;
  image?: string;
  quickPick?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface HeldSale {
  id: string;
  label: string;
  note?: string;
  createdAt: string;
  items: CartItem[];
  total: number;
}

export type PaymentMethod = 'cash' | 'promptpay' | 'credit';
export type QrPaymentProvider = 'promptpay' | 'kshop' | 'tungngern';

export interface SaleItem {
  productId: string;
  name: string;
  barcode: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  total: number;
}

export interface SaleRecord {
  id: string; // e.g. RCP-20261009-001
  timestamp: string; // ISO date
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  qrProvider?: QrPaymentProvider; // promptpay | kshop | tungngern
  cashReceived?: number;
  change?: number;
  customerId?: string; // ถ้าเป็นแปะโป้ง
  customerName?: string;
  note?: string;
}

export interface DebtTransaction {
  id: string;
  date: string;
  type: 'borrow' | 'repay';
  amount: number;
  saleId?: string;
  note: string;
}

export interface CustomerDebt {
  id: string;
  name: string;
  phone: string;
  addressOrNote: string;
  totalDebt: number;
  transactions: DebtTransaction[];
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  storeOwner: string;
  promptPayId: string; // เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน
  kShopId?: string; // รหัสร้านค้า K SHOP หรือ เบอร์กสิกร
  tungNgernId?: string; // รหัสร้านค้าถุงเงิน หรือ เบอร์กรุงไทย
  address: string;
  phone: string;
  receiptFooter: string;
}
