import { Module } from '@nestjs/common';
import { BackofficeUsersController } from './backoffice-users.controller';
import { BackofficeUsersService } from './backoffice-users.service';
import { BACKOFFICE_USERS_REPOSITORY } from './repositories/backoffice-users.repository.interface';
import { BackofficeUsersPrismaRepository } from './repositories/backoffice-users.prisma.repository';

@Module({
  controllers: [BackofficeUsersController],
  providers: [
    BackofficeUsersService,
    {
      provide: BACKOFFICE_USERS_REPOSITORY,
      useClass: BackofficeUsersPrismaRepository,
    },
  ],
})
export class BackofficeUsersModule {}
