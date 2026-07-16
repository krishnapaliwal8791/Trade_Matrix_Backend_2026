import { NextFunction, Request, Response } from "express";
import { teamEngine } from "./team.engine";

export async function getTeam(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const team = await teamEngine.getTeamById(req.params.id as string);
    res.status(200).json(team);
  } catch (err) {
    next(err);
  }
}
