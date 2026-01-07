// Plain TypeScript class for BlogPost (Firebase/Firestore compatible)
export class BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image?: string;
  author?: string;
  isPublished: boolean;
  tags?: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}
