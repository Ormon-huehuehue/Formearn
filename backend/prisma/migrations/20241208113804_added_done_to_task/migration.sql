/*
  Warnings:

  - You are about to drop the column `balance_id` on the `Worker` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "Done" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "balance_id";
