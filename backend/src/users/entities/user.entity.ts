// Plain TypeScript class for User (Firebase/Firestore compatible)
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export class User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isActive: boolean;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
