import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { userRepository } from "../modules/user/user.repository";


export async function loadUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId: clerkId } = getAuth(req);

  // auth middleware guarantees userId is present — this is a safety guard
  if (!clerkId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await userRepository.findByClerkId(clerkId);

  if (!user) {
    res.status(403).json({ message: "You are not registered for this event." });
    return;
  }

  req.user = {
    id: user.id,
    clerkId: user.clerkId,
    role: user.role,
    teamId: user.teamId,
    name: user.name,
    email: user.email,
  };

  next();
}
