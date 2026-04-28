import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ArtisanMeResponseDto } from './dto/artisan-space.dto';
import { ArtisanProfileService } from './artisan-profile.service';

@ApiTags('Artisan Space')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ARTISAN)
@Controller('artisan')
export class ArtisanProfileController {
  constructor(private readonly service: ArtisanProfileService) {}

  @Get('me')
  @ApiOperation({ summary: "Profil de l'artisan connecté" })
  @ApiOkResponse({ type: ArtisanMeResponseDto })
  async me(@CurrentUser() user: User) {
    return this.service.me(user);
  }
}
