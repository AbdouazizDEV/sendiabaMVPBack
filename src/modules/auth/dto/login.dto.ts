import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'client@sendiaba.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Sendiaba2026!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
