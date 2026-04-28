import type { UserStatus } from '@prisma/client';

export interface ArtisanListFilters {
  search?: string;
  status?: UserStatus;
  page: number;
  limit: number;
}

/** Ligne issue de `User` (role ARTISAN) + profil pour le backoffice. */
export type BackofficeArtisanUserRow = {
  id: string;
  referenceCode: string;
  displayName: string;
  email: string;
  status: UserStatus;
  updatedAt: Date;
  profile: {
    city: string | null;
    phone: string | null;
    avatarUrl: string | null;
    craft: string | null;
    bio: string | null;
    quote: string | null;
    heritage: string | null;
    speciality: string | null;
    yearsExperience: number | null;
  } | null;
};

export type UpdateBackofficeArtisanUserData = {
  fullName: string;
  craft?: string | null;
  city: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  status: UserStatus;
};

export interface IBackofficeArtisansRepository {
  findAll(filters: ArtisanListFilters): Promise<BackofficeArtisanUserRow[]>;
  count(filters: Omit<ArtisanListFilters, 'page' | 'limit'>): Promise<number>;
  /** `referenceCode` (USR-xxxx) ou id interne (cuid) — uniquement `role = ARTISAN`. */
  findByIdentifier(identifier: string): Promise<BackofficeArtisanUserRow | null>;
  update(id: string, data: UpdateBackofficeArtisanUserData): Promise<BackofficeArtisanUserRow | null>;
  updateStatus(id: string, status: UserStatus): Promise<BackofficeArtisanUserRow | null>;
  updatePhoto(id: string, photoUrl: string): Promise<BackofficeArtisanUserRow | null>;
}

export const BACKOFFICE_ARTISANS_REPOSITORY = Symbol(
  'IBackofficeArtisansRepository',
);
