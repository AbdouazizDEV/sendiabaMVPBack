import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** Query pour GET /payment-providers DEXPAY (proxy). */
export class PaymentProvidersQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiProperty({ required: false, example: 'SN', description: 'Filtre pays (SN, CI, CM, …)' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, enum: ['active', 'inactive'], default: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiProperty({ required: false, enum: ['mobile_money', 'card'] })
  @IsOptional()
  @IsIn(['mobile_money', 'card'])
  type?: 'mobile_money' | 'card';
}

export class PaymentAttemptCustomerDto {
  @ApiProperty({ example: 'Amadou Diallo' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+221771234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  email!: string;
}

/** Corps pour POST checkout-sessions/{reference}/transaction-attempt — voir doc DEXPAY. */
export class CreatePaymentAttemptBodyDto {
  @ApiProperty({ enum: ['mobile_money', 'card'] })
  @IsIn(['mobile_money', 'card'])
  payment_method!: 'mobile_money' | 'card';

  @ApiProperty({
    example: 'wave_sn',
    description: 'provider_short_name retourné par GET /orders/payments/providers',
  })
  @IsString()
  @IsNotEmpty()
  operator!: string;

  @ApiProperty({ type: PaymentAttemptCustomerDto })
  @ValidateNested()
  @Type(() => PaymentAttemptCustomerDto)
  customer!: PaymentAttemptCustomerDto;

  @ApiProperty({ example: 'SN' })
  @IsString()
  @IsNotEmpty()
  countryISO!: string;
}

export class PaymentProvidersSuccessDto {
  @ApiProperty({ example: true }) success!: true;
  @ApiProperty({
    description: 'Réponse DEXPAY (data, hasNextPage, …)',
    example: {
      data: [
        {
          provider_name: 'Wave',
          provider_short_name: 'wave_sn',
          provider_type: 'mobile_money',
        },
      ],
      hasNextPage: false,
    },
  })
  data!: unknown;
}

export class CreatePaymentAttemptSuccessDto {
  @ApiProperty({ example: true }) success!: true;
  @ApiProperty({ description: 'Réponse DEXPAY (cashout_url, status, …)' })
  data!: unknown;
}
