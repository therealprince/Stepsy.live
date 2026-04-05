// Google Drive service — CRUD for appDataFolder JSON files + photo uploads
import { DRIVE_FILES, STEPSY_PHOTOS_FOLDER, DEFAULT_SETTINGS } from '../config/google';
import { getAccessToken } from './auth';
import type { StepsData, TripsData, AppSettings } from '../types';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

// ---- Find or Create Files ----

async function findFileInAppData(name: string): Promise<string | null> {
  const resp = await fetch(
    `${DRIVE_API}/files?spaces=appDataFolder&q=name='${name}'&fields=files(id,name)`,
    { headers: authHeaders() }
  );
  const data = await resp.json();
  return data.files?.[0]?.id || null;
}

async function createFileInAppData(name: string, content: object): Promise<string> {
  const metadata = { name, parents: ['appDataFolder'] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));

  const resp = await fetch(`${UPLOAD_API}/files?uploadType=multipart`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  const result = await resp.json();
  return result.id;
}

async function updateFile(fileId: string, content: object): Promise<void> {
  await fetch(`${UPLOAD_API}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  });
}

async function readFile<T>(fileId: string): Promise<T> {
  const resp = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: authHeaders(),
  });
  return resp.json();
}

// ---- High-Level API ----

async function getOrCreateFile<T extends object>(name: string, defaultContent: T): Promise<{ id: string; data: T }> {
  let fileId = await findFileInAppData(name);
  if (!fileId) {
    fileId = await createFileInAppData(name, defaultContent);
    return { id: fileId, data: defaultContent };
  }
  const data = await readFile<T>(fileId);
  return { id: fileId, data };
}

// Steps
export async function readSteps(): Promise<{ id: string; data: StepsData }> {
  return getOrCreateFile<StepsData>(DRIVE_FILES.STEPS, { version: 1, records: [] });
}

export async function writeSteps(fileId: string, data: StepsData): Promise<void> {
  await updateFile(fileId, data);
}

// Routes / Trips
export async function readTrips(): Promise<{ id: string; data: TripsData }> {
  return getOrCreateFile<TripsData>(DRIVE_FILES.ROUTES, { version: 1, trips: [] });
}

export async function writeTrips(fileId: string, data: TripsData): Promise<void> {
  await updateFile(fileId, data);
}

// Settings
export async function readSettings(): Promise<{ id: string; data: AppSettings }> {
  return getOrCreateFile<AppSettings>(DRIVE_FILES.SETTINGS, { ...DEFAULT_SETTINGS } as AppSettings);
}

export async function writeSettings(fileId: string, data: AppSettings): Promise<void> {
  await updateFile(fileId, data);
}

// ---- Photos Folder ----

async function findOrCreateFolder(name: string): Promise<string> {
  // Check if folder exists
  const resp = await fetch(
    `${DRIVE_API}/files?q=name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    { headers: authHeaders() }
  );
  const data = await resp.json();
  if (data.files?.[0]?.id) return data.files[0].id;

  // Create folder
  const createResp = await fetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const folder = await createResp.json();
  return folder.id;
}

export async function uploadPhoto(file: File, tripId: string): Promise<{ id: string; url: string }> {
  const folderId = await findOrCreateFolder(STEPSY_PHOTOS_FOLDER);

  const metadata = {
    name: `${tripId}_${Date.now()}_${file.name}`,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const resp = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink,thumbnailLink`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  const result = await resp.json();

  // Make it publicly viewable
  await fetch(`${DRIVE_API}/files/${result.id}/permissions`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return {
    id: result.id,
    url: `https://drive.google.com/thumbnail?id=${result.id}&sz=w800`,
  };
}

export async function getPhotoUrl(fileId: string): Promise<string> {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
}

export async function deletePhoto(fileId: string): Promise<void> {
  await fetch(`${DRIVE_API}/files/${fileId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}
