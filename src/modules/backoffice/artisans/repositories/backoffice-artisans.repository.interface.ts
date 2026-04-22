import { Artisan, ArtisanStatus, Prisma } from '@prisma/client';

export interface ArtisanListFilters {
  search?: string;
  status?: ArtisanStatus;
  page: number;
  limit: number;
}

export interface IBackofficeArtisansRepository {
  findAll(filters: ArtisanListFilters): Promise<Artisan[]>;
  count(filters: Omit<ArtisanListFilters, 'page' | 'limit'>): Promise<number>;
  /** Resolve by `referenceCode` (ART-xxxx) or legacy internal `id` (cuid). */
  findByIdentifier(identifier: string): Promise<Artisan | null>;
  update(id: string, data: Prisma.ArtisanUpdateInput): Promise<Artisan>;
  updateStatus(id: string, status: ArtisanStatus): Promise<Artisan>;
  updatePhoto(id: string, photoUrl: string): Promise<Artisan>;
}

export const BACKOFFICE_ARTISANS_REPOSITORY = Symbol(
  'IBackofficeArtisansRepository',
);
