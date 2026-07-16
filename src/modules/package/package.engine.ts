import { Package, EventStatus, PackageStatus } from "@prisma/client";
import { AppError } from "../../errors/AppError";
import { packageRepository } from "./package.repository";
import { eventRepository } from "../event/event.repository";

async function requireRunningEvent(): Promise<{ id: string }> {
  const event = await eventRepository.getEvent();

  if (!event) {
    throw new AppError(404, "Event not found.");
  }

  if (event.status !== EventStatus.IPO_RUNNING) {
    throw new AppError(409, "Event is not currently running.");
  }

  return event;
}

export const packageEngine = {
  async getAllPackages(): Promise<Package[]> {
    return packageRepository.findAll();
  },

  async getPackageById(id: string): Promise<Package> {
    const pkg = await packageRepository.findById(id);

    if (!pkg) {
      throw new AppError(404, "Package not found.");
    }

    return pkg;
  },

  async getActivePackage(): Promise<Package> {
    const pkg = await packageRepository.findActive();

    if (!pkg) {
      throw new AppError(404, "No active package.");
    }

    return pkg;
  },

  async activatePackage(id: string): Promise<Package> {
    const event = await requireRunningEvent();

    const pkg = await packageRepository.findById(id);

    if (!pkg) {
      throw new AppError(404, "Package not found.");
    }

    if (pkg.status !== PackageStatus.NOT_REVEALED) {
      throw new AppError(
        409,
        "Package cannot be activated from its current status."
      );
    }

    const existing = await packageRepository.findActive();

    if (existing) {
      throw new AppError(409, "Another package is already active.");
    }

    const [activatedPackage] = await packageRepository.activatePackage(
      id,
      event.id
    );

    return activatedPackage;
  },

  async markUnsold(id: string): Promise<Package> {
    const event = await requireRunningEvent();


    const pkg = await packageRepository.findById(id);

    if (!pkg) {
      throw new AppError(404, "Package not found.");
    }

    if (pkg.status !== PackageStatus.ACTIVE) {
      throw new AppError(409, "Only an active package can be marked as unsold.");
    }

    const [updatedPackage] = await packageRepository.deactivatePackage(
      id,
      event.id
    );

    return updatedPackage;
  },
};
