import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ContentEntriesQueryDto {
  @ApiProperty({ required: false, example: 'home' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiProperty({ required: false, example: 'hero' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, example: 30, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 30;
}

export class ContentEntryListItemDto {
  @ApiProperty() key!: string;
  @ApiProperty() scope!: string;
  @ApiProperty() label!: string;
  @ApiProperty() defaultValue!: string;
  @ApiProperty({ nullable: true }) overrideValue!: string | null;
  @ApiProperty() isCustomized!: boolean;
}

export class ContentEntriesListResponseDto {
  @ApiProperty({ type: [ContentEntryListItemDto] }) items!: ContentEntryListItemDto[];
  @ApiProperty()
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ContentEntryUpdatedByDto {
  @ApiProperty({ example: 'usr-admin-001' }) id!: string;
  @ApiProperty() displayName!: string;
}

export class ContentEntryDetailDto {
  @ApiProperty() key!: string;
  @ApiProperty() scope!: string;
  @ApiProperty() label!: string;
  @ApiProperty() defaultValue!: string;
  @ApiProperty({ nullable: true }) overrideValue!: string | null;
  @ApiProperty() effectiveValue!: string;
  @ApiProperty() updatedAt!: string;
  @ApiProperty({ type: ContentEntryUpdatedByDto, nullable: true })
  updatedBy!: ContentEntryUpdatedByDto | null;
}

export class UpdateContentEntryBodyDto {
  @ApiProperty()
  @IsString()
  value!: string;
}

export class UpdateContentEntryResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({ example: 'Contenu mis a jour.' }) message!: string;
  @ApiProperty()
  data!: {
    key: string;
    overrideValue: string | null;
    effectiveValue: string;
    updatedAt: string;
  };
}

export class ClearOverrideResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty()
  message!: string;
  @ApiProperty()
  data!: {
    key: string;
    overrideValue: null;
    effectiveValue: string;
  };
}

export class BulkContentItemDto {
  @ApiProperty() @IsString() key!: string;
  @ApiProperty() @IsString() value!: string;
}

export class BulkContentBodyDto {
  @ApiProperty({ type: [BulkContentItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkContentItemDto)
  items!: BulkContentItemDto[];
}

export class BulkContentResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({ example: 2 }) updatedCount!: number;
  @ApiProperty()
  items!: { key: string; updatedAt: string }[];
}
