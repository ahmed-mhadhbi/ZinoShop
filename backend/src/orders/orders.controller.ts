import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    try {
      console.log('Creating order:', JSON.stringify(createOrderDto, null, 2));
      console.log('User ID:', req.user?.userId);
      
      if (!req.user || !req.user.userId) {
        throw new HttpException('User authentication required', HttpStatus.UNAUTHORIZED);
      }

      return await this.ordersService.create(createOrderDto, req.user.userId);
    } catch (error) {
      console.error('Order creation error:', error);
      console.error('Error stack:', error.stack);
      
      // If it's already an HTTP exception, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Otherwise, wrap it with a detailed message
      const errorMessage = error.message || 'Failed to create order';
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
          error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders (user orders or all for admin)' })
  findAll(
    @Request() req,
    @Query('includeItems') includeItems?: string,
    @Query('limit') limit?: string,
  ) {
    // Admin can see all orders, users see only their orders
    const userId = req.user.role === 'admin' ? undefined : req.user.userId;
    const shouldIncludeItems = includeItems !== 'false';
    const parsedLimit = limit ? Number(limit) : 50;
    const validLimit = parsedLimit > 0 && parsedLimit <= 100 && !isNaN(parsedLimit) ? parsedLimit : 50;
    return this.ordersService.findAll(userId, shouldIncludeItems, validLimit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.role === 'admin' ? undefined : req.user.userId;
    return this.ordersService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order (Admin only)' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }
}

