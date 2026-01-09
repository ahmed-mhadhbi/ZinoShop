# ZinoShop - Luxury Jewelry E-commerce Platform

A modern, full-stack e-commerce platform for luxury jewelry built with Next.js and NestJS.

## Features


### User-Facing Features
- 🏠 Beautiful homepage with hero banner, featured products, and testimonials
- 🛍️ Product listing with advanced filtering and sorting
- 📱 Product detail pages with image gallery
- 🛒 Shopping cart with persistent storage
- 💳 Secure checkout with multiple payment options
- 👤 User accounts with order history and wishlist
- 🔍 Advanced search functionality
- 📝 Blog section for style tips and care guides
- 📞 Contact and support pages

### Admin Features
- 📦 Product management (CRUD operations)
- 📊 Order management and tracking
- 👥 Customer management
- 📈 Sales analytics
- 🎫 Discount and promotion management

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT
- **API Documentation**: Swagger
- **Payments**: Stripe integration
- **File Storage**: Cloudinary (configured)
- **Email**: SendGrid (configured)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- (Optional) Cloudinary account for image storage
- (Optional) Stripe account for payments
- (Optional) SendGrid account for emails

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ZinoShop
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
cd ..
```



6. **Run the development servers**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
npm run backend:dev
```

The frontend will be available at `http://localhost:3000`
The backend API will be available at `https://zinoshop.onrender.com/`
API documentation (Swagger) at `https://zinoshop.onrender.com/api/docs`

### Deployment notes
- Frontend (Vercel/Netlify/etc.): set environment variable `NEXT_PUBLIC_API_URL` to `https://zinoshop.onrender.com` and redeploy the frontend.
- Backend (Render): set `FRONTEND_URL` to your frontend URL (e.g., `https://<your-frontend>.vercel.app`) and ensure the service uses the production start command `npm run start:prod` and a build command `npm run build`.
- If you run into memory OOM on Render during build or start, add `NODE_OPTIONS=--max_old_space_size=4096` to Render's environment variables or increase the instance size.

- If you see clients still calling `localhost:3001` after frontend redeploy, the browser may be serving an old cached build from a service worker. Clear it by going to DevTools → Application → Service Workers → Unregister, then hard-refresh. Alternatively, run in the Console:

```js
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
```

After clearing, reload the page so the new build and service worker take effect.

Quick health check

- From your local machine you can verify the deployed backend quickly:

```bash
# Uses NEXT_PUBLIC_API_URL env if set, otherwise defaults to https://zinoshop.onrender.com
npm run check:deploy
```

This will hit `/api/health` and exit non-zero if the service is unreachable or times out.

## Project Structure

```
ZinoShop/
├── app/                    # Next.js app directory
│   ├── products/          # Product pages
│   ├── cart/              # Cart page
│   ├── checkout/          # Checkout page
│   └── ...
├── components/            # React components
│   ├── layout/            # Navbar, Footer
│   ├── home/              # Homepage components
│   └── products/          # Product components
├── store/                 # Zustand stores
├── backend/               # NestJS backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # User management
│   │   ├── products/      # Product management
│   │   ├── orders/        # Order management
│   │   ├── cart/          # Shopping cart
│   │   ├── wishlist/      # Wishlist
│   │   ├── payments/      # Payment processing
│   │   └── blog/          # Blog posts
│   └── ...
└── ...
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PATCH /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `PATCH /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove cart item
- `DELETE /api/cart` - Clear cart

### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist/:productId` - Add to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist

See full API documentation at `/api/docs` when the backend is running.

## Payment Integration

The platform supports multiple payment methods:
- Credit/Debit Cards (via Stripe)
- PayPal
- E-Dinar
- Bank-issued MasterCard/Visa

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers
- Rate limiting (configured)

## Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy to your preferred platform
3. Set environment variables

### Backend
1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations: `npm run migration:run`
4. Deploy to your server (AWS, DigitalOcean, etc.)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License

## Support

For support, email info@zinoshop.com or open an issue in the repository.

