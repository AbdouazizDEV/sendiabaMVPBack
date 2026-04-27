import type { UserRole, UserStatus } from '@prisma/client';

export const BACKOFFICE_USERS_REPOSITORY = Symbol('IBackofficeUsersRepository');

export interface UserListFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page: number;
  limit: number;
}

export interface BackofficeUserListRow {
  id: string;
  referenceCode: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  profile: { city: string | null } | null;
  _count: { orders: number };
}

export interface IBackofficeUsersRepository {
  findMany(filters: UserListFilters): Promise<BackofficeUserListRow[]>;
  count(filters: Omit<UserListFilters, 'page' | 'limit'>): Promise<number>;
  findByIdentifier(identifier: string): Promise<BackofficeUserListRow | null>;
  updateRole(id: string, role: UserRole): Promise<BackofficeUserListRow>;
}
