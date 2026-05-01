import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { DexpayService } from './dexpay.service';
import { OrdersService } from './orders.service';
import { ORDERS_REPOSITORY } from './repositories/orders.repository.interface';
import { OrdersPrismaRepository } from './repositories/orders.prisma.repository';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    DexpayService,
    {
      provide: ORDERS_REPOSITORY,
      useClass: OrdersPrismaRepository,
    },
  ],
})
export class OrdersModule {}
