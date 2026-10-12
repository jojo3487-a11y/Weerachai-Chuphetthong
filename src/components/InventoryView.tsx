import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  X, 
  RotateCcw,
  PlusCircle,
  Barcode,
  Upload,
  Download,
  CheckCircle2
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { CsvImportModal } from './CsvImportModal';
import { exportProductsToCSV, downloadFile } from '../utils/csvHelper';

interface InventoryViewProps {
  products: Product[];
  onSaveProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onRestockProduct: (id: string, qty: number) => void;
  onResetSampleData: () => void;
  onImportProducts: (products: Product[], mode: 'merge' | 'replace' | 'skip_existing') => void;
}

const CATEGORIES: ProductCategory[] = [
  'เครื่องดื่ม',
  'ขนมและบะหมี่',
  'เครื่องปรุงและของแห้ง',
  'ของใช้ในบ้าน',
  'ไข่และของสด',
  'บุหรี่และของใช้ผู้ใหญ่',
];

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
  onRestockProduct,
  onResetSampleData,
  onImportProducts,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ทั้งหมด');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [restockModalItem, setRestockModalItem] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<string>('12');

  // Form state
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('เครื่องดื่ม');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('ชิ้น');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [quickPick, setQuickPick] = useState(false);

  const filtered = products.filter((p) => {
    const matchCat = categoryFilter === 'ทั้งหมด' || p.category === categoryFilter;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    return matchCat && matchSearch;
  });

  const handleExportCSV = () => {
    const csvData = exportProductsToCSV(products);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(csvData, `รายการสต็อกสินค้า_${dateStr}.csv`);
  };

  const handleImportConfirm = (importedProducts: Product[], mode: 'merge' | 'replace' | 'skip_existing') => {
    onImportProducts(importedProducts, mode);
    setImportNotice(`นำเข้าข้อมูลสินค้าสำเร็จ ${importedProducts.length} รายการ (${mode === 'merge' ? 'อัปเดตและเพิ่มใหม่' : mode === 'replace' ? 'แทนที่ทั้งหมด' : 'ข้ามรายการซ้ำ'})`);
    setTimeout(() => {
      setImportNotice(null);
    }, 4000);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setBarcode(`885${Date.now().toString().slice(-10)}`);
    setName('');
    setCategory('เครื่องดื่ม');
    setCostPrice('');
    setSellPrice('');
    setStock('20');
    setUnit('ชิ้น');
    setLowStockThreshold('5');
    setQuickPick(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setBarcode(p.barcode);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(p.costPrice.toString());
    setSellPrice(p.sellPrice.toString());
    setStock(p.stock.toString());
    setUnit(p.unit);
    setLowStockThreshold(p.lowStockThreshold.toString());
    setQuickPick(!!p.quickPick);
    setIsAddModalOpen(true);
  };

  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const prod: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      barcode: barcode.trim() || `885${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      name: name.trim(),
      category,
      costPrice: parseFloat(costPrice) || 0,
      sellPrice: parseFloat(sellPrice) || 0,
      stock: parseInt(stock) || 0,
      unit: unit.trim() || 'ชิ้น',
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      quickPick,
      image: editingProduct?.image,
    };

    onSaveProduct(prod);
    setIsAddModalOpen(false);
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem) return;
    const qty = parseInt(restockQty) || 0;
    if (qty > 0) {
      onRestockProduct(restockModalItem.id, qty);
    }
    setRestockModalItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Import Success Banner */}
      {importNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{importNotice}</span>
          </div>
          <button
            onClick={() => setImportNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-stone-900">จัดการคลังสินค้า & สต็อก</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            ตรวจนับสต็อก ตั้งราคาขาย-ราคาทุน และนำเข้า/ส่งออกไฟล์ Excel/CSV
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Import Button */}
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            title="นำเข้าสินค้าจากไฟล์ .CSV หรือ Excel"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>นำเข้าไฟล์ .CSV</span>
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="ดาวน์โหลดรายการสต็อกสินค้าเป็นไฟล์ .CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก .CSV</span>
          </button>

          <button
            onClick={onResetSampleData}
            title="รีเซ็ตสินค้าตัวอย่าง"
            className="flex items-center gap-1.5 px-3 py-2 text-stone-500 hover:text-stone-800 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า หรือบาร์โค้ด..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden"
          >
            <option value="ทั้งหมด">ทุกหมวดหมู่ ({products.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100/75 border-b border-stone-200 text-stone-600 font-semibold">
                <th className="py-3 px-4">บาร์โค้ด</th>
                <th className="py-3 px-4">ชื่อสินค้า</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4 text-right">ทุน</th>
                <th className="py-3 px-4 text-right">ราคาขาย</th>
                <th className="py-3 px-4 text-right">คงเหลือ</th>
                <th className="py-3 px-4 text-center">สถานะสต็อก</th>
                <th className="py-3 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock <= p.lowStockThreshold && p.stock > 0;

                return (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-stone-400" />
                        <span>{p.barcode}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-stone-900">
                      <div className="flex items-center gap-2">
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded object-cover border border-stone-200 shrink-0"
                          />
                        )}
                        <span className="truncate max-w-[200px]">{p.name}</span>
                        {p.quickPick && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                            ขายดี
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-stone-600">{p.category}</td>

                    <td className="py-3 px-4 text-right font-mono text-stone-500 tabular-nums">
                      ฿{p.costPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 tabular-nums">
                      ฿{p.sellPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      <span className={isOutOfStock ? 'text-rose-600' : 'text-stone-900'}>
                        {p.stock} {p.unit}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isOutOfStock ? (
                        <span className="text-rose-700 font-semibold text-[11px]">
                          สินค้าหมด
                        </span>
                      ) : isLowStock ? (
                        <span className="text-amber-700 font-semibold text-[11px] flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>ใกล้หมด (≤{p.lowStockThreshold})</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium text-[11px]">
                          พร้อมขาย
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setRestockModalItem(p);
                            setRestockQty('12');
                          }}
                          title="เติมสต็อกสินค้า"
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>เติมของ</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="แก้ไขสินค้า"
                          className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`ต้องการลบสินค้า "${p.name}" หรือไม่?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          title="ลบสินค้า"
                          className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  ชื่อสินค้า: *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น มาม่ารสต้มยำกุ้ง, น้ำดื่มคริสตัล"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    รหัสบาร์โค้ด:
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="885..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    หมวดหมู่:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    ราคาทุน (บาท):
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    ราคาขายหน้าร้าน (บาท): *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    จำนวนในสต็อก:
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    หน่วยนับ:
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="ชิ้น, ซอง, ขวด"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    เตือนใกล้หมด:
                  </label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="quickPick"
                  checked={quickPick}
                  onChange={(e) => setQuickPick(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="quickPick" className="text-stone-700 font-medium cursor-pointer">
                  แสดงในปุ่มลัดขายด่วน (Quick Picks หน้าร้าน)
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-stone-200">
            <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">เติมสต็อกสินค้า (Stock In)</h3>
              <button
                onClick={() => setRestockModalItem(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="p-5 space-y-4 text-xs">
              <div>
                <p className="text-stone-500">สินค้า:</p>
                <p className="font-bold text-sm text-stone-900">{restockModalItem.name}</p>
                <p className="text-stone-600 font-mono mt-0.5">
                  คงเหลือปัจจุบัน: {restockModalItem.stock} {restockModalItem.unit}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  จำนวนที่นำเข้าเพิ่ม ({restockModalItem.unit}):
                </label>
                <input
                  type="number"
                  autoFocus
                  required
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-3 py-2 text-base font-bold font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />

                <div className="flex gap-2 mt-2">
                  {[6, 12, 24, 48].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setRestockQty(q.toString())}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-mono font-medium cursor-pointer"
                    >
                      +{q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="flex-1 py-2 font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  ยืนยันเติมของ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        existingProducts={products}
        onConfirmImport={handleImportConfirm}
      />
    </div>
  );
};
