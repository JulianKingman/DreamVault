export interface Dream {
  id: number;
  dateCreated: Date;
  dateModified: Date;
  content: string;
  isFavorite: boolean;
  title: string | null;
  intention: string | null;
  notes: string | null;
  imageUri?: string | null;
  tags?: Tag[];
  uuid?: string;
  lastSyncedAt?: Date | null;
  isDeleted?: boolean;
}

export interface Tag {
  id: number;
  name: string;
}

export interface SyncDreamPayload {
  uuid: string;
  content: string;
  title: string | null;
  intention: string | null;
  notes: string | null;
  isFavorite: boolean;
  dateCreated: string;
  dateModified: string;
  isDeleted: boolean;
  tags: string[];
}
