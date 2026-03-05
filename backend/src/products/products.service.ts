import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FirestoreService } from '../firebase/firestore.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCategory, ProductMaterial } from './entities/product.entity';

@Injectable()
export class ProductsService {
  private readonly collection = 'products';
  private readonly maxFeaturedProducts = 4;
  private readonly listFields = [
    'id',
    'name',
    'price',
    'salePrice',
    'sku',
    'category',
    'material',
    'images',
    'image',
    'variants',
    'stock',
    'inStock',
    'rating',
    'reviewCount',
    'isActive',
    'isFeatured',
    'createdAt',
    'updatedAt',
  ];
  private readonly searchFields = [...this.listFields, 'description'];
  private readonly featuredFields = [
    'id',
    'name',
    'price',
    'images',
    'image',
    'variants',
    'rating',
    'reviewCount',
    'sku',
    'updatedAt',
    'createdAt',
  ];

  constructor(private firestoreService: FirestoreService) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    if (createProductDto.isFeatured === true) {
      await this.ensureFeaturedLimit();
    }

    // Auto-generate SKU if not provided
    if (!createProductDto.sku || createProductDto.sku.trim() === '') {
      const categoryPrefix = createProductDto.category.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      createProductDto.sku = `${categoryPrefix}-${timestamp}-${randomSuffix}`;
    }

    // Ensure name is not empty
    if (!createProductDto.name || createProductDto.name.trim() === '') {
      throw new BadRequestException('Product name is required');
    }

    const normalizedVariants = (createProductDto.variants || [])
      .map((variant) => String(variant || '').trim())
      .filter((variant) => variant.length > 0);

    let product: Product;
    try {
      product = await this.firestoreService.create<Product>(this.collection, {
        ...createProductDto,
        name: createProductDto.name.trim(),
        sku: createProductDto.sku.trim(),
        variants: Array.from(new Set(normalizedVariants)),
        stock: createProductDto.stock || 0,
        inStock: (createProductDto.stock || 0) > 0,
        isActive: createProductDto.isActive !== undefined ? createProductDto.isActive : true,
        isFeatured: createProductDto.isFeatured === true,
        rating: 0,
        reviewCount: 0,
      });
    } catch (error: any) {
      const message = error?.message || 'Unknown Firestore error';
      console.error('Failed to create product:', message);

      if (message.includes('maximum size') || message.includes('too large')) {
        throw new BadRequestException('Product data is too large. Please use smaller images.');
      }

      if (message.includes('Cannot use "undefined" as a Firestore value')) {
        throw new BadRequestException('Invalid product payload. Some fields are undefined.');
      }

      throw new InternalServerErrorException('Failed to create product');
    }

    this.invalidateFeaturedCache();
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
    const validPage = page > 0 && Number.isFinite(page) ? Math.floor(page) : 1;
    const validLimit = limit > 0 && Number.isFinite(limit) ? Math.min(Math.floor(limit), 50) : 20;

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

    const trimmedSearch = search?.trim();
    const hasSearch = Boolean(trimmedSearch);

    if (!hasSearch) {
      try {
        const { items, total } = await this.firestoreService.findPage<Product>(
          this.collection,
          filters,
          validPage,
          validLimit,
          { field: 'createdAt', direction: 'desc' },
          this.listFields,
        );
        return {
          products: items,
          total,
          page: validPage,
          limit: validLimit,
          totalPages: Math.ceil(total / validLimit),
        };
      } catch (error) {
        // Fallback when the requested ordered query needs a missing composite index.
        // Keep "newest first" behavior by sorting in memory.
        const allProducts = await this.firestoreService.findAll<Product>(
          this.collection,
          filters,
          undefined,
          undefined,
          this.listFields,
        );
        allProducts.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return bDate - aDate;
        });

        const total = allProducts.length;
        const startIndex = (validPage - 1) * validLimit;
        const endIndex = startIndex + validLimit;
        const items = allProducts.slice(startIndex, endIndex);

