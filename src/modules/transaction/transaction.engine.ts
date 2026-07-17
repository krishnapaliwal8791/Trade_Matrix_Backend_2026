import { Transaction, EventStatus, PackageStatus } from "@prisma/client";
import { AppError } from "../../errors/AppError";
import { eventRepository } from "../event/event.repository";
import { packageRepository } from "../package/package.repository";
import { transactionRepository } from "./transaction.repository";
import { TransactionInput } from "./transaction.validation";
import { dispatcher } from "../../socket";

export const transactionEngine = {
  async recordSale(
    input: TransactionInput,
    organizerId: string
  ): Promise<Transaction> {
    const { packageId, teamId, winningBid } = input;

    // 1. Event exists
    const event = await eventRepository.getEvent();

    if (!event) {
      throw new AppError(404, "Event not found.");
    }

    // 2. Event must be IPO_RUNNING
    if (event.status !== EventStatus.IPO_RUNNING) {
      throw new AppError(409, "Event is not currently running.");
    }

    // 3. Package exists
    const pkg = await packageRepository.findById(packageId);

    if (!pkg) {
      throw new AppError(404, "Package not found.");
    }

    // 4. Package must be ACTIVE
    if (pkg.status !== PackageStatus.ACTIVE) {
      throw new AppError(409, "Package is not active.");
    }

    // 5. Event.activePackageId must match
    if (event.activePackageId !== packageId) {
      throw new AppError(
        409,
        "Package is not the currently active package on the event."
      );
    }

    // 6. Package must not already have an owner
    if (pkg.ownerTeamId !== null) {
      throw new AppError(409, "Package already has an owner.");
    }

    // 7. Team exists
    const team = await transactionRepository.findTeamById(teamId);

    if (!team) {
      throw new AppError(404, "Team not found.");
    }

    // 8. winningBid >= basePrice
    if (winningBid < pkg.basePrice) {
      throw new AppError(
        409,
        "Winning bid cannot be lower than the package base price."
      );
    }

    // 9. Team has sufficient cash
    if (team.remainingCash < winningBid) {
      throw new AppError(409, "Team does not have sufficient remaining cash.");
    }

    const transaction = await transactionRepository.recordSale({
      packageId,
      teamId,
      organizerId,
      winningBid,
      eventId: event.id,
    });

    dispatcher.packageSold();

    return transaction;
  },
};
