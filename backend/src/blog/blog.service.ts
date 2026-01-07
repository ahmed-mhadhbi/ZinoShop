import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../firebase/firestore.service';
import { BlogPost } from './entities/blog-post.entity';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@Injectable()
export class BlogService {
  private readonly collection = 'blog_posts';

  constructor(private firestoreService: FirestoreService) {}

  async create(createBlogPostDto: CreateBlogPostDto): Promise<BlogPost> {
    return this.firestoreService.create<BlogPost>(this.collection, {
      ...createBlogPostDto,
      viewCount: 0,
      isPublished: createBlogPostDto.isPublished !== undefined ? createBlogPostDto.isPublished : true,
    });
  }

  async findAll(published?: boolean): Promise<BlogPost[]> {
    const filters = published !== undefined
      ? [{ field: 'isPublished', operator: '==', value: published }]
      : undefined;

    return this.firestoreService.findAll<BlogPost>(
      this.collection,
      filters,
      { field: 'createdAt', direction: 'desc' },
    );
  }

  async findOne(id: string): Promise<BlogPost> {
    const post = await this.firestoreService.findById<BlogPost>(this.collection, id);
    if (!post) {
      throw new NotFoundException(`Blog post with ID ${id} not found`);
    }
    // Increment view count
    const updatedPost = await this.firestoreService.update<BlogPost>(
      this.collection,
      id,
      { viewCount: (post.viewCount || 0) + 1 },
    );
    return updatedPost;
  }

  async update(id: string, updateBlogPostDto: UpdateBlogPostDto): Promise<BlogPost> {
    const post = await this.firestoreService.findById<BlogPost>(this.collection, id);
    if (!post) {
      throw new NotFoundException(`Blog post with ID ${id} not found`);
    }
    return this.firestoreService.update<BlogPost>(this.collection, id, updateBlogPostDto);
  }

  async remove(id: string): Promise<void> {
    await this.firestoreService.delete(this.collection, id);
  }
}