        return {
          products: items,
          total,
          page: validPage,
          limit: validLimit,
          totalPages: Math.ceil(total / validLimit),
        };
      }
    }

    // Search requires in-memory filtering because Firestore has no full-text search.
    let allProducts = await this.firestoreService.findAll<Product>(
      this.collection,
      filters,
      undefined,
      undefined,
      this.searchFields,
    );

    allProducts.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    const searchLower = trimmedSearch!.toLowerCase();
    allProducts = allProducts.filter(
      (product) =>
        String(product.name || '')
          .toLowerCase()
          .includes(searchLower) ||
        String(product.description || '')
          .toLowerCase()
          .includes(searchLower),
    );

    const total = allProducts.length;
    const totalPages = Math.ceil(total / validLimit);
    const startIndex = (validPage - 1) * validLimit;
    const endIndex = startIndex + validLimit;
    const products = allProducts.slice(startIndex, endIndex);

    return {
      products,
      total,
      page: validPage,
      limit: validLimit,
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
    const normalizedUpdate: UpdateProductDto & { inStock?: boolean } = { ...updateProductDto };
    const currentIsFeatured = Boolean(product.isFeatured);
    const nextIsFeatured =
      updateProductDto.isFeatured !== undefined
        ? updateProductDto.isFeatured === true
        : currentIsFeatured;

    if (!currentIsFeatured && nextIsFeatured) {
      await this.ensureFeaturedLimit(id);
    }

    if (Array.isArray(updateProductDto.variants)) {
      normalizedUpdate.variants = Array.from(
        new Set(
          updateProductDto.variants
            .map((variant) => String(variant || '').trim())
            .filter((variant) => variant.length > 0),
        ),
      );
    }
    if (typeof updateProductDto.stock === 'number' && Number.isFinite(updateProductDto.stock)) {
      normalizedUpdate.inStock = updateProductDto.stock > 0;
    }
    if (updateProductDto.isFeatured !== undefined) {
      normalizedUpdate.isFeatured = updateProductDto.isFeatured === true;
    }

    const updatedProduct = await this.firestoreService.update<Product>(this.collection, id, normalizedUpdate);
    this.invalidateFeaturedCache();
    return updatedProduct;
  }

  async remove(id: string): Promise<void> {
    const product = await this.firestoreService.findById<Product>(this.collection, id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.firestoreService.delete(this.collection, id);
    this.invalidateFeaturedCache();
  }

  private featuredCache: { data: Product[]; expiresAt: number } | null = null;
  private featuredCachePromise: Promise<Product[]> | null = null;

  async getFeatured(): Promise<Product[]> {
    const ttlSeconds = Number(process.env.FEATURED_CACHE_TTL_SECONDS ?? 60);

    const now = Date.now();
    if (this.featuredCache && this.featuredCache.expiresAt > now) {
      return this.featuredCache.data
    }

    // If a fetch is already in progress, await it to deduplicate concurrent calls
    if (this.featuredCachePromise) {
      return this.featuredCachePromise
    }

    // Fetch and cache
    this.featuredCachePromise = (async () => {
      let featured: Product[] = [];

      try {
        featured = await this.firestoreService.findAll<Product>(
          this.collection,
          [
            { field: 'isActive', operator: '==', value: true },
            { field: 'isFeatured', operator: '==', value: true },
          ],
          { field: 'updatedAt', direction: 'desc' },
          this.maxFeaturedProducts,
          this.featuredFields,
        );
      } catch {
        // Fallback for environments missing the required Firestore index.
        const products = await this.firestoreService.findAll<Product>(
          this.collection,
          [
            { field: 'isActive', operator: '==', value: true },
            { field: 'isFeatured', operator: '==', value: true },
          ],
          undefined,
          undefined,
          this.featuredFields,
        );
        featured = products
          .sort((a, b) => this.getDateValue(b.updatedAt ?? b.createdAt) - this.getDateValue(a.updatedAt ?? a.createdAt))
          .slice(0, this.maxFeaturedProducts);
      }

      featured = featured.slice(0, this.maxFeaturedProducts);

      // Fallback: if no products are explicitly featured yet,
      // show active products so homepage never appears empty.
      if (featured.length === 0) {
        try {
          featured = await this.firestoreService.findAll<Product>(
            this.collection,
            [{ field: 'isActive', operator: '==', value: true }],
            { field: 'updatedAt', direction: 'desc' },
            this.maxFeaturedProducts,
            this.featuredFields,
          );
        } catch {
          const activeProducts = await this.firestoreService.findAll<Product>(
            this.collection,
            [{ field: 'isActive', operator: '==', value: true }],
            undefined,
            undefined,
            this.featuredFields,
          );
          featured = activeProducts
            .sort((a, b) => this.getDateValue(b.updatedAt ?? b.createdAt) - this.getDateValue(a.updatedAt ?? a.createdAt))
            .slice(0, this.maxFeaturedProducts);
        }
      }

      this.featuredCache = { data: featured, expiresAt: Date.now() + ttlSeconds * 1000 }
      return featured
    })().finally(() => {
      this.featuredCachePromise = null
    })

    return this.featuredCachePromise
  }

  private async ensureFeaturedLimit(currentProductId?: string): Promise<void> {
    const featuredProducts = await this.firestoreService.findAll<Product>(
      this.collection,
      [{ field: 'isFeatured', operator: '==', value: true }],
      undefined,
      undefined,
      ['id'],
    );

    const selectedCount = featuredProducts.filter((featuredProduct) => featuredProduct.id !== currentProductId).length;

    if (selectedCount >= this.maxFeaturedProducts) {
      throw new BadRequestException(`Vous pouvez selectionner au maximum ${this.maxFeaturedProducts} produits en vedette.`);
    }
  }

  private getDateValue(value: unknown): number {
    const parsedDate = value instanceof Date ? value : new Date(value as any);
    return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
  }

  private invalidateFeaturedCache(): void {
    this.featuredCache = null;
    this.featuredCachePromise = null;
  }
}
