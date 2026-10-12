import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  initGoogleAuth, 
  signInWithGoogleDrive, 
  signOutGoogle, 
  getGoogleAccessToken 
} from '../services/googleAuth';
import { 
  findDatabaseFile, 
  loadDatabaseFromDrive, 
  saveDatabaseToDrive, 
  DriveFileInfo, 
  StoreDatabasePayload 
} from '../services/googleDriveService';
import { Product, SaleRecord, CustomerDebt, HeldSale, StoreSettings } from '../types';

export type SyncStatus = 'disconnected' | 'idle' | 'syncing' | 'synced' | 'error';

interface UseGoogleDriveSyncProps {
  products: Product[];
  sales: SaleRecord[];
  debts: CustomerDebt[];
  heldSales: HeldSale[];
  settings: StoreSettings;
  onApplyRemoteDatabase: (data: StoreDatabasePayload) => void;
}

export function useGoogleDriveSync({
  products,
  sales,
  debts,
  heldSales,
  settings,
  onApplyRemoteDatabase,
}: UseGoogleDriveSyncProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disconnected');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<DriveFileInfo | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Prevent initial load from triggering immediate upload before checking drive
  const isInitializedRef = useRef(false);
  const fileIdRef = useRef<string | undefined>(undefined);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        setSyncStatus('idle');
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setSyncStatus('disconnected');
        setFileInfo(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When accessToken becomes available, search for existing file on Drive
  const checkDriveFile = useCallback(async (token: string) => {
    try {
      setSyncStatus('syncing');
      const found = await findDatabaseFile(token);
      if (found) {
        setFileInfo(found);
        fileIdRef.current = found.id;
        // Optionally load existing data if local store is default
        const remoteData = await loadDatabaseFromDrive(token, found.id);
        if (remoteData) {
          onApplyRemoteDatabase(remoteData);
          setLastSyncedAt(new Date(found.modifiedTime || Date.now()));
          setSyncStatus('synced');
        }
      } else {
        // Create initial file
        const initialPayload: StoreDatabasePayload = {
          version: 1,
          updatedAt: new Date().toISOString(),
          storeName: settings.storeName,
          products,
          sales,
          debts,
          heldSales,
          settings,
        };
        const created = await saveDatabaseToDrive(token, initialPayload);
        setFileInfo({
          id: created.fileId,
          name: 'pasri_grocery_pos_database.json',
          modifiedTime: created.modifiedTime,
          webViewLink: created.webViewLink,
        });
        fileIdRef.current = created.fileId;
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      }
      isInitializedRef.current = true;
    } catch (err: unknown) {
      console.error('Check Drive file error:', err);
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ Drive');
    }
  }, [products, sales, debts, heldSales, settings, onApplyRemoteDatabase]);

  useEffect(() => {
    if (accessToken && !isInitializedRef.current) {
      checkDriveFile(accessToken);
    }
  }, [accessToken, checkDriveFile]);

  // Real-time continuous Auto-Sync engine
  useEffect(() => {
    if (!accessToken || !autoSyncEnabled || !isInitializedRef.current) return;

    // Debounce 2.5 seconds after changes to update continuously
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        setSyncError(null);

        const currentToken = (await getGoogleAccessToken()) || accessToken;
        const payload: StoreDatabasePayload = {
          version: 1,
          updatedAt: new Date().toISOString(),
          syncedBy: user?.displayName || user?.email || 'แคชเชียร์',
          storeName: settings.storeName,
          products,
          sales,
          debts,
          heldSales,
          settings,
        };

        const result = await saveDatabaseToDrive(currentToken, payload, fileIdRef.current);
        fileIdRef.current = result.fileId;
        setFileInfo(prev => prev ? { ...prev, modifiedTime: result.modifiedTime, webViewLink: result.webViewLink || prev.webViewLink } : {
          id: result.fileId,
          name: 'pasri_grocery_pos_database.json',
          modifiedTime: result.modifiedTime,
          webViewLink: result.webViewLink,
        });
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
      } catch (err: unknown) {
        console.error('Auto-sync error:', err);
        setSyncStatus('error');
        setSyncError(err instanceof Error ? err.message : 'การซิงค์ข้อมูลขัดข้อง');
      }
    }, 2500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [products, sales, debts, heldSales, settings, accessToken, autoSyncEnabled, user]);

  // Manual Push to Drive
  const syncToDriveNow = async () => {
    const token = (await getGoogleAccessToken()) || accessToken;
    if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google Drive ก่อน');

    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const payload: StoreDatabasePayload = {
        version: 1,
        updatedAt: new Date().toISOString(),
        syncedBy: user?.displayName || user?.email || 'แคชเชียร์',
        storeName: settings.storeName,
        products,
        sales,
        debts,
        heldSales,
        settings,
      };

      const result = await saveDatabaseToDrive(token, payload, fileIdRef.current);
      fileIdRef.current = result.fileId;
      setFileInfo(prev => prev ? { ...prev, modifiedTime: result.modifiedTime, webViewLink: result.webViewLink || prev.webViewLink } : {
        id: result.fileId,
        name: 'pasri_grocery_pos_database.json',
        modifiedTime: result.modifiedTime,
        webViewLink: result.webViewLink,
      });
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
      return true;
    } catch (err: unknown) {
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'การอัปโหลดข้อมูลขัดข้อง');
      throw err;
    }
  };

  // Manual Pull from Drive
  const pullFromDriveNow = async () => {
    const token = (await getGoogleAccessToken()) || accessToken;
    if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google Drive ก่อน');

    setSyncStatus('syncing');
    setSyncError(null);
    try {
      let targetFileId = fileIdRef.current;
      if (!targetFileId) {
        const found = await findDatabaseFile(token);
        if (!found) throw new Error('ไม่พบไฟล์ฐานข้อมูลบน Google Drive');
        targetFileId = found.id;
        fileIdRef.current = found.id;
        setFileInfo(found);
      }

      const remoteData = await loadDatabaseFromDrive(token, targetFileId);
      if (!remoteData) throw new Error('ไฟล์ฐานข้อมูลว่างเปล่า');

      onApplyRemoteDatabase(remoteData);
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
      return remoteData;
    } catch (err: unknown) {
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'การดึงข้อมูลขัดข้อง');
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setSyncError(null);
      const res = await signInWithGoogleDrive();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        await checkDriveFile(res.accessToken);
      }
    } catch (err: unknown) {
      console.error(err);
      setSyncError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
      throw err;
    }
  };

  const logoutGoogle = async () => {
    await signOutGoogle();
    setUser(null);
    setAccessToken(null);
    setFileInfo(null);
    fileIdRef.current = undefined;
    isInitializedRef.current = false;
    setSyncStatus('disconnected');
    setLastSyncedAt(null);
  };

  return {
    user,
    isAuthenticated: !!user && !!accessToken,
    syncStatus,
    lastSyncedAt,
    syncError,
    fileInfo,
    autoSyncEnabled,
    setAutoSyncEnabled,
    loginWithGoogle,
    logoutGoogle,
    syncToDriveNow,
    pullFromDriveNow,
  };
}
