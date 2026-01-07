import { DataSource } from 'typeorm';
import { Product } from '../src/products/entities/product.entity';
import { User } from '../src/users/entities/user.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/order-item.entity';
import { CartItem } from '../src/cart/entities/cart-item.entity';
import { WishlistItem } from '../src/wishlist/entities/wishlist-item.entity';
import { BlogPost } from '../src/blog/entities/blog-post.entity';

const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: './zinoshop.db',
  entities: [Product, User, Order, OrderItem, CartItem, WishlistItem, BlogPost],
  synchronize: false,
});

async function fixProducts() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const productRepository = AppDataSource.getRepository(Product);

    // Get ALL products first to check them
    const allProducts = await productRepository.find();
    console.log(`Total products in database: ${allProducts.length}`);

    // Find products with null or empty names
    const productsWithNullNames = allProducts.filter(p => 
      !p.name || 
      p.name === null || 
      p.name === undefined || 
      p.name.trim() === '' ||
      p.name === 'null' ||
      p.name === 'undefined'
    );

    console.log(`Found ${productsWithNullNames.length} products with null/empty names`);
    
    // Log all products for debugging
    console.log('\nAll products:');
    allProducts.forEach(p => {
      console.log(`  - ID: ${p.id}, Name: "${p.name}" (type: ${typeof p.name}), SKU: "${p.sku}"`);
    });

    for (const product of productsWithNullNames) {
      console.log(`Fixing product: ${product.id}`);
      
      // Generate a name based on category and ID if name is missing
      const categoryName = product.category || 'Product';
      const productName = `${categoryName} ${product.id.substring(0, 8).toUpperCase()}`;
      
      // Generate SKU if missing
      let sku = product.sku;
      if (!sku || sku.trim() === '') {
        const categoryPrefix = (product.category || 'PROD').substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        sku = `${categoryPrefix}-${timestamp}-${randomSuffix}`;
      }

      product.name = productName;
      product.sku = sku;
      
      if (!product.price || product.price === 0) {
        product.price = 0; // Set default price
      }

      await productRepository.save(product);
      console.log(`✅ Fixed product ${product.id}: name="${productName}", sku="${sku}"`);
    }

    // Also check for products with null SKU
    const productsWithNullSku = await productRepository
      .createQueryBuilder('product')
      .where('product.sku IS NULL OR product.sku = :emptyString', {
        emptyString: '',
      })
      .getMany();

    console.log(`Found ${productsWithNullSku.length} products with null/empty SKU`);

    for (const product of productsWithNullSku) {
      if (!product.sku || product.sku.trim() === '') {
        const categoryPrefix = (product.category || 'PROD').substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        product.sku = `${categoryPrefix}-${timestamp}-${randomSuffix}`;
        await productRepository.save(product);
        console.log(`✅ Fixed SKU for product ${product.id}: ${product.sku}`);
      }
    }

    console.log('\n✅ All products fixed!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error fixing products:', error);
    process.exit(1);
  }
}

fixProducts();

