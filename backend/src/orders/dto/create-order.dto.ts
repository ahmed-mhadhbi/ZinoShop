import {
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/order.entity';

class OrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  variant?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty()
  @IsString()
  customerFirstName: string;

  @ApiProperty()
  @IsString()
  customerLastName: string;

  @ApiProperty()
  @IsString()
  shippingAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingCity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingState?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingZipCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingCountry?: string;

  @ApiProperty()
  @IsString()
  shippingPhone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shipping?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

