import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class BackofficeArtisansQueryDto {
  @ApiProperty({ required: false, example: 'awa' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, example: 'Actif' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export class BackofficeArtisanDto {
  @ApiProperty({ example: 'ART-3021' }) id!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() craft!: string;
  @ApiProperty() city!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ nullable: true }) phone!: string | null;
  @ApiProperty({ nullable: true }) photoUrl!: string | null;
  @ApiProperty({ nullable: true }) bio!: string | null;
  @ApiProperty({ example: 'Actif' }) status!: string;
}

export class BackofficeArtisansListResponseDto {
  @ApiProperty({ type: [BackofficeArtisanDto] }) items!: BackofficeArtisanDto[];
  @ApiProperty({
    example: { page: 1, limit: 20, total: 1, totalPages: 1 },
  })
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class UpdateBackofficeArtisanDto {
  @ApiProperty() @IsString() fullName!: string;
  @ApiProperty() @IsString() craft!: string;
  @ApiProperty() @IsString() city!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty({ nullable: true }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ nullable: true }) @IsOptional() @IsString() photoUrl?: string;
  @ApiProperty({ nullable: true }) @IsOptional() @IsString() bio?: string;
  @ApiProperty({ example: 'Actif' }) @IsString() status!: string;
}

export class UpdateBackofficeArtisanResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({ example: 'Profil artisan mis a jour.' }) message!: string;
  @ApiProperty({
    example: {
      id: 'ART-3021',
      fullName: 'Awa Ndiaye',
      craft: 'Maroquinerie',
      city: 'Dakar',
      email: 'awa.ndiaye@sendiaba.com',
      phone: '+221 77 102 00 11',
      photoUrl: 'https://cdn.sendiaba.com/artisans/awa-ndiaye-v2.jpg',
      bio: 'Bio mise a jour...',
      status: 'Actif',
      updatedAt: '2026-04-16T22:10:00Z',
    },
  })
  data!: BackofficeArtisanDto & { updatedAt: string };
}

export class UploadArtisanPhotoResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({
    example: {
      photoUrl: 'https://cdn.sendiaba.com/artisans/ART-3021/profile-2026-04-16.jpg',
    },
  })
  data!: { photoUrl: string };
}

export class UpdateArtisanStatusDto {
  @ApiProperty({ example: 'Suspendu' })
  @IsString()
  status!: string;
}

export class UpdateArtisanStatusResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({
    example: {
      id: 'ART-3021',
      status: 'Suspendu',
      updatedAt: '2026-04-16T22:11:30Z',
    },
  })
  data!: {
    id: string;
    status: string;
    updatedAt: string;
  };
}
