import { prisma } from "../../lib/prisma";
import { PackageStatus, EventStatus } from "@prisma/client";
import { AppError } from "../../errors/AppError";

export interface RawCompany {
  id: string;
  name: string;
  sector: string;
}

export interface RawPackageCompany {
  shares: number;
  company: RawCompany;
}

export interface RawOwnedPackage {
  packageCompanies: RawPackageCompany[];
}

export interface RawTransactionPackage {
  id: string;
  name: string;
}

export interface RawTransaction {
  winningBid: number;
  createdAt: Date;
  package: RawTransactionPackage;
}

export interface RawTeam {
  remainingCash: number;
  ownedPackages: RawOwnedPackage[];
  transactions: RawTransaction[];
}

export interface TeamConsoleRaw {
  team: RawTeam;
  packagesAuctioned: number;
}

export interface RawDashboardEvent {
  status: EventStatus;
  activePackageId: string | null;
}

export interface RawDashboardTeam {
  remainingCash: number;
  ownedPackages: { id: string }[];
  transactions: { winningBid: number }[];
}

export interface DashboardRaw {
  event: RawDashboardEvent;
  team: RawDashboardTeam;
  packagesAuctioned: number;
}

export const participantRepository = {
  async getTeamConsole(teamId: string): Promise<TeamConsoleRaw> {
    const [team, packagesAuctioned] = await Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        select: {
          remainingCash: true,
          ownedPackages: {
            select: {
              packageCompanies: {
                select: {
                  shares: true,
                  company: {
                    select: {
                      id: true,
                      name: true,
                      sector: true,
                    },
                  },
                },
              },
            },
          },
          transactions: {
            select: {
              winningBid: true,
              createdAt: true,
              package: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.package.count({
        where: {
          status: {
            not: PackageStatus.NOT_REVEALED,
          },
        },
      }),
    ]);

    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    return { team, packagesAuctioned };
  },

  async getDashboard(teamId: string): Promise<DashboardRaw> {
    const [event, team, packagesAuctioned] = await Promise.all([
      prisma.event.findFirst({
        select: {
          status: true,
          activePackageId: true,
        },
      }),
      prisma.team.findUnique({
        where: { id: teamId },
        select: {
          remainingCash: true,
          ownedPackages: {
            select: { id: true },
          },
          transactions: {
            select: { winningBid: true },
          },
        },
      }),
      prisma.package.count({
        where: {
          status: {
            not: PackageStatus.NOT_REVEALED,
          },
        },
      }),
    ]);

    if (!event) {
      throw new AppError(404, "Event not found.");
    }
    
    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    return { event, team, packagesAuctioned };
  },
};
