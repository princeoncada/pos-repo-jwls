import { prisma } from '../packages/platform/index.js';

const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/debug-user.mjs <email>');
  process.exit(1);
}

const user = await prisma.user.findUnique({
  where: { email },
  select: { email: true, displayName: true, isActive: true, passwordHash: true, failedLogins: true, lockedUntil: true, roleId: true }
});
console.log(user || '(not found)');
await prisma.$disconnect();
