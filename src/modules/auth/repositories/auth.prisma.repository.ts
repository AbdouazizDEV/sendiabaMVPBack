import { Injectable } from '@nestjs/common';
import { RefreshToken, User } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateUserData, IAuthRepository } from './auth.repository.interface';

@Injectable()
export class AuthPrismaRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: CreateUserData): Promise<User> {
    const count = await this.prisma.user.count();
    const referenceCode = `USR-${5000 + count + 1}`;
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        referenceCode,
        profile: {
          create: {
            phone: data.phone,
          },
        },
      },
    });
  }

  async createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  async findShowcaseProduct(): Promise<{
    referenceCode: string;
    name: string;
    price: number;
    imageUrl: string | null;
    artisan: { referenceCode: string; fullName: string };
  } | null> {
    return this.prisma.product.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        referenceCode: true,
        name: true,
        price: true,
        imageUrl: true,
        artisan: {
          select: {
            referenceCode: true,
            fullName: true,
          },
        },
      },
    });
  }
}
