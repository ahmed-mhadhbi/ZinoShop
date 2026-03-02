import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Amir Mhadhbi' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  @MaxLength(120)
  email: string;

  @ApiProperty({ example: 'Question sur une commande' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  subject: string;

  @ApiProperty({ example: 'Bonjour, je veux modifier mon adresse...' })
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message: string;
}

