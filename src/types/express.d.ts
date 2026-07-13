import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        clerkId: string;
        role: UserRole;
        teamId: string | null;
        name: string;
        email: string;
      };
    }
  }
}

export {};
