-- CreateTable
CREATE TABLE "PortfolioProjectMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioProjectMedia_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PortfolioProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PortfolioProjectMedia_projectId_idx" ON "PortfolioProjectMedia"("projectId");

-- Migrate existing single-media rows into the new media table
INSERT INTO "PortfolioProjectMedia" (
    "id",
    "projectId",
    "mediaType",
    "mediaUrl",
    "storageKey",
    "fileSize",
    "sortOrder",
    "createdAt"
)
SELECT
    lower(hex(randomblob(4)) || hex(randomblob(2)) || '4' || substr(hex(randomblob(2)), 2) ||
    substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || hex(randomblob(6))),
    "id",
    "mediaType",
    "mediaUrl",
    "storageKey",
    "fileSize",
    0,
    "createdAt"
FROM "PortfolioProject";
