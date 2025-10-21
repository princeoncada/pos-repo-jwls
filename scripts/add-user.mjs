import { prisma } from '../packages/platform/index.js';
import * as bcrypt from 'bcryptjs';

const [,, email, displayName, password, roleName='Owner'] = process.argv;
if (!email || !displayName || !password) {
  console.log('Usage: node scripts/add-user.mjs <email> <displayName> <password> [roleName]');
  process.exit(1);
}

const role = await prisma.role.findUnique({ where: { name: roleName } });
if (!role) throw new Error(`Role ${roleName} not found`);

const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.upsert({
  where: { email },
  update: { displayName, passwordHash, roleId: role.id, isActive: true, failedLogins: 0, lockedUntil: null },
  create: { email, displayName, passwordHash, roleId: role.id },
  select: { id: true, email: true, displayName: true }
});
console.log('User upserted:', user);
await prisma.$disconnect();
