// Plain TypeScript class for OrderItem (Firebase/Firestore compatible)
export class OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  price: number;
  createdAt: Date;
}
