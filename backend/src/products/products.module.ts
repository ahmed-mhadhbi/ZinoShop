import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { FirestoreService } from '../firebase/firestore.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, FirestoreService],
  exports: [ProductsService],
})
export class ProductsModule {}
