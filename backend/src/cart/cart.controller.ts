import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart items' })
  findAll(@Request() req) {
    return this.cartService.findAll(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addItem(req.user.userId, addToCartDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateQuantity(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateQuantity(
      req.user.userId,
      id,
      updateCartItemDto.quantity,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(@Request() req, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.userId, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }
}

