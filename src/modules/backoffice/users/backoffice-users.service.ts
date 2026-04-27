import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import {
  BACKOFFICE_USERS_REPOSITORY,
  type BackofficeUserListRow,
  type IBackofficeUsersRepository,
} from './repositories/backoffice-users.repository.interface';
import {
  BackofficeUserDto,
  BackofficeUsersListResponseDto,
  BackofficeUsersQueryDto,
  UpdateBackofficeUserRoleResponseDto,
} from './dto/backoffice-users.dto';

@Injectable()
export class BackofficeUsersService {
  constructor(
    @Inject(BACKOFFICE_USERS_REPOSITORY)
    private readonly usersRepository: IBackofficeUsersRepository,
  ) {}

  async list(query: BackofficeUsersQueryDto): Promise<BackofficeUsersListResponseDto> {
    const role = this.toPrismaRole(query.role);
    const status = this.toPrismaUserStatus(query.status);
    const [rows, total] = await Promise.all([
      this.usersRepository.findMany({
        search: query.search,
        role,
        status,
        page: query.page,
        limit: query.limit,
      }),
      this.usersRepository.count({
        search: query.search,
        role,
        status,
      }),
    ]);

    return {
      items: rows.map((row) => this.toDto(row)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async findOne(userId: string): Promise<BackofficeUserDto> {
    const row = await this.usersRepository.findByIdentifier(userId);
    if (!row) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Utilisateur introuvable.',
      });
    }
    return this.toDto(row);
  }

  async promoteToArtisan(userId: string): Promise<UpdateBackofficeUserRoleResponseDto> {
    const row = await this.usersRepository.findByIdentifier(userId);
    if (!row) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Utilisateur introuvable.',
      });
    }
    if (row.role !== UserRole.CUSTOMER) {
      throw new BadRequestException({
        code: 'ROLE_TRANSITION_NOT_ALLOWED',
        message: 'Seuls les comptes CUSTOMER peuvent etre promus ARTISAN.',
      });
    }
    const updated = await this.usersRepository.updateRole(row.id, UserRole.ARTISAN);
    return {
      success: true,
      data: {
        id: updated.referenceCode,
        role: this.toRoleLabel(updated.role),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  private toDto(row: BackofficeUserListRow): BackofficeUserDto {
    return {
      id: row.referenceCode,
      name: row.displayName,
      email: row.email,
      role: this.toRoleLabel(row.role),
      status: this.toStatusLabel(row.status),
      city: row.profile?.city ?? '',
      joinedAt: row.createdAt.toISOString().slice(0, 10),
      totalOrders: row._count.orders,
    };
  }

  private toPrismaRole(role?: string): UserRole | undefined {
    if (!role?.trim()) {
      return undefined;
    }
    const normalized = role.trim().toLowerCase();
    switch (normalized) {
      case 'client':
      case 'customer':
        return UserRole.CUSTOMER;
      case 'admin':
        return UserRole.ADMIN;
      case 'artisan':
        return UserRole.ARTISAN;
      default:
        throw new BadRequestException({
          code: 'INVALID_ROLE',
          message: 'Rôle utilisateur invalide.',
        });
    }
  }

  private toPrismaUserStatus(status?: string): UserStatus | undefined {
    if (!status?.trim()) {
      return undefined;
    }
    const normalized = status.trim().toLowerCase();
    switch (normalized) {
      case 'actif':
      case 'active':
        return UserStatus.ACTIVE;
      case 'en attente':
      case 'pending':
        return UserStatus.PENDING;
      case 'suspendu':
      case 'suspended':
        return UserStatus.SUSPENDED;
      default:
        throw new BadRequestException({
          code: 'INVALID_STATUS',
          message: 'Statut utilisateur invalide.',
        });
    }
  }

  private toRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.CUSTOMER:
        return 'Client';
      case UserRole.ARTISAN:
        return 'Artisan';
    }
  }

  private toStatusLabel(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Actif';
      case UserStatus.PENDING:
        return 'En attente';
      case UserStatus.SUSPENDED:
        return 'Suspendu';
    }
  }
}
