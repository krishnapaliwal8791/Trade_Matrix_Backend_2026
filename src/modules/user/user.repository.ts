import { prisma } from "../../lib/prisma";
import { User } from "@prisma/client";

export const userRepository = {
  async findByClerkId(clerkId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { clerkId },
    });
  },
};
