// Plain TypeScript class for Product (Firebase/Firestore compatible)
export enum ProductCategory {
  RINGS = 'Rings',
  NECKLACES = 'Necklaces',
  BRACELETS = 'Bracelets',
  EARRINGS = 'Earrings',
  PENDANTS = 'Pendants',
  OTHER = 'Other',
}

export enum ProductMaterial {
  GOLD = 'Gold',
  SILVER = 'Silver',
  PLATINUM = 'Platinum',
  PEARL = 'Pearl',
  DIAMOND = 'Diamond',
  OTHER = 'Other',
}

export class Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  sku: string;
  category: ProductCategory;
  material: ProductMaterial;
  images?: string[];
  stock: number;
  inStock: boolean;
  rating?: number;
  reviewCount: number;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}
