import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  BackofficeUserDto,
  BackofficeUsersListResponseDto,
  BackofficeUsersQueryDto,
  UpdateBackofficeUserRoleDto,
  UpdateBackofficeUserRoleResponseDto,
} from './dto/backoffice-users.dto';
import { BackofficeUsersService } from './backoffice-users.service';

@ApiTags('Backoffice Users')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('backoffice/users')
export class BackofficeUsersController {
  constructor(private readonly backofficeUsersService: BackofficeUsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les utilisateurs',
    description:
      'alimente le tableau principal avec filtres search, role, status et pagination',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false, example: 'Client' })
  @ApiQuery({ name: 'status', required: false, example: 'Actif' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ type: BackofficeUsersListResponseDto })
  async list(
    @Query() query: BackofficeUsersQueryDto,
  ): Promise<BackofficeUsersListResponseDto> {
    return this.backofficeUsersService.list(query);
  }

  @Get(':userId')
  @ApiParam({ name: 'userId', example: 'USR-4012' })
  @ApiOperation({
    summary: "Détail d'un utilisateur",
    description:
      'récupère les informations affichées dans la modale de détail (référence USR-xxxx ou id interne)',
  })
  @ApiOkResponse({ type: BackofficeUserDto })
  async findOne(@Param('userId') userId: string): Promise<BackofficeUserDto> {
    return this.backofficeUsersService.findOne(userId);
  }

  @Patch(':userId/role')
  @ApiParam({ name: 'userId', example: 'USR-4012' })
  @ApiOperation({
    summary: "Promouvoir un utilisateur en artisan",
    description:
      "met a jour le role d'un utilisateur de CUSTOMER vers ARTISAN (action backoffice admin)",
  })
  @ApiBody({ type: UpdateBackofficeUserRoleDto })
  @ApiOkResponse({ type: UpdateBackofficeUserRoleResponseDto })
  async updateRole(
    @Param('userId') userId: string,
    @Body() _dto: UpdateBackofficeUserRoleDto,
  ): Promise<UpdateBackofficeUserRoleResponseDto> {
    return this.backofficeUsersService.promoteToArtisan(userId);
  }
}
