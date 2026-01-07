import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { initializeFirebase } from '../src/config/firebase.config';
import { UserRole } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function createAdmin() {
  try {
    // Initialize Firebase
    const configService = {
      get: (key: string) => process.env[key],
    } as ConfigService;

    initializeFirebase(configService);
    const db = admin.firestore();
    console.log('✅ Firebase connected');

    // Get email and password from command line arguments or use defaults
    const email = process.argv[2] || 'admin@zinoshop.com';
    const password = process.argv[3] || 'admin123';
    const firstName = process.argv[4] || 'Admin';
    const lastName = process.argv[5] || 'User';

    // Check if user already exists
    const usersSnapshot = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    let user;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!usersSnapshot.empty) {
      // Update existing user to admin
      user = usersSnapshot.docs[0];
      await user.ref.update({
        role: UserRole.ADMIN,
        password: hashedPassword,
        firstName,
        lastName,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      console.log(`✅ Updated user "${email}" to admin role`);
    } else {
      // Create new admin user
      const userRef = db.collection('users').doc();
      const now = admin.firestore.Timestamp.now();
      await userRef.set({
        id: userRef.id,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      user = await userRef.get();
      console.log(`✅ Created new admin user: ${email}`);
    }

    const userData = user.data();

    console.log('\n📋 Admin Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${userData?.role || UserRole.ADMIN}`);
    console.log('\n🔗 Login at: http://localhost:3000/auth/login');
    console.log('🔗 Admin Panel: http://localhost:3000/admin\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
