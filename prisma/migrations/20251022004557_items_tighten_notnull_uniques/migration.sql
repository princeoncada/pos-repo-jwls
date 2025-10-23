/*
  Warnings:

  - Made the column `branchId` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `categoryId` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `itemCode` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `typeSeq` on table `Item` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "supplierId" TEXT,
    "metal" TEXT NOT NULL,
    "karat" TEXT NOT NULL,
    "weight_g" REAL,
    "condition" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "cost" REAL,
    "costCode" TEXT,
    "typeSeq" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("branchId", "categoryId", "condition", "cost", "costCode", "createdAt", "id", "itemCode", "karat", "metal", "status", "supplierId", "title", "typeSeq", "updatedAt", "weight_g") SELECT "branchId", "categoryId", "condition", "cost", "costCode", "createdAt", "id", "itemCode", "karat", "metal", "status", "supplierId", "title", "typeSeq", "updatedAt", "weight_g" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE UNIQUE INDEX "Item_itemCode_key" ON "Item"("itemCode");
CREATE UNIQUE INDEX "Item_branchId_categoryId_typeSeq_key" ON "Item"("branchId", "categoryId", "typeSeq");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
