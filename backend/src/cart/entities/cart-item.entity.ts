// Plain TypeScript class for CartItem (Firebase/Firestore compatible)
export class CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}
