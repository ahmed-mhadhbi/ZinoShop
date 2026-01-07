import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirestoreService } from '../firebase/firestore.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCategory, ProductMaterial } from './entities/product.entity';

@Injectable()
export class ProductsService {
  private readonly collection = 'products';

  constructor(private firestoreService: FirestoreService) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Auto-generate SKU if not provided
    if (!createProductDto.sku || createProductDto.sku.trim() === '') {
      const categoryPrefix = createProductDto.category.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      createProductDto.sku = `${categoryPrefix}-${timestamp}-${randomSuffix}`;
      console.log(`Auto-generated SKU: ${createProductDto.sku}`);
    }

    // Ensure name is not empty
    if (!createProductDto.name || createProductDto.name.trim() === '') {
      throw new BadRequestException('Product name is required');
    }

    const product = await this.firestoreService.create<Product>(this.collection, {
      ...createProductDto,
      name: createProductDto.name.trim(),
      sku: createProductDto.sku.trim(),
      stock: createProductDto.stock || 0,
      inStock: (createProductDto.stock || 0) > 0,
      isActive: createProductDto.isActive !== undefined ? createProductDto.isActive : true,
      rating: 0,
      reviewCount: 0,
    });

    return product;
  }

  async findAll(
    category?: ProductCategory,
    material?: ProductMaterial,
    search?: string,
    minPrice?: number,
    maxPrice?: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const filters: Array<{ field: string; operator: any; value: any }> = [
      { field: 'isActive', operator: '==', value: true },
    ];

    if (category) {
      filters.push({ field: 'category', operator: '==', value: category });
    }

    if (material) {
      filters.push({ field: 'material', operator: '==', value: material });
    }

    if (minPrice !== undefined && !isNaN(minPrice) && isFinite(minPrice)) {
      filters.push({ field: 'price', operator: '>=', value: minPrice });
    }

    if (maxPrice !== undefined && !isNaN(maxPrice) && isFinite(maxPrice)) {
      filters.push({ field: 'price', operator: '<=', value: maxPrice });
    }

    // Get all products for filtering (needed for search and total count)
    // Note: We don't use orderBy in Firestore query to avoid index requirements
    // Instead, we'll sort in memory after fetching
    let allProducts = await this.firestoreService.findAll<Product>(
      this.collection,
      filters,
      undefined, // No orderBy to avoid index requirement
    );

    // Sort by createdAt descending (newest first) in memory
    allProducts.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return bDate - aDate; // Descending order (newest first)
    });

    // Firestore doesn't support full-text search, so we filter in memory
    if (search) {
      const searchLower = search.toLowerCase();
      allProducts = allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower),
      );
    }

    const total = allProducts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const products = allProducts.slice(startIndex, endIndex);

    return {
      products,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.firestoreService.findById<Product>(this.collection, id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.firestoreService.findById<Product>(this.collection, id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.firestoreService.update<Product>(this.collection, id, updateProductDto);
  }

  async remove(id: string): Promise<void> {
    await this.firestoreService.delete(this.collection, id);
  }

  async getFeatured(): Promise<Product[]> {
    // Fetch all active products, then sort by rating in memory to avoid index requirement
    const products = await this.firestoreService.findAll<Product>(
      this.collection,
      [{ field: 'isActive', operator: '==', value: true }],
      undefined, // No orderBy to avoid index requirement
    );
    
    // Sort by rating descending and take top 8
    return products
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);
  }
}
