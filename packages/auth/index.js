// packages/auth/index.js (ESM, Electron-safe)
import { prisma } from '@platform/core';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

// --- legacy helper (for very old seeded users) ---
const legacySha256 = (pw) => crypto.createHash('sha256').update(pw).digest('hex');

// bcrypt settings (cost 10 is fine for desktop; raise to 12 later if you want)
const ROUNDS = 10;

async function hashPassword(pw) {
  return await bcrypt.hash(pw, ROUNDS);
}

async function verifyPassword(hash, pw) {
  return await bcrypt.compare(pw, hash);
}

/** Admin: create user (bcryptjs) */
export async function createUser({ email, displayName, password, roleName = 'Manager' }) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`Role ${roleName} not found`);
  const passwordHash = await hashPassword(password);
  const u = await prisma.user.create({
    data: { email, displayName, passwordHash, roleId: role.id }
  });
  return { id: u.id, email: u.email, displayName: u.displayName };
}

/** Admin: set/reset password (bcryptjs) */
export async function setPassword({ email, newPassword }) {
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { email },
    data: { passwordHash, failedLogins: 0, lockedUntil: null, isActive: true }
  });
  return true;
}

/** Login with transparent migration:
 * - If bcrypt hash verifies → success
 * - Else if legacy SHA256 matches → success + upgrade to bcrypt
 */
export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new Error('Invalid credentials');

  // try bcrypt first
  let ok = false;
  try {
    ok = await verifyPassword(user.passwordHash || '', password);
  } catch {
    ok = false;
  }

  let needsUpgrade = false;
  if (!ok) {
    // fall back to legacy SHA-256 once
    if (user.passwordHash === legacySha256(password)) {
      ok = true;
      needsUpgrade = true;
    }
  }

  if (!ok) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: { increment: 1 } }
    });
    throw new Error('Invalid credentials');
  }

  // success: reset counters, optionally upgrade hash
  const updates = { failedLogins: 0, lockedUntil: null };
  if (needsUpgrade) updates.passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id: user.id }, data: updates });

  return { id: user.id, email: user.email, displayName: user.displayName };
}