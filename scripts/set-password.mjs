import { prisma } from '../packages/platform/index.js';
import * as bcrypt from 'bcryptjs';

const [,, email, newPassword] = process.argv;
if (!email || !newPassword) {
  console.log('Usage: node scripts/set-password.mjs <email> <newPassword>');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(newPassword, 10);
await prisma.user.update({
  where: { email },
  data: { passwordHash, failedLogins: 0, lockedUntil: null, isActive: true }
});
console.log('Password updated for', email);
await prisma.$disconnect();
