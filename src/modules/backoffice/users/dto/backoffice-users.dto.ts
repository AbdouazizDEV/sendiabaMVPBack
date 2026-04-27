import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class BackofficeUsersQueryDto {
  @ApiProperty({ required: false, example: 'diallo' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, example: 'Client' })
  @IsOptional()
  @IsString()
  role?: string;

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

export class BackofficeUserDto {
  @ApiProperty({ example: 'USR-4012' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ example: 'Client' }) role!: string;
  @ApiProperty({ example: 'Actif' }) status!: string;
  @ApiProperty() city!: string;
  @ApiProperty({ example: '2026-02-03' }) joinedAt!: string;
  @ApiProperty() totalOrders!: number;
}

export class BackofficeUsersListResponseDto {
  @ApiProperty({ type: [BackofficeUserDto] }) items!: BackofficeUserDto[];
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

export class UpdateBackofficeUserRoleDto {
  @ApiProperty({ example: 'ARTISAN', enum: ['ARTISAN'] })
  @IsString()
  @IsIn(['ARTISAN'])
  role!: 'ARTISAN';
}

export class UpdateBackofficeUserRoleResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({
    example: {
      id: 'USR-4012',
      role: 'Artisan',
      updatedAt: '2026-04-26T13:45:00.000Z',
    },
  })
  data!: {
    id: string;
    role: string;
    updatedAt: string;
  };
}
