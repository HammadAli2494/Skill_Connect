import bcrypt from 'bcryptjs';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { assertEnv } from '../config/env.js';

const CATEGORIES = [
  ['Electrical', 'electrical', 'Wiring, switches, and lighting'],
  ['Plumbing', 'plumbing', 'Leaks, fittings, and drains'],
  ['Cleaning', 'cleaning', 'Home and office cleaning'],
  ['Tutoring', 'tutoring', 'School and exam tutoring'],
  ['Photography', 'photography', 'Events and portraits'],
  ['Carpentry', 'carpentry', 'Furniture and wood repair'],
  ['Painting', 'painting', 'Interior and exterior paint'],
  ['AC Repair', 'ac', 'Service, gas, and installation'],
  ['Home Repair', 'repair', 'General household fixes'],
];

assertEnv();

await connectDb();

const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || '';
const adminName = process.env.ADMIN_NAME || 'Platform Admin';

if (!adminEmail || !adminPassword) {
  console.log('Skipped admin user. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one.');
} else {
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'admin',
      isEmailVerified: true,
    });
    console.log(`Created admin ${adminEmail}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}. Password was left unchanged.`);
  }
}

for (const [name, icon, description] of CATEGORIES) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  await Category.updateOne(
    { slug },
    { $setOnInsert: { name, slug, icon, description, isActive: true } },
    { upsert: true }
  );
}

console.log('Category seed complete. Demo listings are a separate command: npm run seed:demo');
await disconnectDb();
