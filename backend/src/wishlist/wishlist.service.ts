import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirestoreService } from '../firebase/firestore.service';
import { WishlistItem } from './entities/wishlist-item.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class WishlistService {
  private readonly collection = 'wishlist_items';

  constructor(
    private firestoreService: FirestoreService,
    private productsService: ProductsService,
  ) {}

  async findAll(userId: string) {
    const items = await this.firestoreService.findManyByField<WishlistItem>(
      this.collection,
      'userId',
      userId,
    );

    // Load product details for each item
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        try {
          const product = await this.productsService.findOne(item.productId);
          return { ...item, product };
        } catch {
          return item;
        }
      })
    );

    return itemsWithProducts;
  }

  async addItem(userId: string, productId: string) {
    try {
      // Check if product exists
      const product = await this.productsService.findOne(productId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      // Check if item already exists in wishlist
      const existingItems = await this.firestoreService.findManyByField<WishlistItem>(
        this.collection,
        'userId',
        userId,
      );

      const existingItem = existingItems.find((item) => item.productId === productId);

      if (existingItem) {
        // Return with product relation loaded
        return { ...existingItem, product };
      }

      // Create new wishlist item
      const wishlistItem = await this.firestoreService.create<WishlistItem>(
        this.collection,
        {
          userId,
          productId,
        },
      );

      return { ...wishlistItem, product };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error adding item to wishlist:', error);
      throw new BadRequestException(
        error?.message || 'Failed to add item to wishlist. Please try again.',
      );
    }
  }

  async removeItem(userId: string, productId: string) {
    const items = await this.firestoreService.findManyByField<WishlistItem>(
      this.collection,
      'userId',
      userId,
    );

    const item = items.find((item) => item.productId === productId);

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.firestoreService.delete(this.collection, item.id);
  }
}
