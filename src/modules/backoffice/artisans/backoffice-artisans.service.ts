import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Artisan, ArtisanStatus, Prisma, UserStatus } from '@prisma/client';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';
import {
  BACKOFFICE_ARTISANS_REPOSITORY,
  type BackofficeArtisanUserRow,
  type IBackofficeArtisansRepository,
} from './repositories/backoffice-artisans.repository.interface';
import {
  BackofficeArtisanDto,
  BackofficeArtisansListResponseDto,
  BackofficeArtisansQueryDto,
  UpdateArtisanStatusResponseDto,
  UpdateBackofficeArtisanDto,
  UpdateBackofficeArtisanResponseDto,
  UploadArtisanPhotoResponseDto,
} from './dto/backoffice-artisans.dto';

type ResolvedArtisan =
  | { kind: 'user'; row: BackofficeArtisanUserRow }
  | { kind: 'catalog'; row: Artisan };

@Injectable()
export class BackofficeArtisansService {
  constructor(
    @Inject(BACKOFFICE_ARTISANS_REPOSITORY)
    private readonly artisansRepository: IBackofficeArtisansRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list(
    query: BackofficeArtisansQueryDto,
  ): Promise<BackofficeArtisansListResponseDto> {
    const status = this.toPrismaUserStatus(query.status);
    const [items, total] = await Promise.all([
      this.artisansRepository.findAll({
        search: query.search,
        status,
        page: query.page,
        limit: query.limit,
      }),
      this.artisansRepository.count({ search: query.search, status }),
    ]);

    return {
      items: items.map((row) => this.toResponseFromUser(row)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async findOne(artisanId: string): Promise<BackofficeArtisanDto> {
    const resolved = await this.resolveArtisan(artisanId);
    return this.toDto(resolved);
  }

  async update(
    artisanId: string,
    dto: UpdateBackofficeArtisanDto,
  ): Promise<UpdateBackofficeArtisanResponseDto> {
    const resolved = await this.resolveArtisan(artisanId);
    if (resolved.kind === 'user') {
      const status = this.parseRequiredUserStatus(dto.status);
      const updated = await this.artisansRepository.update(resolved.row.id, {
        fullName: dto.fullName,
        city: dto.city,
        email: dto.email,
        phone: dto.phone,
        status,
      });
      if (!updated) {
        throw new NotFoundException({
          code: 'ARTISAN_NOT_FOUND',
          message: 'Artisan introuvable.',
        });
      }
      return {
        success: true,
        message: 'Profil artisan mis a jour.',
        data: {
          ...this.toResponseFromUser(updated),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    }

    const status = this.parseRequiredArtisanStatus(dto.status);
    const updated = await this.artisansRepository.updateCatalog(resolved.row.id, {
      fullName: dto.fullName,
      craft: dto.craft,
      city: dto.city,
      email: dto.email,
      phone: dto.phone ?? null,
      photoUrl: dto.photoUrl ?? null,
      bio: dto.bio ?? null,
      status,
    } satisfies Prisma.ArtisanUpdateInput);
    if (!updated) {
      throw new NotFoundException({
        code: 'ARTISAN_NOT_FOUND',
        message: 'Artisan introuvable.',
      });
    }
    return {
      success: true,
      message: 'Profil artisan mis a jour.',
      data: {
        ...this.toResponseFromCatalog(updated),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  async saveUploadedPhoto(
    artisanIdentifier: string,
    file: Express.Multer.File,
  ): Promise<UploadArtisanPhotoResponseDto> {
    const resolved = await this.resolveArtisan(artisanIdentifier);
    const buffer = file?.buffer;
    if (!buffer?.length) {
      throw new BadRequestException({
        code: 'EMPTY_FILE',
        message: 'Aucun fichier image recu.',
      });
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    if (resolved.kind === 'user') {
      const { secureUrl } = await this.cloudinary.uploadImageBuffer(buffer, {
        folder: `sendiaba/artisan-users/${resolved.row.referenceCode}`,
        publicId: `profile-${dateStr}-${Date.now()}`,
      });
      const updated = await this.artisansRepository.updatePhoto(
        resolved.row.id,
        secureUrl,
      );
      if (!updated) {
        throw new NotFoundException({
          code: 'ARTISAN_NOT_FOUND',
          message: 'Artisan introuvable.',
        });
      }
      return { success: true, data: { photoUrl: secureUrl } };
    }

    const { secureUrl } = await this.cloudinary.uploadImageBuffer(buffer, {
      folder: `sendiaba/artisans/${resolved.row.referenceCode}`,
      publicId: `profile-${dateStr}-${Date.now()}`,
    });
    const updated = await this.artisansRepository.updateCatalogPhoto(
      resolved.row.id,
      secureUrl,
    );
    if (!updated) {
      throw new NotFoundException({
        code: 'ARTISAN_NOT_FOUND',
        message: 'Artisan introuvable.',
      });
    }
    return { success: true, data: { photoUrl: secureUrl } };
  }

  async updateStatus(
    artisanId: string,
    statusText: string,
  ): Promise<UpdateArtisanStatusResponseDto> {
    const resolved = await this.resolveArtisan(artisanId);
    if (resolved.kind === 'user') {
      const updated = await this.artisansRepository.updateStatus(
        resolved.row.id,
        this.parseRequiredUserStatus(statusText),
      );
      if (!updated) {
        throw new NotFoundException({
          code: 'ARTISAN_NOT_FOUND',
          message: 'Artisan introuvable.',
        });
      }
      return {
        success: true,
        data: {
          id: updated.referenceCode,
          status: this.toUserStatusLabel(updated.status),
          updatedAt: updated.updatedAt.toISOString(),
        },
      };
    }

    const updated = await this.artisansRepository.updateCatalogStatus(
      resolved.row.id,
      this.parseRequiredArtisanStatus(statusText),
    );
    if (!updated) {
      throw new NotFoundException({
        code: 'ARTISAN_NOT_FOUND',
        message: 'Artisan introuvable.',
      });
    }
    return {
      success: true,
      data: {
        id: updated.referenceCode,
        status: this.toCatalogStatusLabel(updated.status),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  private async resolveArtisan(identifier: string): Promise<ResolvedArtisan> {
    const userRow = await this.artisansRepository.findByIdentifier(identifier);
    if (userRow) {
      return { kind: 'user', row: userRow };
    }
    const catalog = await this.artisansRepository.findCatalogByIdentifier(identifier);
    if (catalog) {
      return { kind: 'catalog', row: catalog };
    }
    throw new NotFoundException({
      code: 'ARTISAN_NOT_FOUND',
      message: 'Artisan introuvable.',
    });
  }

  private toDto(resolved: ResolvedArtisan): BackofficeArtisanDto {
    return resolved.kind === 'user'
      ? this.toResponseFromUser(resolved.row)
      : this.toResponseFromCatalog(resolved.row);
  }

  private toResponseFromUser(row: BackofficeArtisanUserRow): BackofficeArtisanDto {
    return {
      id: row.referenceCode,
      fullName: row.displayName,
      craft: '',
      city: row.profile?.city ?? '',
      email: row.email,
      phone: row.profile?.phone ?? null,
      photoUrl: row.profile?.avatarUrl ?? null,
      bio: null,
      status: this.toUserStatusLabel(row.status),
    };
  }

  private toResponseFromCatalog(row: Artisan): BackofficeArtisanDto {
    return {
      id: row.referenceCode,
      fullName: row.fullName,
      craft: row.craft,
      city: row.city,
      email: row.email,
      phone: row.phone,
      photoUrl: row.photoUrl,
      bio: row.bio,
      status: this.toCatalogStatusLabel(row.status),
    };
  }

  private toPrismaUserStatus(status?: string): UserStatus | undefined {
    if (!status) {
      return undefined;
    }
    return this.toUserStatusOrThrow(status);
  }

  private parseRequiredUserStatus(status: string): UserStatus {
    return this.toUserStatusOrThrow(status);
  }

  private toUserStatusOrThrow(text: string): UserStatus {
    switch (text.toLowerCase()) {
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

  private parseRequiredArtisanStatus(text: string): ArtisanStatus {
    switch (text.toLowerCase()) {
      case 'actif':
      case 'active':
        return ArtisanStatus.ACTIVE;
      case 'en attente':
      case 'pending':
        return ArtisanStatus.PENDING;
      case 'suspendu':
      case 'suspended':
        return ArtisanStatus.SUSPENDED;
      default:
        throw new BadRequestException({
          code: 'INVALID_STATUS',
          message: 'Statut artisan (vitrine) invalide.',
        });
    }
  }

  private toUserStatusLabel(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Actif';
      case UserStatus.PENDING:
        return 'En attente';
      case UserStatus.SUSPENDED:
        return 'Suspendu';
    }
  }

  private toCatalogStatusLabel(status: ArtisanStatus): string {
    switch (status) {
      case ArtisanStatus.ACTIVE:
        return 'Actif';
      case ArtisanStatus.PENDING:
        return 'En attente';
      case ArtisanStatus.SUSPENDED:
        return 'Suspendu';
    }
  }
}
