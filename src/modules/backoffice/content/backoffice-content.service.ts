import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ContentEntry, User, UserRole } from '@prisma/client';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';
import {
  BACKOFFICE_CONTENT_REPOSITORY,
  type ContentEntryWithUpdater,
  type IBackofficeContentRepository,
} from './repositories/backoffice-content.repository.interface';
import {
  BulkContentBodyDto,
  BulkContentResponseDto,
  ClearOverrideResponseDto,
  ContentEntriesListResponseDto,
  ContentEntryDetailDto,
  ContentEntriesQueryDto,
  ContentEntryListItemDto,
  ContentEntryUpdatedByDto,
  UpdateContentEntryBodyDto,
  UpdateContentEntryResponseDto,
} from './dto/backoffice-content.dto';

@Injectable()
export class BackofficeContentService {
  constructor(
    @Inject(BACKOFFICE_CONTENT_REPOSITORY)
    private readonly contentRepository: IBackofficeContentRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list(query: ContentEntriesQueryDto): Promise<ContentEntriesListResponseDto> {
    const [rows, total] = await Promise.all([
      this.contentRepository.findMany({
        scope: query.scope?.trim() || undefined,
        search: query.search?.trim() || undefined,
        page: query.page,
        limit: query.limit,
      }),
      this.contentRepository.count({
        scope: query.scope?.trim() || undefined,
        search: query.search?.trim() || undefined,
      }),
    ]);

    return {
      items: rows.map((row) => this.toListItem(row)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async findOne(key: string): Promise<ContentEntryDetailDto> {
    const entry = await this.contentRepository.findByKey(key);
    if (!entry) {
      throw new NotFoundException({
        code: 'CONTENT_ENTRY_NOT_FOUND',
        message: 'Entree de contenu introuvable.',
      });
    }
    return this.toDetail(entry);
  }

  async update(
    key: string,
    dto: UpdateContentEntryBodyDto,
    actor: User,
  ): Promise<UpdateContentEntryResponseDto> {
    const updated = await this.upsertEntry(key, dto.value, actor, dto);
    return {
      success: true,
      message: 'Contenu mis a jour.',
      data: {
        key: updated.key,
        overrideValue: updated.overrideValue,
        effectiveValue: this.effectiveValue(updated),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  async clearOverride(key: string): Promise<ClearOverrideResponseDto> {
    const existing = await this.contentRepository.findByKey(key);
    if (!existing) {
      throw new NotFoundException({
        code: 'CONTENT_ENTRY_NOT_FOUND',
        message: 'Entree de contenu introuvable.',
      });
    }
    const updated = await this.contentRepository.updateByKey(key, {
      overrideValue: null,
      updatedById: null,
    });
    return {
      success: true,
      message: 'Personnalisation supprimee. Valeur par defaut restauree.',
      data: {
        key: updated.key,
        overrideValue: null,
        effectiveValue: this.effectiveValue(updated),
      },
    };
  }

  async bulkUpdate(
    dto: BulkContentBodyDto,
    actor: User,
  ): Promise<BulkContentResponseDto> {
    const results: { key: string; updatedAt: string }[] = [];
    for (const item of dto.items) {
      const updated = await this.upsertEntry(item.key, item.value, actor, item);
      results.push({
        key: updated.key,
        updatedAt: updated.updatedAt.toISOString(),
      });
    }
    return {
      success: true,
      updatedCount: results.length,
      items: results,
    };
  }

  async uploadImageAndUpdate(
    key: string,
    file: Express.Multer.File,
    actor: User,
    meta?: { scope?: string; label?: string; defaultValue?: string },
  ): Promise<UpdateContentEntryResponseDto> {
    const uploaded = await this.cloudinary.uploadImageBuffer(file.buffer, {
      folder: 'content',
      publicId: key.replace(/[^a-zA-Z0-9._-]/g, '_'),
    });
    const updated = await this.upsertEntry(key, uploaded.secureUrl, actor, meta);
    return {
      success: true,
      message: 'Image uploadée et contenu mis à jour.',
      data: {
        key: updated.key,
        overrideValue: updated.overrideValue,
        effectiveValue: this.effectiveValue(updated),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  private async ensureKeyExists(key: string): Promise<void> {
    const row = await this.contentRepository.findByKey(key);
    if (!row) {
      throw new NotFoundException({
        code: 'CONTENT_ENTRY_NOT_FOUND',
        message: 'Entree de contenu introuvable.',
      });
    }
  }

  private toListItem(row: ContentEntry): ContentEntryListItemDto {
    return {
      key: row.key,
      scope: row.scope,
      label: row.label,
      defaultValue: row.defaultValue,
      overrideValue: row.overrideValue,
      isCustomized:
        row.overrideValue != null && String(row.overrideValue).length > 0,
    };
  }

  private toDetail(row: ContentEntryWithUpdater): ContentEntryDetailDto {
    return {
      key: row.key,
      scope: row.scope,
      label: row.label,
      defaultValue: row.defaultValue,
      overrideValue: row.overrideValue,
      effectiveValue: this.effectiveValue(row),
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy ? this.toUpdatedByDto(row.updatedBy) : null,
    };
  }

  private toUpdatedByDto(user: {
    id: string;
    displayName: string;
    role: UserRole;
  }): ContentEntryUpdatedByDto {
    return {
      id: this.toPublicUserId(user),
      displayName: user.displayName,
    };
  }

  private effectiveValue(row: ContentEntry): string {
    return row.overrideValue ?? row.defaultValue;
  }

  private defaultScopeFromKey(key: string): string {
    const [scope] = key.split('.');
    return scope?.trim() || 'global';
  }

  private labelFromKey(key: string): string {
    return key.replace(/\./g, ' / ');
  }

  private async upsertEntry(
    key: string,
    value: string,
    actor: User,
    meta?: { scope?: string; label?: string; defaultValue?: string },
  ): Promise<ContentEntry> {
    const existing = await this.contentRepository.findByKey(key);
    if (existing) {
      return this.contentRepository.updateByKey(key, {
        overrideValue: value,
        updatedById: actor.id,
      });
    }
    return this.contentRepository.upsertByKey({
      key,
      scope: meta?.scope?.trim() || this.defaultScopeFromKey(key),
      label: meta?.label?.trim() || this.labelFromKey(key),
      defaultValue: meta?.defaultValue ?? '',
      overrideValue: value,
      updatedById: actor.id,
    });
  }

  private toPublicUserId(user: {
    id: string;
    role: UserRole;
  }): string {
    if (user.role === UserRole.ADMIN) {
      return 'usr-admin-001';
    }
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) {
      hash = (Math.imul(31, hash) + user.id.charCodeAt(i)) | 0;
    }
    const n = (Math.abs(hash) % 9000) + 100;
    return `usr-${n}`;
  }
}
