import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PublicContentQueryDto {
  @ApiProperty({ example: 'home', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  scope?: string;
}

export class PublicContentResponseDto {
  @ApiProperty({ example: 'cart' }) scope!: string;
  @ApiProperty({
    example: {
      'cart.page.title': 'Vos pieces selectionnees',
    },
  })
  entries!: Record<string, string>;
}
