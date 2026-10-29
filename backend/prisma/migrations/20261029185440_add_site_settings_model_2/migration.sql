-- CreateTable
CREATE TABLE "site_settings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'singleton',
    "siteName" TEXT NOT NULL DEFAULT 'Prefeitura Municipal',
    "siteDescription" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1e3a8a',
    "primaryForegroundColor" TEXT DEFAULT '#ffffff',
    "secondaryColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "secondaryForegroundColor" TEXT DEFAULT '#000000',
    "themeColors" JSONB,
    "addressStreet" TEXT,
    "addressNumber" TEXT,
    "addressCity" TEXT DEFAULT 'Telêmaco Borba',
    "addressState" TEXT DEFAULT 'PR',
    "addressZip" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "workingHours" TEXT,
    "socialLinks" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
