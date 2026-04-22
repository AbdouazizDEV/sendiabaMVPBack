import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ContentEntry, User, UserRole } from '@prisma/client';
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
    await this.ensureKeyExists(key);
    const updated = await this.contentRepository.updateByKey(key, {
      overrideValue: dto.value,
      updatedById: actor.id,
    });
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
      await this.ensureKeyExists(item.key);
      const updated = await this.contentRepository.updateByKey(item.key, {
        overrideValue: item.value,
        updatedById: actor.id,
      });
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
