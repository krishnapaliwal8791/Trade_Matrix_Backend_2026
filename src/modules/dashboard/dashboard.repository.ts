import { prisma } from "../../lib/prisma";
import { PackageStatus } from "@prisma/client";
import type { EventStatus } from "@prisma/client";
import { AppError } from "../../errors/AppError";

export interface EventSummary {
  status: EventStatus;
  activePackageId: string | null;
}

export interface PackageSummary {
  id: string;
  name: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  remainingCash: number;
}

export interface LiveDashboard {
  event: EventSummary;
  availablePackages: PackageSummary[];
  unsoldPackages: PackageSummary[];
  soldPackages: PackageSummary[];
  teams: TeamSummary[];
}

export const dashboardRepository = {
  async getLiveDashboard(): Promise<LiveDashboard> {
    const [event, availablePackages, unsoldPackages, soldPackages, teams] =
      await Promise.all([
        prisma.event.findFirst({
          select: {
            status: true,
            activePackageId: true,
          },
        }),
        prisma.package.findMany({
          where: { status: PackageStatus.NOT_REVEALED },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.package.findMany({
          where: { status: PackageStatus.UNSOLD },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.package.findMany({
          where: { status: PackageStatus.SOLD },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.team.findMany({
          select: { id: true, name: true, remainingCash: true },
          orderBy: { name: "asc" },
        }),
      ]);

    if (!event) {
      throw new AppError(404, "Event not found.");
    }

    return {
      event,
      availablePackages,
      unsoldPackages,
      soldPackages,
      teams,
    };
  },
};
