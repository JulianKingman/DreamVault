import { getModifiedSince, markSynced, upsertFromSync } from './database';
import type { Dream, SyncDreamPayload } from '../types';

// react-native-cloud-store provides iCloud Documents access
// This module handles reading/writing individual dream JSON files
let CloudStore: any;
try {
  CloudStore = require('react-native-cloud-store');
} catch {
  // CloudStore not available (e.g., simulator without iCloud)
}

const SYNC_DIR = 'dreams/';

function dreamToPayload(dream: Dream): SyncDreamPayload {
  return {
    uuid: dream.uuid!,
    content: dream.content,
    title: dream.title,
    intention: null, // Intentions are now stored separately per-date
    notes: dream.notes,
    isFavorite: dream.isFavorite,
    dateCreated: dream.dateCreated.toISOString(),
    dateModified: dream.dateModified.toISOString(),
    isDeleted: dream.isDeleted ?? false,
    tags: dream.tags?.map(t => t.name) ?? [],
  };
}

export async function isCloudAvailable(): Promise<boolean> {
  if (!CloudStore) return false;
  try {
    return await CloudStore.isICloudAvailable();
  } catch {
    return false;
  }
}

export async function syncToCloud(since: Date): Promise<number> {
  if (!CloudStore) return 0;

  const modified = getModifiedSince(since);
  if (modified.length === 0) return 0;

  // Ensure sync directory exists
  try {
    await CloudStore.writeFile(`${SYNC_DIR}.keep`, '', { override: true });
  } catch {
    // Directory might already exist
  }

  const syncedIds: number[] = [];
  for (const dream of modified) {
    if (!dream.uuid) continue;
    const payload = dreamToPayload(dream);
    const path = `${SYNC_DIR}${dream.uuid}.json`;
    await CloudStore.writeFile(path, JSON.stringify(payload), { override: true });
    syncedIds.push(dream.id);
  }

  markSynced(syncedIds);
  return syncedIds.length;
}

export async function syncFromCloud(): Promise<number> {
  if (!CloudStore) return 0;

  let files: string[];
  try {
    files = await CloudStore.readDir(SYNC_DIR);
  } catch {
    return 0;
  }

  let count = 0;
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const content = await CloudStore.readFile(`${SYNC_DIR}${file}`);
      const payload: SyncDreamPayload = JSON.parse(content);
      upsertFromSync(payload);
      count++;
    } catch {
      // Skip malformed files
      continue;
    }
  }
  return count;
}

export async function fullSync(lastSyncTime: Date): Promise<{ uploaded: number; downloaded: number }> {
  const uploaded = await syncToCloud(lastSyncTime);
  const downloaded = await syncFromCloud();
  return { uploaded, downloaded };
}
