import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PublicContentQueryDto {
  @ApiProperty({ example: 'cart' })
  @IsString()
  @IsNotEmpty()
  scope!: string;
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
