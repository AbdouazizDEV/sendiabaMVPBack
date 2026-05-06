import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class HomepageFeaturedArtisanAdminItemDto {
  @ApiProperty() sortOrder!: number;
  @ApiProperty({
    description: 'Identifiant public (ex. usr_4012), utilisable dans le catalogue',
  })
  publicId!: string;

  @ApiProperty({ description: 'Identifiant utilisateur (cuid)' })
  userId!: string;

  @ApiProperty() displayName!: string;
  @ApiProperty() referenceCode!: string;

  @ApiProperty({ nullable: true }) craft!: string | null;
  @ApiProperty({ nullable: true }) city!: string | null;
  @ApiProperty({ nullable: true }) avatarUrl!: string | null;
}

export class HomepageFeaturedArtisansListResponseDto {
  @ApiProperty({ type: [HomepageFeaturedArtisanAdminItemDto] })
  items!: HomepageFeaturedArtisanAdminItemDto[];
}

export class SetHomepageFeaturedArtisansDto {
  @ApiProperty({
    type: [String],
    description:
      'Ordre = ordre d’affichage. Accepte id cuid, referenceCode (USR-…), id public usr_… ou legacy a1.',
    example: ['usr_4012', 'USR-5003'],
  })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  artisanIds!: string[];
}

export class SetHomepageFeaturedArtisansResponseDto {
  @ApiProperty() success!: boolean;
  @ApiProperty() message!: string;
  @ApiProperty({ type: [HomepageFeaturedArtisanAdminItemDto] })
  items!: HomepageFeaturedArtisanAdminItemDto[];
}
