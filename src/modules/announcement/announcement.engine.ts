import { Announcement } from "@prisma/client";
import {
  announcementRepository,
  AnnouncementWithAuthor,
} from "./announcement.repository";
import { AnnouncementInput } from "./announcement.validation";

export const announcementEngine = {
  async getAll(): Promise<AnnouncementWithAuthor[]> {
    return announcementRepository.findAll();
  },

  async create(
    input: AnnouncementInput,
    authorId: string
  ): Promise<Announcement> {
    return announcementRepository.create({
      message: input.message,
      authorId,
    });
  },
};
