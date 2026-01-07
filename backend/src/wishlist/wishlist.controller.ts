import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  findAll(@Request() req) {
    return this.wishlistService.findAll(req.user.userId);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Add product to wishlist' })
  async addItem(@Request() req, @Param('productId') productId: string) {
    try {
      return await this.wishlistService.addItem(req.user.userId, productId);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from wishlist' })
  removeItem(@Request() req, @Param('productId') productId: string) {
    return this.wishlistService.removeItem(req.user.userId, productId);
  }
}

