-- CreateTable
CREATE TABLE `PasswordFingerprint` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `site` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `structure` VARCHAR(191) NOT NULL,
    `baseWord` VARCHAR(191) NOT NULL,
    `numbers` VARCHAR(191) NOT NULL,
    `symbols` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PasswordFingerprint_userId_site_idx`(`userId`, `site`),
    INDEX `PasswordFingerprint_userId_passwordHash_idx`(`userId`, `passwordHash`),
    INDEX `PasswordFingerprint_userId_structure_idx`(`userId`, `structure`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RiskEvent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `site` VARCHAR(191) NOT NULL,
    `riskScore` VARCHAR(191) NOT NULL,
    `numericScore` INTEGER NOT NULL,
    `reasonsJson` VARCHAR(191) NOT NULL,
    `fingerprintId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RiskEvent_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `RiskEvent_riskScore_createdAt_idx`(`riskScore`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RiskEvent` ADD CONSTRAINT `RiskEvent_fingerprintId_fkey` FOREIGN KEY (`fingerprintId`) REFERENCES `PasswordFingerprint`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
