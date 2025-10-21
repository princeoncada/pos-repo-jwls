
import { prisma } from '@platform/core';

export async function logTask(userId, action, payload = {}) {
  // requires a real user
  await prisma.userTaskLog.create({
    data: {
      userId,
      action,
      payload:
        JSON.stringify(payload || {})
    }
  });
}

export async function logAuthEvent({ outcome, emailTried, userId = null, reason = null }) {
  await prisma.authEvent.create({
    data: {
      outcome,
      emailTried,
      userId,
      reason
    }
  });
}