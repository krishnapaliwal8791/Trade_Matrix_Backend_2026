import { prisma } from "../../lib/prisma";
import { Event, Package, PackageStatus } from "@prisma/client";

export const packageRepository = {
  async findAll(): Promise<Package[]> {
    return prisma.package.findMany();
  },

  async findById(id: string): Promise<Package | null> {
    return prisma.package.findUnique({ where: { id } });
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
    const [updatedPackage, updatedEvent] = await prisma.$transaction([
      prisma.package.update({
        where: { id: packageId },
        data: { status: PackageStatus.ACTIVE },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: { activePackageId: packageId },
      }),
    ]);

    return [updatedPackage, updatedEvent];
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
