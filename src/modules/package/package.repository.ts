import { prisma } from "../../lib/prisma";
import { Event, Package, PackageStatus } from "@prisma/client";
import { AppError } from "../../errors/AppError";

export const packageRepository = {
  async findAll(): Promise<Package[]> {
    return prisma.package.findMany();
  },

  async findById(id: string): Promise<Package | null> {
    return prisma.package.findUnique({ where: { id } });
  },

  async findByIdWithCompanies(id: string) {
    return prisma.package.findUnique({
      where: { id },
      include: {
        packageCompanies: {
          select: {
            shares: true,
            company: {
              select: {
                id: true,
                name: true,
                sector: true,
                description: true,
                logo: true,
                initialPrice: true,
              },
            },
          },
        },
      },
    });
  },

  async findActive(): Promise<Package | null> {
    return prisma.package.findFirst({
      where: { status: PackageStatus.ACTIVE },
    });
  },

  

  async activatePackage(
    packageId: string,
    eventId: string
  ): Promise<[Package, Event]> {
    return prisma.$transaction(async (tx) => {
      // 1. Check Package is NOT_REVEALED (CAS) - Evaluated first to match legacy priority
      const packageUpdate = await tx.package.updateMany({
        where: { id: packageId, status: PackageStatus.NOT_REVEALED },
        data: { status: PackageStatus.ACTIVE },
      });

      if (packageUpdate.count === 0) {
        throw new AppError(
          409,
          "Package cannot be activated from its current status."
        );
      }

      // 2. Check Event has no active package (CAS) - Evaluated second
      const eventUpdate = await tx.event.updateMany({
        where: { id: eventId, activePackageId: null },
        data: { activePackageId: packageId },
      });

      if (eventUpdate.count === 0) {
        throw new AppError(409, "Another package is already active.");
      }

      // 3. Return updated entities
      const updatedPackage = await tx.package.findUnique({
        where: { id: packageId },
      });
      const updatedEvent = await tx.event.findUnique({
        where: { id: eventId },
      });

      return [updatedPackage!, updatedEvent!];
    });
  },

  async deactivatePackage(
    packageId: string,
    eventId: string
  ): Promise<[Package, Event]> {
    const [updatedPackage, updatedEvent] = await prisma.$transaction([
      prisma.package.update({
        where: { id: packageId },
        data: { status: PackageStatus.UNSOLD },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: { activePackageId: null },
      }),
    ]);

    return [updatedPackage, updatedEvent];
  },
};
