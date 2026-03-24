-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "maxUsers" INTEGER NOT NULL DEFAULT -1,
    "maxProjects" INTEGER NOT NULL DEFAULT -1,
    "features" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "customDomain" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "plan_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- Insert default plans first (needed for tenant)
INSERT INTO "Plan" ("id", "name", "monthly_price", "maxUsers", "maxProjects", "features", "isActive", "sortOrder")
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Free', 0, 3, 5, '{"timeTracking":true}', true, 0),
    ('00000000-0000-0000-0000-000000000002', 'Starter', 29, 10, 25, '{"timeTracking":true,"reports":true,"apiAccess":true}', true, 1),
    ('00000000-0000-0000-0000-000000000003', 'Pro', 49, 50, 100, '{"timeTracking":true,"reports":true,"apiAccess":true,"invoices":true,"customDomain":true}', true, 2),
    ('00000000-0000-0000-0000-000000000004', 'Enterprise', 0, -1, -1, '{"timeTracking":true,"reports":true,"apiAccess":true,"invoices":true,"customDomain":true,"sso":true,"prioritySupport":true}', true, 3);

-- Insert default tenant for existing data
INSERT INTO "Tenant" ("id", "name", "slug", "plan_id", "status")
VALUES ('00000000-0000-0000-0000-000000000001', 'My Organization', 'default', '00000000-0000-0000-0000-000000000001');

-- Add tenant_id column with default value for existing teams
ALTER TABLE "Team" ADD COLUMN "tenant_id" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';

-- CreateTable
CREATE TABLE "TenantInvitation" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvitation_token_key" ON "TenantInvitation"("token");

-- CreateIndex
CREATE INDEX "Team_tenant_id_idx" ON "Team"("tenant_id");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvitation" ADD CONSTRAINT "TenantInvitation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;