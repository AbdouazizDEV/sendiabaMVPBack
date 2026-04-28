import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ArtisanCustomersListResponseDto,
  ArtisanCustomersQueryDto,
} from './dto/artisan-space.dto';
import { ArtisanCustomersService } from './artisan-customers.service';

@ApiTags('Artisan Space')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ARTISAN)
@Controller('artisan/customers')
export class ArtisanCustomersController {
  constructor(private readonly service: ArtisanCustomersService) {}

  @Get()
  @ApiOperation({ summary: "Lister les clients de l'artisan (ayant commandé au moins un produit)" })
  @ApiOkResponse({ type: ArtisanCustomersListResponseDto })
  async list(@CurrentUser() user: User, @Query() query: ArtisanCustomersQueryDto) {
    return this.service.list(user, query);
  }
}
