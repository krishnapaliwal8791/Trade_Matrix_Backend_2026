import { z } from "zod";

export const transactionSchema = z.object({
  packageId: z.string().min(1, "packageId is required."),
  teamId: z.string().min(1, "teamId is required."),
  winningBid: z
    .number({ error: "winningBid must be a number." })
    .int("winningBid must be an integer.")
    .positive("winningBid must be a positive number."),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
