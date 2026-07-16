import { NextFunction, Request, Response } from "express";
import { transactionEngine } from "./transaction.engine";

export async function recordSale(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await transactionEngine.recordSale(req.body, req.user!.id);
    res.status(200).json({ message: "Transaction recorded successfully." });
  } catch (err) {
    next(err);
  }
}
