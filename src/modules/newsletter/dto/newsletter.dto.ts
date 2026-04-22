import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateNewsletterSubscriptionDto {
  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'home_newsletter', required: false })
  @IsOptional()
  @IsString()
  source?: string;
}

export class NewsletterSubscriptionDataDto {
  @ApiProperty({ example: 'nl_01JXYZ' })
  subscriptionId!: string;

  @ApiProperty({ example: 'subscribed' })
  status!: string;

  @ApiProperty({ example: '2026-04-16T21:30:00Z' })
  createdAt!: string;
}

export class CreateNewsletterSubscriptionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Inscription enregistree avec succes.' })
  message!: string;

  @ApiProperty({ type: NewsletterSubscriptionDataDto })
  data!: NewsletterSubscriptionDataDto;
}
