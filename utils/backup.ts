import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDreams, getDreamByUUID, addDreamBulk } from './database';

export interface DreamBackup {
  version: 1;
  exportedAt: string;
  dreamCount: number;
  dreams: BackupDream[];
}

interface BackupDream {
  uuid: string;
  content: string;
  title: string | null;
  intention: string | null;
  notes: string | null;
  isFavorite: boolean;
  dateCreated: string;
  dateModified: string;
  tags: string[];
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Export all dreams to a JSON file and open the system share sheet.
 * Returns the file URI for testing/programmatic use.
 */
export async function exportDreams(): Promise<string> {
  const dreams = getDreams();

  const backupDreams: BackupDream[] = dreams.map(d => ({
    uuid: d.uuid ?? generateUUID(),
    content: d.content,
    title: d.title,
    intention: d.intention,
    notes: d.notes,
    isFavorite: d.isFavorite,
    dateCreated: d.dateCreated.toISOString(),
    dateModified: d.dateModified.toISOString(),
    tags: d.tags?.map(t => t.name) ?? [],
  }));

  const backup: DreamBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    dreamCount: backupDreams.length,
    dreams: backupDreams,
  };

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `dream-locket-backup-${dateStr}.json`;
  const file = new File(Paths.cache, fileName);

  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(JSON.stringify(backup, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save Dream Locket Backup',
      UTI: 'public.json',
    });
  }

  return file.uri;
}

/**
 * Import dreams from a backup JSON file.
 * Returns the number of dreams imported.
 * Skips dreams that already exist (matched by UUID).
 */
export async function importFromBackup(fileUri: string): Promise<number> {
  const file = new File(fileUri);
  const content = await file.text();
  const backup: DreamBackup = JSON.parse(content);

  if (!backup.version || !backup.dreams || !Array.isArray(backup.dreams)) {
    throw new Error('Invalid backup file format');
  }

  // Filter out dreams that already exist by UUID
  const newDreams = backup.dreams.filter(d => !getDreamByUUID(d.uuid));

  if (newDreams.length === 0) return 0;

  addDreamBulk(
    newDreams.map(d => ({
      content: d.content,
      title: d.title ?? undefined,
      dateCreated: d.dateCreated,
    }))
  );

  return newDreams.length;
}
