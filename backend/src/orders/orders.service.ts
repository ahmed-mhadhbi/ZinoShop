import { Injectable, NotFoundException, BadRequestException, HttpException } from '@nestjs/common';
import { FirestoreService } from '../firebase/firestore.service';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ProductsService } from '../products/products.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { getFirestore } from '../config/firebase.config';
import * as admin from 'firebase-admin';

@Injectable()
export class OrdersService {
  private readonly collection = 'orders';
  private _db: admin.firestore.Firestore | null = null;

  constructor(
    private firestoreService: FirestoreService,
    private productsService: ProductsService,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  private get db(): admin.firestore.Firestore {
    if (!this._db) {
      this._db = getFirestore();
    }
    return this._db;
  }

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required to create an order');
      }

      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const item of createOrderDto.items) {
        try {
          const product = await this.productsService.findOne(item.productId);
          
          if (!product) {
            throw new NotFoundException(`Product with ID ${item.productId} not found`);
          }

          if (!product.name || product.name.trim() === '') {
            throw new BadRequestException(
              `Product "${item.productId}" is missing a name. Please update this product in the admin panel.`
            );
          }

          const productName = String(product.name).trim();
          const productSku = (product.sku && product.sku.trim()) 
            ? String(product.sku).trim() 
            : `SKU-${product.id.substring(0, 8).toUpperCase()}`;
          const productPrice = Number(product.price) || 0;
          const availableVariants = Array.isArray(product.variants)
            ? product.variants.map((variant) => String(variant || '').trim()).filter(Boolean)
            : [];
          const selectedVariant = item.variant ? String(item.variant).trim() : undefined;

          if (availableVariants.length > 0 && !selectedVariant) {
            throw new BadRequestException(
              `La variante est obligatoire pour le produit "${productName}".`,
            );
          }

          if (selectedVariant && availableVariants.length > 0 && !availableVariants.includes(selectedVariant)) {
            throw new BadRequestException(
              `Variante invalide "${selectedVariant}" pour le produit "${productName}".`,
            );
          }

          const itemTotal = productPrice * item.quantity;
          subtotal += itemTotal;

          const orderItem: OrderItem = {
            id: '', // Will be set when saved
            orderId: '', // Will be set after order is created
            productId: String(item.productId),
            productName,
            productSku,
            price: productPrice,
            quantity: Number(item.quantity),
            createdAt: new Date(),
          };

          if (selectedVariant) {
            orderItem.variant = selectedVariant;
          }

          orderItems.push(orderItem);
        } catch (error) {
          console.error(`Error processing item ${item.productId}:`, error);
          throw error;
        }
      }

      const { items, ...dtoWithoutItems } = createOrderDto;
      const shippingFee = 8;
      const orderData = {
        ...dtoWithoutItems,
        userId,
        orderNumber: this.generateOrderNumber(),
        subtotal,
        shipping: shippingFee,
        total: subtotal + shippingFee,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      };
      // DO NOT include items here!
      const order = await this.firestoreService.create<Order>(this.collection, orderData);
      const normalizedOrderDate =
        order.createdAt instanceof Date && !isNaN(order.createdAt.getTime())
          ? order.createdAt
          : order.updatedAt instanceof Date && !isNaN(order.updatedAt.getTime())
          ? order.updatedAt
          : new Date();

      // Save order items as subcollection
      const orderItemsRef = this.db.collection(`${this.collection}/${order.id}/items`);
      const batch = this.db.batch();

      for (const item of orderItems) {
        const itemRef = orderItemsRef.doc();
        item.id = itemRef.id;
        item.orderId = order.id;
        batch.set(itemRef, this.omitUndefined({
          ...item,
          createdAt: admin.firestore.Timestamp.fromDate(item.createdAt),
        }));
      }

      await batch.commit();

      // Trigger emails asynchronously so checkout response is not blocked by SMTP latency.
      void this.sendOrderEmails(
        {
          ...order,
          createdAt: normalizedOrderDate,
          items: orderItems,
        } as Order & { items: OrderItem[] },
        userId,
        createOrderDto.paymentMethod,
      );

      return {
        ...order,
        createdAt: normalizedOrderDate,
        items: orderItems,
      } as Order & { items: OrderItem[] };
    } catch (error) {
      console.error('Error in OrdersService.create:', error);
      if (error instanceof HttpException || error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to create order. Please check your cart items and try again.'
      );
    }
  }

  async findAll(userId?: string, includeItems: boolean = true, limit: number = 50): Promise<Order[]> {
    const filters = userId 
      ? [{ field: 'userId', operator: '==', value: userId }]
      : undefined;

    const orders = await this.firestoreService.findAll<Order>(
      this.collection,
      filters,
      { field: 'createdAt', direction: 'desc' },
      limit,
    );

    const normalizedOrders = orders.map((order) => this.normalizeOrderDates(order));

    // Only load items if requested (for performance)
    if (!includeItems) {
      return normalizedOrders;
    }

    // Load items for each order (limit to avoid too many parallel requests)
    const ordersWithItems = await Promise.all(
      normalizedOrders.slice(0, 20).map(async (order) => {
        const itemsSnapshot = await this.db
          .collection(`${this.collection}/${order.id}/items`)
          .get();
        
        const items = itemsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as OrderItem;
        });

        return { ...order, items } as Order & { items: OrderItem[] };
      })
    );

    // For orders beyond the first 20, return without items
    const remainingOrders = normalizedOrders.slice(20).map(order => ({ ...order, items: [] } as Order & { items: OrderItem[] }));
    
    return [...ordersWithItems, ...remainingOrders];
  }

  async findPage(
    userId?: string,
    includeItems: boolean = false,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters = userId
      ? [{ field: 'userId', operator: '==', value: userId }]
      : undefined;

    const validPage = page > 0 && Number.isFinite(page) ? Math.floor(page) : 1;
    const validLimit = limit > 0 && Number.isFinite(limit) ? Math.min(Math.floor(limit), 50) : 20;

    const { items, total } = await this.firestoreService.findPage<Order>(
      this.collection,
      filters,
      validPage,
      validLimit,
      { field: 'createdAt', direction: 'desc' },
    );

    const normalizedOrders = items.map((order) => this.normalizeOrderDates(order));

    if (!includeItems) {
      return {
        orders: normalizedOrders,
        total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
      };
    }

    const ordersWithItems = await Promise.all(
      normalizedOrders.map(async (order) => {
        const itemsSnapshot = await this.db
          .collection(`${this.collection}/${order.id}/items`)
          .get();

        const orderItems = itemsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as OrderItem;
        });

        return { ...order, items: orderItems } as Order & { items: OrderItem[] };
      }),
    );

    return {
      orders: ordersWithItems,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async getStats(userId?: string): Promise<{ totalOrders: number; totalRevenue: number }> {
    let query: admin.firestore.Query = this.db.collection(this.collection);
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const countSnapshot = await query.count().get();
    const totalOrders = countSnapshot.data().count;

    let totalRevenue = 0;
    const aggregateField = (admin.firestore as any).AggregateField;
    if (aggregateField?.sum && typeof (query as any).aggregate === 'function') {
      const aggregateSnapshot = await (query as any)
        .aggregate({ totalRevenue: aggregateField.sum('total') })
        .get();
      totalRevenue = Number(aggregateSnapshot.data()?.totalRevenue || 0);
    } else {
      // Fallback for older SDK behavior: fetch only the "total" field.
      const totalsSnapshot = await query.select('total').get();
      totalRevenue = totalsSnapshot.docs.reduce(
        (sum, doc) => sum + (Number(doc.get('total')) || 0),
        0,
      );
    }

    return { totalOrders, totalRevenue };
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const foundOrder = await this.firestoreService.findById<Order>(this.collection, id);
    
    if (!foundOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const order = this.normalizeOrderDates(foundOrder);

    if (userId && order.userId !== userId) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Load order items
    const itemsSnapshot = await this.db
      .collection(`${this.collection}/${id}/items`)
      .get();
    
    const items = itemsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as OrderItem;
    });

    return { ...order, items } as Order & { items: OrderItem[] };
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.firestoreService.findById<Order>(this.collection, id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return this.firestoreService.update<Order>(this.collection, id, updateOrderDto);
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
  ): Promise<Order> {
    const updateData: any = { status };
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    return this.firestoreService.update<Order>(this.collection, id, updateData);
  }

  private generateOrderNumber(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  private normalizeOrderDates(order: Order): Order {
    const fallbackDate =
      order.updatedAt instanceof Date && !isNaN(order.updatedAt.getTime())
        ? order.updatedAt
        : new Date();

    const createdAt =
      order.createdAt instanceof Date && !isNaN(order.createdAt.getTime())
        ? order.createdAt
        : fallbackDate;

    const updatedAt =
      order.updatedAt instanceof Date && !isNaN(order.updatedAt.getTime())
        ? order.updatedAt
        : createdAt;

    return {
      ...order,
      createdAt,
      updatedAt,
    };
  }

  private omitUndefined<T extends Record<string, any>>(data: T): Record<string, any> {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
  }

  private async sendOrderEmails(
    order: Order & { items: OrderItem[] },
    userId: string,
    paymentMethod: string,
  ): Promise<void> {
    try {
      const user = await this.usersService.findOne(userId);
      if (!user || !('email' in user)) {
        return;
      }

      const customerEmail = (user as any).email;
      const customerName = `${(user as any).firstName} ${(user as any).lastName}`.trim();

      await this.emailService.sendOrderConfirmation(
        order as any,
        customerEmail,
        customerName,
      );

      if (paymentMethod === 'pay_on_delivery') {
        const usersCount = await this.usersService.count();
        await this.emailService.sendOrderNotificationToAdmin(
          order as any,
          customerEmail,
          customerName,
          usersCount,
        );
      }
    } catch (error) {
      console.error('Order email flow failed:', error);
    }
  }
}
