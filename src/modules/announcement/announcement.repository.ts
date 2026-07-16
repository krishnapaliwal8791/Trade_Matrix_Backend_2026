import { prisma } from "../../lib/prisma";
import { Announcement } from "@prisma/client";

export interface AnnouncementWithAuthor {
  id: string;
  message: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
  };
}

export interface CreateAnnouncementInput {
  message: string;
  authorId: string;
}

export const announcementRepository = {
  async findAll(): Promise<AnnouncementWithAuthor[]> {
    return prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        message: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async create(input: CreateAnnouncementInput): Promise<Announcement> {
    return prisma.announcement.create({
      data: {
        message: input.message,
        authorId: input.authorId,
      },
    });
  },
};
