import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class CartProductEmbeddedDto {
  @ApiProperty({ example: 'p1' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ example: 'maroquinerie' }) category!: string;
  @ApiProperty() price!: number;
  @ApiProperty() imageUrl!: string;
}

export class CartLineDto {
  @ApiProperty({ example: 'p1' }) productId!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty({ type: CartProductEmbeddedDto }) product!: CartProductEmbeddedDto;
}

export class CartResponseDto {
  @ApiProperty({ type: [CartLineDto] }) items!: CartLineDto[];
  @ApiProperty() itemCount!: number;
  @ApiProperty() subtotal!: number;
  @ApiProperty() shipping!: number;
  @ApiProperty() total!: number;
  @ApiProperty({ example: 'EUR' }) currency!: 'EUR';
}

export class CartPatchQuantityDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  quantity!: number;
}

export class CartPatchItemDataDto {
  @ApiProperty() productId!: string;
  @ApiProperty() quantity!: number;
}

export class CartPatchSuccessDto {
  @ApiProperty() success!: true;
  @ApiProperty({ type: CartPatchItemDataDto }) data!: CartPatchItemDataDto;
  @ApiProperty({
    example: {
      itemCount: 3,
      subtotal: 1050,
      shipping: 35,
      total: 1085,
    },
  })
  cart!: {
    itemCount: number;
    subtotal: number;
    shipping: number;
    total: number;
  };
}

export class CartDeleteSuccessDto {
  @ApiProperty() success!: true;
  @ApiProperty({ type: CartResponseDto }) cart!: CartResponseDto;
}
