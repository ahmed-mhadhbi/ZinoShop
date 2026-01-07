import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { FirestoreService } from '../firebase/firestore.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [WishlistController],
  providers: [WishlistService, FirestoreService],
  exports: [WishlistService],
})
export class WishlistModule {}
