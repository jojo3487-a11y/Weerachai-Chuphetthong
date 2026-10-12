import { Product, SaleRecord, CustomerDebt, HeldSale, StoreSettings } from '../types';

export const DRIVE_DATABASE_FILENAME = 'pasri_grocery_pos_database.json';

export interface StoreDatabasePayload {
  version: number;
  updatedAt: string;
  syncedBy?: string;
  storeName?: string;
  products: Product[];
  sales: SaleRecord[];
  debts: CustomerDebt[];
  heldSales: HeldSale[];
  settings: StoreSettings;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
}

/**
 * Search for the store database JSON file on the user's Google Drive
 */
export async function findDatabaseFile(accessToken: string): Promise<DriveFileInfo | null> {
  const query = encodeURIComponent(`name = '${DRIVE_DATABASE_FILENAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&pageSize=1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }
    const errText = await res.text();
    throw new Error(`ค้นหาไฟล์บน Google Drive ไม่สำเร็จ: ${errText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

/**
 * Load database contents from Google Drive file
 */
export async function loadDatabaseFromDrive(
  accessToken: string,
  fileId: string
): Promise<StoreDatabasePayload | null> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }
    const errText = await res.text();
    throw new Error(`อ่านข้อมูลจาก Google Drive ไม่สำเร็จ: ${errText}`);
  }

  const json = await res.json();
  return json as StoreDatabasePayload;
}

/**
 * Save / Update database to Google Drive (creates new file if not existing, or updates existing)
 */
export async function saveDatabaseToDrive(
  accessToken: string,
  payload: StoreDatabasePayload,
  existingFileId?: string
): Promise<{ fileId: string; modifiedTime: string; webViewLink?: string }> {
  const jsonContent = JSON.stringify(payload, null, 2);

  if (existingFileId) {
    // Update existing file content
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
    const res = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('AUTH_EXPIRED');
      }
      const errText = await res.text();
      throw new Error(`อัปเดตไฟล์บน Google Drive ไม่สำเร็จ: ${errText}`);
    }

    const updated = await res.json();
    return {
      fileId: updated.id,
      modifiedTime: updated.modifiedTime || new Date().toISOString(),
      webViewLink: updated.webViewLink,
    };
  } else {
    // Create new file with multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: DRIVE_DATABASE_FILENAME,
      mimeType: 'application/json',
      description: 'ฐานข้อมูลระบบขายของชำร้านป้าศรี POS (อัปเดตอัตโนมัติ)',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('AUTH_EXPIRED');
      }
      const errText = await res.text();
      throw new Error(`สร้างไฟล์บน Google Drive ไม่สำเร็จ: ${errText}`);
    }

    const created = await res.json();
    return {
      fileId: created.id,
      modifiedTime: created.modifiedTime || new Date().toISOString(),
      webViewLink: created.webViewLink,
    };
  }
}
