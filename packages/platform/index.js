
import { PrismaClient } from './prisma-client/index.js';
export const prisma = new PrismaClient();

export const config = {
  dbPath: '.data/dev.db'
};
