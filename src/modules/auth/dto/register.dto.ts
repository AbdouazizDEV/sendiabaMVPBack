import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'new-user@sendiaba.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Sendiaba2026!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Aicha Ndiaye' })
  @IsString()
  @MinLength(2)
  displayName!: string;
}
