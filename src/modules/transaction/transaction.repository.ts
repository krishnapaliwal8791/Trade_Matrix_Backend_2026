import { prisma } from "../../lib/prisma";
import { Team, Transaction } from "@prisma/client";
import { PackageStatus } from "@prisma/client";

export interface RecordSaleInput {
  packageId: string;
  teamId: string;
  organizerId: string;
  winningBid: number;
  eventId: string;
}

export const transactionRepository = {
  async findTeamById(id: string): Promise<Team | null> {
    return prisma.team.findUnique({ where: { id } });
  },

  async recordSale(input: RecordSaleInput): Promise<Transaction> {
    const { packageId, teamId, organizerId, winningBid, eventId } = input;

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: { packageId, teamId, organizerId, winningBid },
      }),
      prisma.team.update({
        where: { id: teamId },
        data: { remainingCash: { decrement: winningBid } },
      }),
      prisma.package.update({
        where: { id: packageId },
        data: {
          ownerTeamId: teamId,
          winningBid,
          status: PackageStatus.SOLD,
        },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: { activePackageId: null },
      }),
    ]);

    return transaction;
  },
};
