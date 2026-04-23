import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Artisan, ArtisanStatus, Prisma } from '@prisma/client';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';
import {
  BACKOFFICE_ARTISANS_REPOSITORY,
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
    const status = this.toPrismaStatus(query.status);
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
      items: items.map((artisan) => this.toResponse(artisan)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async findOne(artisanId: string): Promise<BackofficeArtisanDto> {
    const artisan = await this.resolveArtisan(artisanId);
    return this.toResponse(artisan);
  }

  async update(
    artisanId: string,
    dto: UpdateBackofficeArtisanDto,
  ): Promise<UpdateBackofficeArtisanResponseDto> {
    const existing = await this.resolveArtisan(artisanId);
    const updated = await this.artisansRepository.update(existing.id, {
      fullName: dto.fullName,
      craft: dto.craft,
      city: dto.city,
      email: dto.email,
      phone: dto.phone,
      photoUrl: dto.photoUrl,
      bio: dto.bio,
      status: this.toPrismaStatus(dto.status),
    } satisfies Prisma.ArtisanUpdateInput);

    return {
      success: true,
      message: 'Profil artisan mis a jour.',
      data: {
        ...this.toResponse(updated),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  async saveUploadedPhoto(
    artisanIdentifier: string,
    file: Express.Multer.File,
  ): Promise<UploadArtisanPhotoResponseDto> {
    const artisan = await this.resolveArtisan(artisanIdentifier);
    const buffer = file?.buffer;
    if (!buffer?.length) {
      throw new BadRequestException({
        code: 'EMPTY_FILE',
        message: 'Aucun fichier image recu.',
      });
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    const { secureUrl } = await this.cloudinary.uploadImageBuffer(buffer, {
      folder: `sendiaba/artisans/${artisan.referenceCode}`,
      publicId: `profile-${dateStr}-${Date.now()}`,
    });
    await this.artisansRepository.updatePhoto(artisan.id, secureUrl);
    return {
      success: true,
      data: { photoUrl: secureUrl },
    };
  }

  async updateStatus(
    artisanId: string,
    statusText: string,
  ): Promise<UpdateArtisanStatusResponseDto> {
    const existing = await this.resolveArtisan(artisanId);
    const updated = await this.artisansRepository.updateStatus(
      existing.id,
      this.parseRequiredStatus(statusText),
    );

    return {
      success: true,
      data: {
        id: updated.referenceCode,
        status: this.toStatusLabel(updated.status),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  private async resolveArtisan(identifier: string): Promise<Artisan> {
    const artisan = await this.artisansRepository.findByIdentifier(identifier);
    if (!artisan) {
      throw new NotFoundException({
        code: 'ARTISAN_NOT_FOUND',
        message: 'Artisan introuvable.',
      });
    }
    return artisan;
  }

  private toResponse(artisan: Artisan): BackofficeArtisanDto {
    return {
      id: artisan.referenceCode,
      fullName: artisan.fullName,
      craft: artisan.craft,
      city: artisan.city,
      email: artisan.email,
      phone: artisan.phone,
      photoUrl: artisan.photoUrl,
      bio: artisan.bio,
      status: this.toStatusLabel(artisan.status),
    };
  }

  private toPrismaStatus(status?: string): ArtisanStatus | undefined {
    if (!status) {
      return undefined;
    }
    switch (status.toLowerCase()) {
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
          message: 'Statut artisan invalide.',
        });
    }
  }

  private parseRequiredStatus(status: string): ArtisanStatus {
    const mapped = this.toPrismaStatus(status);
    if (!mapped) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Statut artisan invalide.',
      });
    }
    return mapped;
  }

  private toStatusLabel(status: ArtisanStatus): string {
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
