import { NextFunction, Request, Response } from "express";
import { participantEngine } from "./participant.engine";
import { AppError } from "../../errors/AppError";

export async function getTeamConsole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.teamId) {
      throw new AppError(403, "You are not assigned to a team.");
    }

    const result = await participantEngine.getTeamConsole(req.user.teamId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.teamId) {
      throw new AppError(403, "You are not assigned to a team.");
    }

    const result = await participantEngine.getDashboard(req.user.teamId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
