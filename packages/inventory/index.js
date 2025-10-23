import { prisma } from '@platform/core';
import { z } from 'zod';

// ---------- helpers ----------
const toNullIfBlank = (v) => (v === '' || v === undefined || v === null ? null : v);

// FRANCHISE mapping: digits -> letters and back; we only need encoding cost -> letters
const DIGIT_TO_FRANCHISE = { '1': 'F', '2': 'R', '3': 'A', '4': 'N', '5': 'C', '6': 'H', '7': 'I', '8': 'S', '9': 'E', '0': '0' };
function encodeCostToFranchise(cost) {
  const s = String(cost ?? '').replace(/[^\d]/g, ''); // keep digits only; drop dot/comma
  if (!s) return null;
  return s.split('').map(d => DIGIT_TO_FRANCHISE[d] ?? '0').join('');
}

// map UI karat like "14K" -> prisma enum "K14"
function coerceKaratEnum(input) {
  const m = String(input || '').match(/^(\d{2})K$/i);
  return m ? (`K${m[1]}`) : 'K14';
}

// ---------- validation ----------
export const ItemCreateSchema = z.object({
  title: z.string().min(1),
  categoryId: z.string().min(1),       // <-- was "category"
  branchId: z.string().min(1),         // <-- explicit
  supplierId: z.string().min(1),
  metal: z.string().min(1),
  karat: z.string().min(2),            // "14K" from UI; convert to enum
  weight_g: z.union([z.number(), z.string()]).optional().transform(v =>
    v === '' || v === undefined ? undefined : (typeof v === 'string' ? Number.parseFloat(v) : v)
  ),
  condition: z.string().min(1),
  status: z.enum(['AVAILABLE','SOLD','TRANSFERRED']).default('AVAILABLE'),
  cost: z.union([z.number(), z.string()]).optional().transform(v =>
    v === '' || v === undefined ? undefined : Number.parseFloat(v)
  ),
});

const ItemUpdateSchema = ItemCreateSchema.extend({
  // allow edit without changing type sequence
  id: z.string().optional()
}).partial();

// ---------- core: next sequence + itemCode ----------
async function getNextTypeSeq(branchId, categoryId) {
  // fastest portable approach: count + 1; with @@unique constraint it’s safe from races if wrapped in a transaction
  const count = await prisma.item.count({ where: { branchId, categoryId } });
  return count + 1;
}

async function buildItemCode(branchId, categoryId, typeSeq) {
  const [branch, category] = await Promise.all([
    prisma.branch.findUnique({ where: { id: branchId }, select: { code: true } }),
    prisma.category.findUnique({ where: { id: categoryId }, select: { code: true } }),
  ]);
  if (!branch) throw new Error('Branch not found');
  if (!category) throw new Error('Category not found');
  return `${branch.code}-${category.code}-${typeSeq}`;
}

// ---------- CRUD ----------
export async function createItem(dto) {
  const data = ItemCreateSchema.parse(dto);

  // FK checks (unchanged)
  const [branch, category] = await Promise.all([
    prisma.branch.findUnique({ where: { id: data.branchId }, select: { id: true, code: true } }),
    prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true, code: true } }),
  ]);
  if (!branch) throw new Error('Branch not found');
  if (!category) throw new Error('Category not found');
  if (data.supplierId) {
    const sup = await prisma.supplier.findUnique({ where: { id: data.supplierId }, select: { id: true } });
    if (!sup) throw new Error('Supplier not found');
  }

  const karatEnum = coerceKaratEnum(data.karat);
  const costCode = encodeCostToFranchise(data.cost);

  // Retry a couple times in the extremely unlikely case of a race
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const typeSeq = await nextSeqInTx(tx, data.branchId, data.categoryId);
        const itemCode = await buildItemCode(data.branchId, data.categoryId, typeSeq);

        return tx.item.create({
          data: {
            itemCode,
            title: data.title,
            categoryId: data.categoryId,
            branchId: data.branchId,
            supplierId: data.supplierId || null,
            metal: data.metal,
            karat: karatEnum,
            weight_g: data.weight_g,
            condition: data.condition,
            status: data.status,
            cost: data.cost,
            costCode,
            typeSeq,
          }
        });
      });
    } catch (err) {
      // If unique constraint trips, loop and try again with a fresh MAX+1
      if (String(err?.message || '').toLowerCase().includes('unique') ||
          String(err?.message || '').toLowerCase().includes('sequence')) {
        continue;
      }
      throw err;
    }
  }
  // If still failing, surface a meaningful message
  throw new Error('Could not allocate a new sequence. Please try again.');
}

export async function getItem(id) {
  return prisma.item.findUnique({
    where: { id },
    include: {
      branch:   { select: { id: true, name: true, code: true } },
      category: { select: { id: true, name: true, code: true } },
      supplier: { select: { id: true, name: true } },
    }
  });
}

