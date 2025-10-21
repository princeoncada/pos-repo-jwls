
import { PrismaClient } from '../packages/platform/prisma-client/index.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hash(pw) {
  // demo hash (DO NOT use in prod). Replace with argon2 in real app.
  return crypto.createHash('sha256').update(pw).digest('hex');
}

async function main() {
  // roles
  const owner = await prisma.role.upsert({
    where: { name: 'Owner' },
    update: {},
    create: {
      name: 'Owner',
      policies: JSON.stringify({ createItem: true, editItem: true, viewReports: true, manageUsers: true })
    }
  });
  const manager = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: { name: 'Manager', policies: JSON.stringify({ createItem: true, editItem: true }) }
  });

  // user
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'Admin',
      passwordHash: hash('admin123'),
      roleId: owner.id
    }
  });

  // branch
  const mainBranch = await prisma.branch.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: { code: 'MAIN', name: 'Main Branch' }
  });

  // a few items
  await prisma.item.createMany({
    data: [
      { title: '14K Gold Ring', category: 'ring', metal: 'Au', karat: '14K', weight_g: 5.200, condition: 'NEW', currentState: 'READY', currentBranchId: mainBranch.id },
      { title: '18K Necklace', category: 'necklace', metal: 'Au', karat: '18K', weight_g: 12.000, condition: 'NEW', currentState: 'READY', currentBranchId: mainBranch.id }
    ]
  });

  console.log('Seed complete. Demo user: admin@example.com / admin123');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
