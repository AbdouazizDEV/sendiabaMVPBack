import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ORDERS_REPOSITORY } from './repositories/orders.repository.interface';
import { OrdersPrismaRepository } from './repositories/orders.prisma.repository';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: ORDERS_REPOSITORY,
      useClass: OrdersPrismaRepository,
    },
  ],
})
export class OrdersModule {}
