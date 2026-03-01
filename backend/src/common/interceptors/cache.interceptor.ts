import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    
    // Set cache headers for GET requests
    const request = context.switchToHttp().getRequest();
    if (request.method === 'GET') {
      // Don't cache if cache-busting parameter is present or if it's an admin request
      const hasCacheBust = request.query?._t || request.query?.nocache;
      const isAdminRequest = request.headers?.authorization; // Admin requests have auth token
      
      if (hasCacheBust || isAdminRequest) {
        // No cache for admin or cache-busted requests
        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.setHeader('Pragma', 'no-cache');
        response.setHeader('Expires', '0');
      } else {
        const isFeaturedProducts = request.path?.includes('/products/featured');
        if (isFeaturedProducts) {
          response.setHeader(
            'Cache-Control',
            'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
          );
        } else {
          response.setHeader(
            'Cache-Control',
            'public, max-age=60, s-maxage=120, stale-while-revalidate=120',
          );
        }
      }
    }
    
    return next.handle();
  }
}

