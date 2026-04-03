-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('coach', 'admin');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'coach',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_coaches" (
    "client_id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,

    CONSTRAINT "client_coaches_pkey" PRIMARY KEY ("client_id","coach_id")
);

-- CreateTable
CREATE TABLE "weekly_scores" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "week_start" DATE NOT NULL,
    "current_score" INTEGER NOT NULL,
    "predictive_score" INTEGER NOT NULL,
    "actions" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "clients_is_active_idx" ON "clients"("is_active");

-- CreateIndex
CREATE INDEX "weekly_scores_client_id_week_start_idx" ON "weekly_scores"("client_id", "week_start");

-- CreateIndex
CREATE INDEX "weekly_scores_coach_id_week_start_idx" ON "weekly_scores"("coach_id", "week_start");

-- CreateIndex
CREATE INDEX "weekly_scores_week_start_idx" ON "weekly_scores"("week_start");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_scores_client_id_week_start_key" ON "weekly_scores"("client_id", "week_start");

-- AddForeignKey
ALTER TABLE "client_coaches" ADD CONSTRAINT "client_coaches_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_coaches" ADD CONSTRAINT "client_coaches_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_scores" ADD CONSTRAINT "weekly_scores_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_scores" ADD CONSTRAINT "weekly_scores_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
