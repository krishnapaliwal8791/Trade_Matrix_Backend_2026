import { NextFunction, Request, Response } from "express";
import { announcementEngine } from "./announcement.engine";

export async function getAnnouncements(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const announcements = await announcementEngine.getAll();
    res.status(200).json(announcements);
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await announcementEngine.create(req.body, req.user!.id);
    res.status(200).json({ message: "Announcement created." });
  } catch (err) {
    next(err);
  }
}
