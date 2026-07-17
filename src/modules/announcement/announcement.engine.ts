import { Announcement } from "@prisma/client";
import {
  announcementRepository,
  AnnouncementWithAuthor,
} from "./announcement.repository";
import { AnnouncementInput } from "./announcement.validation";
import { dispatcher } from "../../socket";

export const announcementEngine = {
  async getAll(): Promise<AnnouncementWithAuthor[]> {
    return announcementRepository.findAll();
  },

  async create(
    input: AnnouncementInput,
    authorId: string
  ): Promise<Announcement> {
    const announcement = await announcementRepository.create({
      message: input.message,
      authorId,
    });
    dispatcher.announcementCreated();
    return announcement;
  },
};
