import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../firebase/firestore.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly collection = 'users';
  private readonly listFields = [
    'id',
    'email',
    'firstName',
    'lastName',
    'role',
    'createdAt',
  ];

  constructor(private firestoreService: FirestoreService) {}

  private normalizeDate(value: unknown): Date | undefined {
    if (!value) return undefined;

    if (value instanceof Date) {
      return !isNaN(value.getTime()) ? value : undefined;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return !isNaN(parsed.getTime()) ? parsed : undefined;
    }

    if (typeof value === 'object') {
      const timestampLike = value as {
        toDate?: () => Date;
        _seconds?: number;
        seconds?: number;
        _nanoseconds?: number;
        nanoseconds?: number;
      };

      if (typeof timestampLike.toDate === 'function') {
        const parsed = timestampLike.toDate();
        return parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : undefined;
      }

      const seconds = Number(timestampLike._seconds ?? timestampLike.seconds);
      const nanoseconds = Number(timestampLike._nanoseconds ?? timestampLike.nanoseconds ?? 0);
      if (Number.isFinite(seconds)) {
        const millis = Math.floor(seconds * 1000 + nanoseconds / 1_000_000);
        const parsed = new Date(millis);
        return !isNaN(parsed.getTime()) ? parsed : undefined;
      }
    }

    return undefined;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Check if user with email already exists
      const existingUser = await this.firestoreService.findByField<User>(
        this.collection,
        'email',
        createUserDto.email,
      );

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = await this.firestoreService.create<User>(this.collection, {
        ...createUserDto,
        role: createUserDto.role || UserRole.USER,
        isActive: true,
      });

      return user;
    } catch (error) {
      console.error('User creation error:', error);
      throw error;
    }
  }

  async findAll(): Promise<Partial<User>[]> {
    const users = await this.firestoreService.findAll<User>(this.collection);
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: this.normalizeDate(user.createdAt),
    }));
  }

  async findPage(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    users: Partial<User>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const validPage = page > 0 && Number.isFinite(page) ? Math.floor(page) : 1;
    const validLimit = limit > 0 && Number.isFinite(limit) ? Math.min(Math.floor(limit), 50) : 20;

    const { items, total } = await this.firestoreService.findPage<User>(
      this.collection,
      undefined,
      validPage,
      validLimit,
      { field: 'createdAt', direction: 'desc' },
      this.listFields,
    );

    return {
      users: items.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: this.normalizeDate(user.createdAt),
      })),
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async count(): Promise<number> {
    const { total } = await this.firestoreService.findPage<User>(
      this.collection,
      undefined,
      1,
      1,
    );
    return total;
  }

  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.firestoreService.findById<User>(this.collection, id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country,
      createdAt: this.normalizeDate(user.createdAt),
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.firestoreService.findByField<User>(this.collection, 'email', email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.firestoreService.findById<User>(this.collection, id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.firestoreService.update<User>(this.collection, id, updateUserDto);
  }

  async remove(id: string): Promise<void> {
    await this.firestoreService.delete(this.collection, id);
  }
}
