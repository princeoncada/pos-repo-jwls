
import { prisma } from '@platform/core';
import { z } from 'zod';

export const ItemCreateSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  metal: z.string().min(1),
  karat: z.enum(['10K','14K','18K','21K','22K','24K']),
  weight_g: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? parseFloat(v) : v),
  condition: z.string().min(1),
  currentState: z.enum(['DRAFT','QA','READY','RESERVED']).default('DRAFT'),
  currentBranchId: z.string().nullable().optional()
});

export async function createItem(dto) {
  const data = ItemCreateSchema.parse(dto);
  const item = await prisma.item.create({ data });
  return item;
}

export async function listItems({ q = '', state = '', branchId = '', take = 20, skip = 0 } = {}) {
  const where = {};
  if (q) where.title = { contains: q };
  if (state) where.currentState = state;
  if (branchId) where.currentBranchId = branchId;
  const [items, total] = await Promise.all([
    prisma.item.findMany({ where, orderBy: { updatedAt: 'desc' }, take, skip }),
    prisma.item.count({ where })
  ]);
  return { items, total };
}
