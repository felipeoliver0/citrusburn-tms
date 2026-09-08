-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BROKER', 'CARRIER', 'DRIVER', 'ADMIN', 'DEALER');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('AVAILABLE', 'OFFERED', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'INVOICED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "TrailerType" AS ENUM ('OPEN', 'ENCLOSED', 'FLATBED', 'DRIVE_AWAY');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('COD', 'CERTIFIED_FUNDS', 'CHECK', 'ACH');

-- CreateEnum
CREATE TYPE "ExternalPostingStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'POSTED', 'FAILED');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "role" "Role" NOT NULL DEFAULT 'CARRIER',
    "fullName" TEXT,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "phone" TEXT,
    "mcNumber" TEXT,
    "usdotNumber" TEXT,
    "websiteUrl" TEXT,
    "yearEstablished" TEXT,
    "companyCountry" TEXT,
    "companyCity" TEXT,
    "companyState" TEXT,
    "companyZip" TEXT,
    "timeZone" TEXT,
    "hoursOfOperation" TEXT,
    "cellPhone" TEXT,
    "howDidYouHear" TEXT,
    "ein" TEXT,
    "bondNumber" TEXT,
    "insuranceCertUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verificationCodeExpiry" TIMESTAMP(3),
    "resetPasswordCode" TEXT,
    "resetPasswordExpiry" TIMESTAMP(3),
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "employerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originCity" TEXT,
    "destCity" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Load" (
    "id" TEXT NOT NULL,
    "originZip" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "originAddress" TEXT,
    "destZip" TEXT NOT NULL,
    "destCity" TEXT NOT NULL,
    "destAddress" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "status" "LoadStatus" NOT NULL DEFAULT 'AVAILABLE',
    "pickupDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "vehiclesData" JSONB NOT NULL DEFAULT '[]',
    "trailerType" "TrailerType" NOT NULL DEFAULT 'OPEN',
    "paymentType" "PaymentType" NOT NULL DEFAULT 'COD',
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "podDocumentUrl" TEXT,
    "centralDispatchStatus" "ExternalPostingStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "centralDispatchId" TEXT,
    "centralDispatchError" TEXT,
    "brokerId" TEXT NOT NULL,
    "carrierId" TEXT,
    "driverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Load_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadRequest" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "bidPrice" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "loadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationHistory" (
    "id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadId" TEXT NOT NULL,

    CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "type" "InspectionType" NOT NULL,
    "inspectorId" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "vin" TEXT,
    "vinPhoto" TEXT,
    "signature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionPhoto" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionDamage" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "damageCode" TEXT NOT NULL,
    "severity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionDamage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE INDEX "Load_brokerId_idx" ON "Load"("brokerId");

-- CreateIndex
CREATE INDEX "Load_carrierId_idx" ON "Load"("carrierId");

-- CreateIndex
CREATE INDEX "Load_driverId_status_idx" ON "Load"("driverId", "status");

-- CreateIndex
CREATE INDEX "Load_status_idx" ON "Load"("status");

-- CreateIndex
CREATE INDEX "Load_status_createdAt_idx" ON "Load"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Load_originCity_idx" ON "Load"("originCity");

-- CreateIndex
CREATE INDEX "Load_destCity_idx" ON "Load"("destCity");

-- CreateIndex
CREATE INDEX "Load_originZip_idx" ON "Load"("originZip");

-- CreateIndex
CREATE INDEX "Load_destZip_idx" ON "Load"("destZip");

-- CreateIndex
CREATE INDEX "Load_distance_idx" ON "Load"("distance");

-- CreateIndex
CREATE INDEX "Load_deletedAt_idx" ON "Load"("deletedAt");

-- CreateIndex
CREATE INDEX "LoadRequest_carrierId_status_idx" ON "LoadRequest"("carrierId", "status");

-- CreateIndex
CREATE INDEX "LoadRequest_loadId_idx" ON "LoadRequest"("loadId");

-- CreateIndex
CREATE INDEX "LoadRequest_loadId_status_idx" ON "LoadRequest"("loadId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LoadRequest_loadId_carrierId_key" ON "LoadRequest"("loadId", "carrierId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_loadId_authorId_key" ON "Review"("loadId", "authorId");

-- CreateIndex
CREATE INDEX "LocationHistory_loadId_timestamp_idx" ON "LocationHistory"("loadId", "timestamp");

-- CreateIndex
CREATE INDEX "LocationHistory_timestamp_idx" ON "LocationHistory"("timestamp");

-- CreateIndex
CREATE INDEX "Message_loadId_createdAt_idx" ON "Message"("loadId", "createdAt");

-- CreateIndex
CREATE INDEX "Inspection_loadId_idx" ON "Inspection"("loadId");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_loadId_type_key" ON "Inspection"("loadId", "type");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadRequest" ADD CONSTRAINT "LoadRequest_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadRequest" ADD CONSTRAINT "LoadRequest_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionDamage" ADD CONSTRAINT "InspectionDamage_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