export async function updateItem(id, dto) {
  const data = ItemUpdateSchema.parse(dto);

  // disallow changing branch/category if you want to keep itemCode stable; else you must recompute
  if (data.branchId || data.categoryId) {
    throw new Error('Changing branch/category after creation is not supported; create a new item or implement transfer.');
  }

  if (data.supplierId) {
    const sup = await prisma.supplier.findUnique({ where: { id: data.supplierId }, select: { id: true } });
    if (!sup) throw new Error('Supplier not found');
  }

  const karatEnum = data.karat ? coerceKaratEnum(data.karat) : undefined;
  const patch = {
    title: data.title,
    supplierId: data.supplierId === '' ? null : data.supplierId,
    metal: data.metal,
    karat: karatEnum,
    weight_g: data.weight_g,
    condition: data.condition,
    status: data.status,
    cost: data.cost,
    costCode: data.cost !== undefined ? encodeCostToFranchise(data.cost) : undefined,
  };

  return prisma.item.update({
    where: { id },
    data: Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
  });
}

export async function deleteItem(id) {
  return prisma.item.delete({ where: { id } });
}


export async function listItems({ q = '', status = '', branchId = '', supplierId = '', categoryId = '', take = 20, skip = 0 } = {}) {
  const where = {};
  if (q) where.OR = [{ title: { contains: q } }, { itemCode: { contains: q } }];
  if (status) where.status = status;
  if (branchId) where.branchId = branchId;
  if (supplierId) where.supplierId = supplierId;
  if (categoryId) where.categoryId = categoryId;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take, skip,
      include: {
        branch:   { select: { name: true, code: true } },
        category: { select: { name: true, code: true } },
        supplier: { select: { name: true } },
      }
    }),
    prisma.item.count({ where })
  ]);
  return { items, total };
}

// --- NEW: sequential bulk create; supports 1 row too
export async function createItemsBulk(rows = []) {
  if (!rows.length) return [];

  // Validate rows early to catch obvious issues
  const parsed = rows.map((r, i) => {
    try { return { ok: true, value: ItemCreateSchema.parse(r), i }; }
    catch (e) { return { ok: false, error: e, i }; }
  });

  // Group valid rows by (branchId, categoryId) — sequences are per-type per-branch
  const groups = new Map(); // key = `${branchId}::${categoryId}` -> array of {i, value}
  for (const p of parsed) {
    if (!p.ok) continue;
    const { branchId, categoryId } = p.value;
    const key = `${branchId}::${categoryId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ i: p.i, value: p.value });
  }

  // One transaction to assign sequences without collisions
  const results = Array(rows.length).fill(null);
  await prisma.$transaction(async (tx) => {
    for (const [key, arr] of groups) {
      const [branchId, categoryId] = key.split('::');

      // base = MAX(typeSeq)+1 at this moment
      let base = await nextSeqInTx(tx, branchId, categoryId);

      // Pre-fetch codes to build itemCode once
      const [branch, category] = await Promise.all([
        tx.branch.findUnique({ where: { id: branchId }, select: { code: true } }),
        tx.category.findUnique({ where: { id: categoryId }, select: { code: true } }),
      ]);
      if (!branch) throw new Error('Branch not found');
      if (!category) throw new Error('Category not found');

      // Create each row with incremented sequence
      for (const { i, value } of arr) {
        const karatEnum = coerceKaratEnum(value.karat);
        const costCode  = encodeCostToFranchise(value.cost);
        const typeSeq   = base++;
        const itemCode  = `${branch.code}-${(category.code || 'cat')}-${typeSeq}`;

        const created = await tx.item.create({
          data: {
            itemCode,
            title: value.title,
            categoryId: value.categoryId,
            branchId: value.branchId,
            supplierId: value.supplierId || null,
            metal: value.metal,
            karat: karatEnum,
            weight_g: value.weight_g,
            condition: value.condition,
            status: value.status,
            cost: value.cost,
            costCode,
            typeSeq,
          }
        });
        results[i] = created;
      }
    }
  });

  // Fill in errors for invalid rows
  for (const p of parsed) {
    if (!p.ok) {
      results[p.i] = {
        __error: true,
        __rowIndex: p.i,
        __message: p.error?.errors
          ? JSON.stringify(p.error.errors, null, 2)
          : String(p.error?.message || p.error)
      };
    }
  }

  return results;
}


// --- NEW: reference lists for dropdowns
export async function listBranches() {
  return prisma.branch.findMany({ orderBy: { code: 'asc' } });
}
export async function listSuppliers() {
  return prisma.supplier.findMany({ orderBy: { name: 'asc' } });
}
export async function listCategories() {
  return prisma.category.findMany({ orderBy: { code: 'asc' } });
}

// --- NEW: admin CRUD for refs (create-only for now)
export async function createBranch({ code, name }) {
  return prisma.branch.create({ data: { code, name } });
}
export async function createSupplier({ name, notes }) {
  return prisma.supplier.create({ data: { name, notes } });
}
export async function createCategory({ code, name }) {
  return prisma.category.create({ data: { code, name } });
}

// NEW: next sequence using MAX(typeSeq) + 1 inside a given transaction
async function nextSeqInTx(tx, branchId, categoryId) {
  const agg = await tx.item.aggregate({
    where: { branchId, categoryId },
    _max: { typeSeq: true }
  });
  const current = agg?._max?.typeSeq ?? 0;
  return current + 1;
}

// Returns MAX(typeSeq)+1 for a branch/category (or 1 if none exist)
export async function getNextSeq({ branchId, categoryId }) {
  if (!branchId || !categoryId) throw new Error('branchId and categoryId are required');
  const agg = await prisma.item.aggregate({
    where: { branchId, categoryId },
    _max: { typeSeq: true }
  });
  const current = agg?._max?.typeSeq ?? 0;
  return current + 1;
}
