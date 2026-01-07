import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { FirestoreService } from '../firebase/firestore.service';

@Module({
  controllers: [BlogController],
  providers: [BlogService, FirestoreService],
  exports: [BlogService],
})
export class BlogModule {}
