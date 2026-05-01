import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CheckoutInputDto {
  @ApiProperty() @IsString() @IsNotEmpty() fullName!: string;
  @ApiProperty() @IsString() @IsNotEmpty() phone!: string;
  @ApiProperty() @IsString() @IsNotEmpty() country!: string;
  @ApiProperty() @IsString() @IsNotEmpty() city!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() district?: string;
  @ApiProperty() @IsString() @IsNotEmpty() addressLine!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() postalCode?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
  @ApiProperty({ enum: ['mobile_money', 'card', 'bank_transfer'] })
  @IsString()
  @IsIn(['mobile_money', 'card', 'bank_transfer'])
  paymentMethod!: 'mobile_money' | 'card' | 'bank_transfer';
}

export class CreateOrderBodyDto {
  @ApiProperty({ type: CheckoutInputDto })
  @ValidateNested()
  @Type(() => CheckoutInputDto)
  checkout!: CheckoutInputDto;
}

export class CreatedOrderLineDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true }) productImage!: string | null;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() quantity!: number;
}

export class CreatedOrderCheckoutDto {
  @ApiProperty() fullName!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() country!: string;
  @ApiProperty() city!: string;
  @ApiProperty({ nullable: true }) district!: string | null;
  @ApiProperty() addressLine!: string;
  @ApiProperty({ nullable: true }) postalCode!: string | null;
  @ApiProperty({ nullable: true }) notes!: string | null;
  @ApiProperty({ enum: ['mobile_money', 'card', 'bank_transfer'] })
  paymentMethod!: 'mobile_money' | 'card' | 'bank_transfer';
}

export class CreatedOrderDataDto {
  @ApiProperty({ example: 'cmd_x8a91k2p' }) id!: string;
  @ApiProperty({ example: 'usr_4012' }) userId!: string;
  @ApiProperty({
    example: 'in_preparation',
    enum: [
      'pending',
      'confirmed',
      'in_preparation',
      'shipped',
      'delivered',
      'cancelled',
    ],
  })
  status!:
    | 'pending'
    | 'confirmed'
    | 'in_preparation'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  @ApiProperty() createdAt!: string;
  @ApiProperty({ type: [CreatedOrderLineDto] }) lines!: CreatedOrderLineDto[];
  @ApiProperty() subtotal!: number;
  @ApiProperty() shippingFee!: number;
  @ApiProperty() total!: number;
  @ApiProperty({ type: CreatedOrderCheckoutDto }) checkout!: CreatedOrderCheckoutDto;
}

export class CreateOrderSuccessDto {
  @ApiProperty() success!: true;
  @ApiProperty({ type: CreatedOrderDataDto }) data!: CreatedOrderDataDto;
}

export class CreateCheckoutSessionSuccessDto {
  @ApiProperty() success!: true;
  @ApiProperty({
    example: {
      reference: 'PAY_1710000000000_ab12cd',
      paymentUrl: 'https://checkout.dexpay.africa/...',
      status: 'pending',
    },
  })
  data!: {
    reference: string;
    paymentUrl: string;
    status: 'pending';
  };
}

export class OrderTrackingResponseDto {
  @ApiProperty({
    example: {
      orderId: 'cmd_x8a91k2p',
      timeline: [
        { status: 'pending', note: 'Commande créée', at: '2026-04-29T20:00:00.000Z' },
      ],
    },
  })
  data!: {
    orderId: string;
    timeline: { status: string; note: string | null; at: string }[];
  };
}

export class ClientNotificationsResponseDto {
  @ApiProperty({
    example: {
      items: [
        {
          orderId: 'cmd_x8a91k2p',
          status: 'confirmed',
          note: 'Commande validée',
          at: '2026-04-29T20:00:00.000Z',
        },
      ],
    },
  })
  data!: {
    items: { orderId: string; status: string; note: string | null; at: string }[];
  };
}
