import { prisma } from "../../lib/prisma";

export interface MemberSummary {
  id: string;
  name: string;
}

export interface PackageSummary {
  id: string;
  name: string;
}

export interface PurchaseHistoryEntry {
  package: PackageSummary;
  winningBid: number;
  createdAt: Date;
}

export interface TeamDetail {
  id: string;
  name: string;
  remainingCash: number;
  members: MemberSummary[];
  ownedPackages: PackageSummary[];
  purchaseHistory: PurchaseHistoryEntry[];
}

export const teamRepository = {
  async findById(id: string): Promise<TeamDetail | null> {
    const team = await prisma.team.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        remainingCash: true,
        users: {
          select: {
            id: true,
            name: true,
          },
        },
        ownedPackages: {
          select: {
            id: true,
            name: true,
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
    });

    if (!team) {
      return null;
    }

    return {
      id: team.id,
      name: team.name,
      remainingCash: team.remainingCash,
      members: team.users,
      ownedPackages: team.ownedPackages,
      purchaseHistory: team.transactions.map((tx) => ({
        package: tx.package,
        winningBid: tx.winningBid,
        createdAt: tx.createdAt,
      })),
    };
  },
};
