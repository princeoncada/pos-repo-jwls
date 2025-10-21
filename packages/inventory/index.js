import { prisma } from '@platform/core';
import { z } from 'zod';

export const ItemCreateSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  metal: z.string().min(1),
  karat: z.enum(['10K', '14K', '18K', '21K', '22K', '24K']),
  weight_g: z.union([z.number(), z.string()]).transform(v => typeof v === 'string' ? Number.parseFloat(v) : v),
  condition: z.string().min(1),
  currentState: z.enum(['DRAFT', 'QA', 'READY', 'RESERVED']).default('DRAFT'),
  currentBranchId: z.string().nullable().optional()
});

const ItemUpdateSchema = ItemCreateSchema.partial(); // allow partial updates

export async function createItem(dto) {
  const data = ItemCreateSchema.parse(dto);
  return prisma.item.create({ data });
}

export async function getItem(id) {
  return prisma.item.findUnique({
    where: { id },
    include: { branch: { select: { id: true, name: true } } }
  });
}

export async function updateItem(id, dto) {
  const data = ItemUpdateSchema.parse(dto);
  return prisma.item.update({ where: { id }, data });
}

export async function deleteItem(id) {
  return prisma.item.delete({ where: { id } });
}

export async function listItems({ q = '', state = '', branchId = '', take = 20, skip = 0 } = {}) {
  const where = {};
  if (q) where.title = { contains: q };
  if (state) where.currentState = state;
  if (branchId) where.currentBranchId = branchId;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take,
      skip,
      include: { branch: { select: { name: true } } }
    }),
    prisma.item.count({ where })
  ]);
  return { items, total };
}

