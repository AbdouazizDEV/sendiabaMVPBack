import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
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
    const row = await this.resolveArtisanUser(artisanId);
    return this.toResponseFromUser(row);
  }

  async update(
    artisanId: string,
    dto: UpdateBackofficeArtisanDto,
  ): Promise<UpdateBackofficeArtisanResponseDto> {
    const existing = await this.resolveArtisanUser(artisanId);
    const status = this.parseRequiredUserStatus(dto.status);
    const updated = await this.artisansRepository.update(existing.id, {
      fullName: dto.fullName,
      craft: dto.craft,
      city: dto.city,
      email: dto.email,
      phone: dto.phone,
      photoUrl: dto.photoUrl,
      bio: dto.bio,
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

  async saveUploadedPhoto(
    artisanIdentifier: string,
    file: Express.Multer.File,
  ): Promise<UploadArtisanPhotoResponseDto> {
    const resolved = await this.resolveArtisanUser(artisanIdentifier);
    const buffer = file?.buffer;
    if (!buffer?.length) {
      throw new BadRequestException({
        code: 'EMPTY_FILE',
        message: 'Aucun fichier image recu.',
      });
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    const { secureUrl } = await this.cloudinary.uploadImageBuffer(buffer, {
      folder: `sendiaba/artisans/${resolved.referenceCode}`,
      publicId: `profile-${dateStr}-${Date.now()}`,
    });
    const updated = await this.artisansRepository.updatePhoto(resolved.id, secureUrl);
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
    const existing = await this.resolveArtisanUser(artisanId);
    const updated = await this.artisansRepository.updateStatus(
      existing.id,
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

  private async resolveArtisanUser(
    identifier: string,
  ): Promise<BackofficeArtisanUserRow> {
    const userRow = await this.artisansRepository.findByIdentifier(identifier);
    if (userRow) {
      return userRow;
    }
    throw new NotFoundException({
      code: 'ARTISAN_NOT_FOUND',
      message: 'Artisan introuvable.',
    });
  }

  private toResponseFromUser(row: BackofficeArtisanUserRow): BackofficeArtisanDto {
    return {
      id: row.referenceCode,
      fullName: row.displayName,
      craft: row.profile?.craft ?? '',
      city: row.profile?.city ?? '',
      email: row.email,
      phone: row.profile?.phone ?? null,
      photoUrl: row.profile?.avatarUrl ?? null,
      bio: row.profile?.bio ?? null,
      status: this.toUserStatusLabel(row.status),
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

}
