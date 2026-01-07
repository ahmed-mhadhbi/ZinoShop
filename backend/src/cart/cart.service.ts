import { Injectable } from '@nestjs/common';
import { FirestoreService } from '../firebase/firestore.service';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { ProductsService } from '../products/products.service';
import { getFirestore } from '../config/firebase.config';

@Injectable()
export class CartService {
  private readonly collection = 'cart_items';
  private _db: ReturnType<typeof getFirestore> | null = null;

  constructor(
    private firestoreService: FirestoreService,
    private productsService: ProductsService,
  ) {}

  private get db(): ReturnType<typeof getFirestore> {
    if (!this._db) {
      this._db = getFirestore();
    }
    return this._db;
  }

  async findAll(userId: string) {
    const items = await this.firestoreService.findManyByField<CartItem>(
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

  async addItem(userId: string, addToCartDto: AddToCartDto) {
    const existingItems = await this.firestoreService.findManyByField<CartItem>(
      this.collection,
      'userId',
      userId,
    );

    const existingItem = existingItems.find(
      (item) => item.productId === addToCartDto.productId,
    );

    if (existingItem) {
      const updatedQuantity = existingItem.quantity + addToCartDto.quantity;
      return this.firestoreService.update<CartItem>(this.collection, existingItem.id, {
        quantity: updatedQuantity,
      });
    }

    return this.firestoreService.create<CartItem>(this.collection, {
      userId,
      productId: addToCartDto.productId,
      quantity: addToCartDto.quantity,
    });
  }

  async updateQuantity(userId: string, itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(userId, itemId);
    }

    const item = await this.firestoreService.findById<CartItem>(this.collection, itemId);
    if (!item || item.userId !== userId) {
      throw new Error('Cart item not found');
    }

    return this.firestoreService.update<CartItem>(this.collection, itemId, { quantity });
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.firestoreService.findById<CartItem>(this.collection, itemId);
    if (!item || item.userId !== userId) {
      throw new Error('Cart item not found');
    }
    await this.firestoreService.delete(this.collection, itemId);
  }

  async clearCart(userId: string) {
    const items = await this.firestoreService.findManyByField<CartItem>(
      this.collection,
      'userId',
      userId,
    );

    const batch = this.db.batch();
    items.forEach((item) => {
      const ref = this.db.collection(this.collection).doc(item.id);
      batch.delete(ref);
    });
    await batch.commit();
  }
}
