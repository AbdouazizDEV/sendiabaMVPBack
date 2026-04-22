import { ContentEntry, User } from '@prisma/client';

export interface ContentEntryListFilters {
  scope?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface ContentEntryWithUpdater extends ContentEntry {
  updatedBy: Pick<User, 'id' | 'displayName' | 'role' | 'email'> | null;
}

export interface IBackofficeContentRepository {
  findMany(filters: ContentEntryListFilters): Promise<ContentEntry[]>;
  count(filters: Omit<ContentEntryListFilters, 'page' | 'limit'>): Promise<number>;
  findByKey(key: string): Promise<ContentEntryWithUpdater | null>;
  updateByKey(
    key: string,
    data: { overrideValue: string | null; updatedById: string | null },
  ): Promise<ContentEntry>;
}

export const BACKOFFICE_CONTENT_REPOSITORY = Symbol('IBackofficeContentRepository');
