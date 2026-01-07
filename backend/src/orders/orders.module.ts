import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { FirestoreService } from '../firebase/firestore.service';
import { ProductsModule } from '../products/products.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ProductsModule,
    EmailModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, FirestoreService],
  exports: [OrdersService],
})
export class OrdersModule {}
