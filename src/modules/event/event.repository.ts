import { prisma } from "../../lib/prisma";
import { Event, EventStatus } from "@prisma/client";

export const eventRepository = {
  async getEvent(): Promise<Event | null> {
    return prisma.event.findFirst();
  },

  async updateStatus(id: string, status: EventStatus): Promise<Event> {
    return prisma.event.update({
      where: { id },
      data: { status },
    });
  },
};
