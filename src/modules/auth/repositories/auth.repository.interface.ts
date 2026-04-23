import { RefreshToken, User } from '@prisma/client';

export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  phone: string;
}

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: CreateUserData): Promise<User>;
  createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken>;
  findRefreshToken(token: string): Promise<RefreshToken | null>;
  deleteRefreshToken(token: string): Promise<void>;
  findShowcaseProduct(): Promise<{
    referenceCode: string;
    name: string;
    price: number;
    imageUrl: string | null;
    artisan: {
      referenceCode: string;
      fullName: string;
    };
  } | null>;
}

export const AUTH_REPOSITORY = Symbol('IAuthRepository');
