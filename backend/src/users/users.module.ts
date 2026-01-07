import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FirestoreService } from '../firebase/firestore.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, FirestoreService],
  exports: [UsersService],
})
export class UsersModule {}
