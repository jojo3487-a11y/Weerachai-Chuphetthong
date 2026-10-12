import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  UserPlus, 
  Banknote, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle, 
  X,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Download,
  CheckCircle2
} from 'lucide-react';
import { CustomerDebt, StoreSettings } from '../types';
import { exportDebtLedgerToExcel, exportSingleCustomerDebtToExcel } from '../utils/excelHelper';

interface DebtLedgerViewProps {
  debts: CustomerDebt[];
  totalOutstandingDebt: number;
  settings: StoreSettings;
  onRepayDebt: (customerId: string, amount: number, note: string) => void;
  onSaveCustomer: (customer: Partial<CustomerDebt> & { name: string }) => void;
}

export const DebtLedgerView: React.FC<DebtLedgerViewProps> = ({
  debts,
  totalOutstandingDebt,
  settings,
  onRepayDebt,
  onSaveCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(null);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // Repay state
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayNote, setRepayNote] = useState<string>('');

  // New customer state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressOrNote, setAddressOrNote] = useState('');

  const filteredDebts = debts.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search) ||
      d.addressOrNote.toLowerCase().includes(search.toLowerCase())
  );

  const activeSelected = debts.find((d) => d.id === selectedCustomer?.id) || selectedCustomer;

  const handleOpenRepay = (customer: CustomerDebt) => {
    setSelectedCustomer(customer);
    setRepayAmount(customer.totalDebt.toString());
    setRepayNote('ชำระหนี้หน้าร้าน');
    setIsRepayModalOpen(true);
  };

  const handleConfirmRepay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelected) return;
    const amount = parseFloat(repayAmount) || 0;
    if (amount <= 0) return;

    onRepayDebt(activeSelected.id, amount, repayNote);
    setIsRepayModalOpen(false);
    setRepayAmount('');
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveCustomer({
      name: name.trim(),
      phone: phone.trim(),
      addressOrNote: addressOrNote.trim(),
    });
    setIsNewCustomerModalOpen(false);
    setName('');
    setPhone('');
    setAddressOrNote('');
  };

  const handleExportAllExcel = () => {
    try {
      exportDebtLedgerToExcel(debts, settings);
      setExportNotice(`ดาวน์โหลดรายงานสมุดแปะโป้งเป็นไฟล์ Excel (.xlsx) สำเร็จ (${debts.length} รายชื่อ)`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
    }
  };

  const handleExportSingleExcel = (customer: CustomerDebt) => {
    try {
      exportSingleCustomerDebtToExcel(customer, settings);
      setExportNotice(`ดาวน์โหลดสเตทเมนต์ Excel (.xlsx) ของคุณ "${customer.name}" สำเร็จ`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Success Notification Banner */}
      {exportNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & KPI */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-stone-900">สมุดจดแปะโป้ง (ลูกหนี้ร้านชำ)</h2>
          </div>
          <p className="text-xs text-stone-500">
            ระบบจดบัญชีเชื่อสินค้าชุมชน บันทึกรายการที่หยิบไป ตัดยอดเมื่อคืนเงิน และออกรายงาน Excel ได้
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right pr-2">
            <span className="text-xs text-stone-400">ยอดหนี้ค้างรวมทั้งหมู่บ้าน</span>
            <div className="text-2xl font-black text-rose-600 font-mono tabular-nums">
              ฿{totalOutstandingDebt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleExportAllExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            title="ออกรายงานสรุปยอดลูกหนี้และประวัติรายการทั้งหมดเป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ออกรายงาน Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>เปิดหน้าสมุดใหม่</span>
          </button>
        </div>
      </div>

      {/* Main split: Customer list left, History/Detail right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer list */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, หรือจุดสังเกต..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Cards */}
          <div className="space-y-2.5">
            {filteredDebts.map((customer) => {
              const isSelected = activeSelected?.id === customer.id;
              return (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/60 border-amber-400 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <h4 className="text-sm font-bold text-stone-900 truncate">
                        {customer.name}
                      </h4>
                      {customer.phone && (
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{customer.phone}</span>
                        </p>
                      )}
                      {customer.addressOrNote && (
                        <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">
                          {customer.addressOrNote}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-stone-400">ค้างชำระ</div>
                      <div className="text-base font-extrabold text-stone-900 font-mono tabular-nums">
                        ฿{customer.totalDebt.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      อัปเดต: {new Date(customer.updatedAt).toLocaleDateString('th-TH')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRepay(customer);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      รับชำระเงิน
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredDebts.length === 0 && (
              <div className="bg-white p-8 text-center rounded-2xl border border-stone-200 text-stone-400 text-xs">
                ไม่พบรายชื่อลูกหนี้
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Transaction Timeline of Selected Customer */}
        <div className="lg:col-span-7">
          {activeSelected ? (
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-stone-200 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    {activeSelected.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                    {activeSelected.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {activeSelected.phone}
                      </span>
                    )}
                    {activeSelected.addressOrNote && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {activeSelected.addressOrNote}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-right pr-1">
                    <div className="text-xs text-stone-400">ยอดค้างปัจจุบัน</div>
                    <div className="text-2xl font-black text-rose-600 font-mono tabular-nums">
                      ฿{activeSelected.totalDebt.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleExportSingleExcel(activeSelected)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl border border-stone-200 transition-colors cursor-pointer"
                    title="ดาวน์โหลดสเตทเมนต์ประวัติของลูกค้ารายนี้เป็นไฟล์ Excel (.xlsx)"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>สเตทเมนต์ Excel</span>
                  </button>

                  <button
                    onClick={() => handleOpenRepay(activeSelected)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    รับชำระเงินคืน
                  </button>
                </div>
              </div>

              {/* Transactions History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  ประวัติการแปะและการจ่ายคืน ({activeSelected.transactions.length} รายการ)
                </h4>

                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {activeSelected.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl border border-stone-100 bg-stone-50/50 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg mt-0.5 ${
                            tx.type === 'borrow'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tx.type === 'borrow' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">
                            {tx.type === 'borrow' ? 'หยิบของเชื่อ (แปะโป้ง)' : 'นำเงินมาจ่ายคืน'}
                          </p>
                          <p className="text-stone-600 mt-0.5">{tx.note}</p>
                          <p className="text-stone-400 text-[11px] mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(tx.date).toLocaleString('th-TH')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold text-sm tabular-nums ${
                            tx.type === 'borrow' ? 'text-amber-800' : 'text-emerald-700'
                          }`}
                        >
                          {tx.type === 'borrow' ? '+' : '-'}฿{tx.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {activeSelected.transactions.length === 0 && (
                    <p className="text-xs text-stone-400 text-center py-6">
                      ยังไม่มีประวัติรายการ
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 space-y-2">
              <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="text-sm font-semibold text-stone-700">
                เลือกรายชื่อลูกค้าทางซ้ายเพื่อดูรายละเอียด
              </h4>
              <p className="text-xs text-stone-400">
                แสดงประวัติการแปะของ ยอดหนี้ และรายการจ่ายคืนทั้งหมด
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Repay Modal */}
      {isRepayModalOpen && activeSelected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-stone-200">
            <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm">รับชำระหนี้จากลูกค้า</h3>
              </div>
              <button
                onClick={() => setIsRepayModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRepay} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-stone-500">ลูกค้า:</p>
                <p className="font-bold text-sm text-stone-900">{activeSelected.name}</p>
                <p className="text-xs text-rose-600 font-mono mt-0.5">
                  ยอดค้างชำระ: ฿{activeSelected.totalDebt.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  จำนวนเงินที่รับคืนมา (บาท):
                </label>
                <input
                  type="number"
                  autoFocus
                  required
                  min="1"
                  max={activeSelected.totalDebt}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-lg font-bold font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setRepayAmount(activeSelected.totalDebt.toString())}
                    className="px-2.5 py-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold cursor-pointer"
                  >
                    จ่ายหมด (฿{activeSelected.totalDebt.toLocaleString()})
                  </button>
                  {activeSelected.totalDebt > 100 && (
                    <button
                      type="button"
                      onClick={() => setRepayAmount('100')}
                      className="px-2.5 py-1 text-[11px] bg-stone-100 text-stone-700 rounded font-semibold cursor-pointer"
                    >
                      จ่าย 100 บ.
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  หมายเหตุ / รายละเอียด:
                </label>
                <input
                  type="text"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  placeholder="เช่น จ่ายสดหน้าร้าน, โอนเข้าพร้อมเพย์"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  บันทึกรับเงิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Debtor Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-stone-200">
            <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">เพิ่มหน้าสมุดลูกค้าใหม่</h3>
              <button
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ชื่อลูกค้า (เช่น ป้าจันทร์, ลุงพรชัย): *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อ หรือ ฉายาที่เรียกในหมู่บ้าน"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  เบอร์โทรศัพท์:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  ที่อยู่ / จุดสังเกตบ้าน / ข้อความเตือน:
                </label>
                <textarea
                  rows={2}
                  value={addressOrNote}
                  onChange={(e) => setAddressOrNote(e.target.value)}
                  placeholder="เช่น บ้านสองชั้นหลังวัด, นัดจ่ายทุกวันศุกร์"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  บันทึกลงสมุด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
