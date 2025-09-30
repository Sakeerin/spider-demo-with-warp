/*
  Warnings:

  - A unique constraint covering the columns `[leadId,contractorId]` on the table `LeadAssignment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LeadAssignment_leadId_contractorId_key" ON "public"."LeadAssignment"("leadId", "contractorId");
