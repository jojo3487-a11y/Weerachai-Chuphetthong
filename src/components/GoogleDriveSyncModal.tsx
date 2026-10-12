import React, { useState } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  ExternalLink, 
  LogOut, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  Database,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SyncStatus } from '../hooks/useGoogleDriveSync';
import { DriveFileInfo } from '../services/googleDriveService';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isAuthenticated: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  syncError: string | null;
  fileInfo: DriveFileInfo | null;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onSyncNow: () => Promise<boolean>;
  onPullNow: () => Promise<unknown>;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  isAuthenticated,
  syncStatus,
  lastSyncedAt,
  syncError,
  fileInfo,
  autoSyncEnabled,
  onToggleAutoSync,
  onLogin,
  onLogout,
  onSyncNow,
  onPullNow,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [isPullingManual, setIsPullingManual] = useState(false);
  const [showPullConfirm, setShowPullConfirm] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginClick = async () => {
    setIsLoggingIn(true);
    setActionSuccessMsg(null);
    try {
      await onLogin();
      setActionSuccessMsg('เชื่อมต่อ Google Drive สำเร็จ');
    } catch {
      // Error handled in hook state
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutClick = async () => {
    setActionSuccessMsg(null);
    await onLogout();
  };

  const handleManualSync = async () => {
    setIsSyncingManual(true);
    setActionSuccessMsg(null);
    try {
      await onSyncNow();
      setActionSuccessMsg('อัปโหลดและบันทึกฐานข้อมูลลง Google Drive สำเร็จ');
    } catch {
      // Error in hook
    } finally {
      setIsSyncingManual(false);
    }
  };

  const handleConfirmPull = async () => {
    setShowPullConfirm(false);
    setIsPullingManual(true);
    setActionSuccessMsg(null);
    try {
      await onPullNow();
      setActionSuccessMsg('ดึงข้อมูลล่าสุดจาก Google Drive มายังเครื่องนี้เรียบร้อยแล้ว');
    } catch {
      // Error in hook
    } finally {
      setIsPullingManual(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'ยังไม่มีประวัติการซิงค์';
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' (' + date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ')';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Cloud className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">เชื่อมต่อฐานข้อมูล Google Drive</h3>
              <p className="text-[11px] text-stone-400">อัปเดตและสำรองข้อมูลร้านค้าอัตโนมัติตลอดเวลา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-stone-800 text-sm">
          {/* Success Banner */}
          {actionSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {syncError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">เกิดข้อผิดพลาดในการเชื่อมต่อ:</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{syncError}</p>
              </div>
            </div>
          )}

          {!isAuthenticated ? (
            /* Disconnected State */
            <div className="space-y-4 py-2 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
                <CloudUpload className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="font-bold text-stone-900 text-base">เชื่อมโยงร้านค้ากับบัญชี Google Drive ของคุณ</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  เมื่อเปิดการเชื่อมต่อ ระบบจะสร้างไฟล์ฐานข้อมูล <code className="px-1.5 py-0.5 bg-stone-100 rounded text-amber-800 font-mono text-[11px]">pasri_grocery_pos_database.json</code> บน Google Drive ของคุณ และซิงค์อัปเดตข้อมูลสินค้า ยอดขาย และสมุดแปะโป้งให้อยู่ตลอดเวลา
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoginClick}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 font-medium text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  )}
                  <span>{isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'ลงชื่อเข้าใช้ด้วย Google (Sign in with Google)'}</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>ปลอดภัย เชื่อมต่อเฉพาะไฟล์ฐานข้อมูลของแอปบน Drive ของคุณเท่านั้น</span>
              </div>
            </div>
          ) : (
            /* Connected State */
            <div className="space-y-4">
              {/* Connected User Profile Card */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-10 h-10 rounded-full border border-stone-300 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-stone-900 font-bold flex items-center justify-center shrink-0">
                      {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900 text-sm truncate">
                        {user?.displayName || 'ผู้ใช้งาน Google'}
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        เชื่อมต่อแล้ว
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  title="ตัดการเชื่อมต่อบัญชี Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ตัดการเชื่อมต่อ</span>
                </button>
              </div>

              {/* Real-time Auto-Sync Status Card */}
              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      {syncStatus === 'syncing' ? (
                        <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
                      ) : syncStatus === 'synced' ? (
                        <CloudCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Cloud className="w-4 h-4 text-stone-500" />
                      )}
                    </div>
                    <span className="font-semibold text-xs text-stone-900">
                      {syncStatus === 'syncing'
                        ? 'กำลังอัปเดตข้อมูลขึ้น Google Drive...'
                        : syncStatus === 'synced'
                        ? 'ข้อมูลล่าสุดตรงกับ Google Drive แล้ว'
                        : 'พร้อมซิงค์ข้อมูล'}
                    </span>
                  </div>

                  <span className="text-[11px] text-stone-500 font-mono">
                    {formatLastSync(lastSyncedAt)}
                  </span>
                </div>

                {/* Auto-Sync Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-xs">
                  <div>
                    <span className="font-medium text-stone-800">อัปเดตอัตโนมัติตลอดเวลา (Auto-Sync)</span>
                    <p className="text-[11px] text-stone-500">
                      บันทึกการขาย สต็อก หรือแปะโป้งขึ้น Google Drive ทันทีที่มีการเปลี่ยนแปลง
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={autoSyncEnabled}
                      onChange={(e) => onToggleAutoSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              {/* Database File Info on Drive */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-700">
                    <Database className="w-3.5 h-3.5 text-stone-500" />
                    <span className="font-medium">ไฟล์ฐานข้อมูลบน Google Drive:</span>
                  </div>
                  {fileInfo?.webViewLink && (
                    <a
                      href={fileInfo.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>เปิดดูใน Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="font-mono text-[11px] text-stone-600 bg-white p-2 rounded-lg border border-stone-200 flex items-center justify-between">
                  <span>{fileInfo?.name || 'pasri_grocery_pos_database.json'}</span>
                  {fileInfo?.id && (
                    <span className="text-[10px] text-stone-400">ID: {fileInfo.id.slice(0, 8)}...</span>
                  )}
                </div>
              </div>

              {/* Manual Operations */}
              <div className="pt-2 space-y-2">
                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  คำสั่งซิงค์ด้วยตนเอง
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncingManual || syncStatus === 'syncing'}
                    className="p-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>{isSyncingManual ? 'กำลังบันทึก...' : 'บันทึกขึ้น Drive เดี๋ยวนี้'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPullConfirm(true)}
                    disabled={isPullingManual || syncStatus === 'syncing'}
                    className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border border-stone-300"
                  >
                    <CloudDownload className="w-3.5 h-3.5" />
                    <span>{isPullingManual ? 'กำลังดึง...' : 'ดึงข้อมูลล่าสุดจาก Drive'}</span>
                  </button>
                </div>
              </div>

              {/* Pull Confirmation Dialog (Destructive Operation protection) */}
              {showPullConfirm && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>ยืนยันการดึงข้อมูลจาก Google Drive หรือไม่?</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    การดึงข้อมูลจะนำข้อมูลสินค้า, ยอดขาย, และสมุดแปะโป้งจาก Google Drive มาเขียนทับข้อมูลในเครื่องนี้ เหมาะสำหรับกรณีที่คุณเปิดใช้งานจากอุปกรณ์เครื่องใหม่
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPullConfirm(false)}
                      className="px-3 py-1 bg-white border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 cursor-pointer font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPull}
                      className="px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer font-medium"
                    >
                      ยืนยันการดึงข้อมูล
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-stone-400" />
            <span>ทำงานควบคู่กับระบบสำรองข้อมูลออฟไลน์ในเครื่อง</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium rounded-lg transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
