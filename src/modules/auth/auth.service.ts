import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { ERROR_CODES } from '../../common/constants/error-codes.constant';
import { publicUserId } from '../../common/utils/public-ids.util';
import {
  AuthShowcaseResponseDto,
  AuthSuccessResponseDto,
  SessionDto,
  SessionStatusResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  AUTH_REPOSITORY,
  type IAuthRepository,
} from './repositories/auth.repository.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSuccessResponseDto> {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException({
        code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
        message: 'Cet email est deja associe a un compte.',
      });
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.authRepository.createUser({
      email: dto.email,
      password,
      displayName: dto.displayName,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthSuccessResponseDto> {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Email ou mot de passe invalide.',
      });
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Email ou mot de passe invalide.',
      });
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string): Promise<AuthSuccessResponseDto> {
    const tokenEntity = await this.authRepository.findRefreshToken(refreshToken);
    if (!tokenEntity || tokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalide ou expire');
    }

    const user = await this.authRepository.findUserById(tokenEntity.userId);
    if (!user) {
      throw new UnauthorizedException('Session invalide');
    }

    await this.authRepository.deleteRefreshToken(refreshToken);
    return this.buildAuthResponse(user);
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.authRepository.deleteRefreshToken(refreshToken);
    return { message: 'Session terminee' };
  }

  async getSessionUser(userId: string): Promise<User | null> {
    return this.authRepository.findUserById(userId);
  }

  async getSessionStatusByAccessToken(
    accessToken?: string,
  ): Promise<SessionStatusResponseDto> {
    if (!accessToken) {
      return { authenticated: false, session: null };
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        accessToken,
      );
      const user = await this.authRepository.findUserById(payload.sub);
      if (!user) {
        return { authenticated: false, session: null };
      }
      return {
        authenticated: true,
        session: this.toSessionDto(user),
      };
    } catch {
      return { authenticated: false, session: null };
    }
  }

  async getShowcase(): Promise<AuthShowcaseResponseDto> {
    const product = await this.authRepository.findShowcaseProduct();
    if (!product) {
      throw new NotFoundException({
        code: ERROR_CODES.PRODUCT_NOT_FOUND,
        message: 'Piece du moment introuvable.',
      });
    }

    return {
      headline: 'Le luxe artisanal africain, signe par son createur.',
      subtitle: 'Connectez-vous pour sauvegarder vos selections...',
      featuredProduct: {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl ?? '',
        artisan: {
          id: product.artisan.id,
          name: product.artisan.fullName,
        },
      },
    };
  }

  private async buildAuthResponse(user: User): Promise<AuthSuccessResponseDto> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', ''),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as SignOptions['expiresIn'],
      },
    );

    const expiresInRaw = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '3600s',
    );
    const expiresIn = this.toSeconds(expiresInRaw);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.authRepository.createRefreshToken(
      user.id,
      refreshToken,
      refreshExpiresAt,
    );

    return {
      success: true,
      session: this.toSessionDto(user),
      token: {
        accessToken,
        refreshToken,
        expiresIn,
      },
    };
  }

  private toSessionDto(user: User): SessionDto {
    return {
      id: publicUserId(user),
      displayName: user.displayName,
      email: user.email,
      role: user.role === 'ADMIN' ? 'admin' : 'customer',
    };
  }

  private toSeconds(value: string): number {
    if (value.endsWith('s')) {
      return Number(value.slice(0, -1));
    }
    if (value.endsWith('m')) {
      return Number(value.slice(0, -1)) * 60;
    }
    if (value.endsWith('h')) {
      return Number(value.slice(0, -1)) * 3600;
    }
    if (value.endsWith('d')) {
      return Number(value.slice(0, -1)) * 86400;
    }
    return Number(value);
  }
}
