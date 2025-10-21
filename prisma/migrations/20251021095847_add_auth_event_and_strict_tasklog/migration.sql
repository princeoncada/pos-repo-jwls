-- CreateTable
CREATE TABLE "AuthEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outcome" TEXT NOT NULL,
    "emailTried" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AuthEvent_createdAt_idx" ON "AuthEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuthEvent_emailTried_createdAt_idx" ON "AuthEvent"("emailTried", "createdAt");

-- CreateIndex
CREATE INDEX "AuthEvent_userId_createdAt_idx" ON "AuthEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserTaskLog_userId_createdAt_idx" ON "UserTaskLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserTaskLog_action_createdAt_idx" ON "UserTaskLog"("action", "createdAt");
