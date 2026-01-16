-- CreateTable
CREATE TABLE "SportsRegistration" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "participationType" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "teamName" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SportsRegistration_pkey" PRIMARY KEY ("id")
);
