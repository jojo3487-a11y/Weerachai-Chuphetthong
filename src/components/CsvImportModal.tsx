import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { Product } from '../types';
import { 
  parseCSVToProducts, 
  getSampleCSVContent, 
  downloadFile 
} from '../utils/csvHelper';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: Product[];
  onConfirmImport: (products: Product[], mode: 'merge' | 'replace' | 'skip_existing') => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  existingProducts,
  onConfirmImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [importMode, setImportMode] = useState<'merge' | 'skip_existing' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const existingBarcodeMap = new Set(existingProducts.map(p => p.barcode));

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv') && selectedFile.type !== 'text/csv') {
      alert('กรุณาเลือกไฟล์นามสกุล .csv เท่านั้น');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = parseCSVToProducts(text);
        setParsedProducts(result.products);
        setErrors(result.errors);
        setTotalRows(result.totalRows);
      } catch {
        setErrors(['เกิดข้อผิดพลาดในการอ่านไฟล์ CSV กรุณาตรวจสอบรูปแบบ']);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrors(['ไม่สามารถอ่านไฟล์ได้']);
      setIsProcessing(false);
    };

    reader.readAsText(selectedFile, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const sampleCsv = getSampleCSVContent();
    downloadFile(sampleCsv, 'ตัวอย่างนำเข้าสินค้า_ร้านขายของชำ.csv');
  };

  const handleConfirm = () => {
    if (parsedProducts.length === 0) return;
    onConfirmImport(parsedProducts, importMode);
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setParsedProducts([]);
    setErrors([]);
    setTotalRows(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const duplicateCount = parsedProducts.filter(p => existingBarcodeMap.has(p.barcode)).length;
  const newCount = parsedProducts.length - duplicateCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-stone-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">นำเข้าข้อมูลสต็อกสินค้า (.CSV)</h3>
              <p className="text-xs text-stone-400">
                เพิ่มสินค้าจำนวนมากจากโปรแกรม Excel, Google Sheets หรือเครื่องคิดเงินเดิม
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Info & Sample Template Download Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                รองรับไฟล์ CSV ภาษาไทย (UTF-8) โดยมีหัวตาราง: <strong>บาร์โค้ด, ชื่อสินค้า, หมวดหมู่, ราคาทุน, ราคาขาย, สต็อก, หน่วย</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 border border-amber-300 text-amber-900 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดไฟล์ตัวอย่าง .csv</span>
            </button>
          </div>

          {/* Upload Area */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-stone-300 hover:border-amber-400 hover:bg-stone-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              <Upload className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-800">
                ลากไฟล์ .csv มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
              </p>
              <p className="text-xs text-stone-400 mt-1">
                ไฟล์ขนาดไม่เกิน 10MB (.csv)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File details bar */}
              <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-stone-900 truncate">{file.name}</p>
                    <p className="text-[11px] text-stone-500 font-mono">
                      {(file.size / 1024).toFixed(1)} KB · พบ {parsedProducts.length} รายการจาก {totalRows} แถว
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>เปลี่ยนไฟล์</span>
                </button>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                  <span className="text-stone-500 block text-[11px]">รายการที่พร้อมนำเข้า</span>
                  <span className="font-mono font-bold text-lg">{parsedProducts.length} รายการ</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                  <span className="text-stone-500 block text-[11px]">สินค้าใหม่</span>
                  <span className="font-mono font-bold text-lg">{newCount} รายการ</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <span className="text-stone-500 block text-[11px]">ตรงกับบาร์โค้ดเดิม</span>
                  <span className="font-mono font-bold text-lg">{duplicateCount} รายการ</span>
                </div>
              </div>

              {/* Import Mode Radio selection */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-stone-700 block">
                  ตัวเลือกการจัดการรายการซ้ำ (Import Strategy):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>
                      <strong className="block text-stone-800">อัปเดตและเพิ่มใหม่</strong>
                      <span className="text-[10px] text-stone-500">อัปเดตราคา/สต็อกทับของเดิม</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="importMode"
                      value="skip_existing"
                      checked={importMode === 'skip_existing'}
                      onChange={() => setImportMode('skip_existing')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>
                      <strong className="block text-stone-800">ข้ามรายการเดิม</strong>
                      <span className="text-[10px] text-stone-500">เพิ่มเฉพาะสินค้าที่ยังไม่มี</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-500 focus:ring-rose-500"
                    />
                    <span>
                      <strong className="block text-rose-700">แทนที่สต็อกทั้งหมด</strong>
                      <span className="text-[10px] text-stone-500">ล้างสต็อกเดิมแล้วใส่ชุดนี้</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                  <span>ตัวอย่างข้อมูลที่จะนำเข้า (แสดง {Math.min(parsedProducts.length, 6)} รายการแรก)</span>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-stone-100 text-stone-600 sticky top-0 border-b border-stone-200">
                      <tr>
                        <th className="py-2 px-3">สถานะ</th>
                        <th className="py-2 px-3">บาร์โค้ด</th>
                        <th className="py-2 px-3">ชื่อสินค้า</th>
                        <th className="py-2 px-3">หมวดหมู่</th>
                        <th className="py-2 px-3 text-right">ทุน</th>
                        <th className="py-2 px-3 text-right">ราคาขาย</th>
                        <th className="py-2 px-3 text-right">คงเหลือ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {parsedProducts.slice(0, 10).map((p, idx) => {
                        const isExisting = existingBarcodeMap.has(p.barcode);
                        return (
                          <tr key={idx} className="hover:bg-stone-50">
                            <td className="py-1.5 px-3">
                              {isExisting ? (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                  อัปเดตเดิม
                                </span>
                              ) : (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                  สินค้าใหม่
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-stone-500">{p.barcode}</td>
                            <td className="py-1.5 px-3 font-medium text-stone-900 truncate max-w-[150px]">{p.name}</td>
                            <td className="py-1.5 px-3 text-stone-500">{p.category}</td>
                            <td className="py-1.5 px-3 text-right font-mono tabular-nums">฿{p.costPrice.toFixed(2)}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-stone-900 tabular-nums">฿{p.sellPrice.toFixed(2)}</td>
                            <td className="py-1.5 px-3 text-right font-mono tabular-nums">{p.stock} {p.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Errors notice if any */}
              {errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>แจ้งเตือนข้อผิดพลาดบางรายการ:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-700 max-h-24 overflow-y-auto">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={parsedProducts.length === 0 || isProcessing}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              ยืนยันนำเข้า {parsedProducts.length} รายการ
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
