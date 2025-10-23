/* scripts/backfill-item-keys.cjs */
/* CJS version — no ESM imports */

const path = require('path');

// Point to the generated client. This matches your generator output:
//   output = "../packages/platform/prisma-client"
// The script lives in /scripts, so go up one level, then into that folder.
const clientPath = path.join(__dirname, '..', 'packages', 'platform', 'prisma-client');

// eslint-disable-next-line import/no-dynamic-require, global-require
const { PrismaClient } = require(clientPath);
const prisma = new PrismaClient();

// Map digits to FRANCHISE letters; non-digits -> ignored; missing -> null
const DIGIT_TO_FRANCHISE = { '1':'F','2':'R','3':'A','4':'N','5':'C','6':'H','7':'I','8':'S','9':'E','0':'0' };
const encodeCostToFranchise = (cost) => {
  if (cost === null || cost === undefined) return null;
  const digits = String(cost).replace(/[^\d]/g, '');
  if (!digits) return null;
  return digits.split('').map(d => DIGIT_TO_FRANCHISE[d] ?? '0').join('');
};

async function upsertRefData() {
  const branches = [
    { code: 'HPI', name: "Hannah's Ilustre" },
    { code: 'KSB', name: 'Kimsan Bajada' },
    { code: 'HPA', name: "Hannah's Agdao" },
    { code: 'MAT', name: "Hannah's Matina" },
    { code: 'HPL', name: "Hannah's Legaspi" },
    { code: 'BUH', name: 'Kimsan Buhangin' },
  ];
  for (const b of branches) {
    await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name },
      create: { code: b.code, name: b.name },
    });
  }

  const categories = [
    { code: 'chn',  name: 'Chain' },
    { code: 'blet', name: 'Bracelet' },
    { code: 'bgl',  name: 'Bangle' },
    { code: 'ear',  name: 'Earrings' },
    { code: 'rng',  name: 'Ring' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: { code: c.code, name: c.name },
    });
  }

  await prisma.supplier.upsert({
    where: { name: 'Unknown Supplier' },
    update: {},
    create: { name: 'Unknown Supplier', notes: 'Backfilled' },
  });
}

function key(branchId, categoryId) {
  return `${branchId}::${categoryId}`;
}

async function backfillItems() {
  // Pick a default branch & category for rows missing refs
  const defaultBranchCode = 'HPI';
  const defaultCategoryCode = 'rng';

  const branch = await prisma.branch.findUnique({ where: { code: defaultBranchCode } });
  const category = await prisma.category.findUnique({ where: { code: defaultCategoryCode } });
  if (!branch || !category) throw new Error('Missing branch/category after seed.');

  // Pre-warm counters using any items that already have a sequence
  const counters = {};
  const existingWithSeq = await prisma.item.findMany({
    where: { branchId: { not: null }, categoryId: { not: null }, typeSeq: { not: null } },
    select: { branchId: true, categoryId: true, typeSeq: true }
  });
  for (const it of existingWithSeq) {
    const k = key(it.branchId, it.categoryId);
    counters[k] = Math.max(counters[k] || 0, it.typeSeq);
  }

  // Find items needing backfill
  const toFix = await prisma.item.findMany({
    where: { OR: [{ branchId: null }, { categoryId: null }, { typeSeq: null }, { itemCode: null }] },
    orderBy: { createdAt: 'asc' },
  });

  for (const it of toFix) {
    const branchId = it.branchId ?? branch.id;
    const categoryId = it.categoryId ?? category.id;

    const k = key(branchId, categoryId);
    const nextSeq = (counters[k] || 0) + 1;
    counters[k] = nextSeq;

    // Need branch & category codes to compose itemCode
    const [b, c] = await Promise.all([
      prisma.branch.findUnique({ where: { id: branchId } }),
      prisma.category.findUnique({ where: { id: categoryId } }),
    ]);
    if (!b || !c) throw new Error('Ref rows missing while backfilling.');

    const itemCode = `${b.code}-${c.code}-${nextSeq}`;

    const cost = it.cost ?? null;
    const costCode = cost === null ? null : encodeCostToFranchise(cost);

    await prisma.item.update({
      where: { id: it.id },
      data: {
        branchId,
        categoryId,
        typeSeq: nextSeq,
        itemCode,
        cost,
        costCode,
        // Optional: set default supplier during backfill
        // supplier: { connect: { name: 'Unknown Supplier' } },
      }
    });
  }
}

async function main() {
  await upsertRefData();
  await backfillItems();
  console.log('Backfill complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
