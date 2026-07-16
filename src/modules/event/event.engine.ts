import { Event, EventStatus } from "@prisma/client";
import { eventRepository } from "./event.repository";
import { AppError } from "../../errors/AppError";

const VALID_TRANSITIONS: Partial<Record<EventStatus, EventStatus>> = {
  [EventStatus.WAITING]: EventStatus.IPO_RUNNING,
  [EventStatus.IPO_RUNNING]: EventStatus.IPO_PAUSED,
  [EventStatus.IPO_PAUSED]: EventStatus.IPO_RUNNING,
};

async function getEvent(): Promise<Event> {
  const event = await eventRepository.getEvent();

  if (!event) {
    throw new AppError(404, "Event not found.");
  }

  return event;
}

async function transition(
  from: EventStatus,
  to: EventStatus
): Promise<Event> {
  const event = await getEvent();

  if (event.status !== from) {
    throw new AppError(
      409,
      `Invalid transition: event is currently ${event.status}.`
    );
  }

  if (VALID_TRANSITIONS[from] !== to) {
    throw new AppError(
      409,
      `Transition from ${from} to ${to} is not allowed.`
    );
  }

  return eventRepository.updateStatus(event.id, to);
}

export const eventEngine = {
  async getEvent(): Promise<Event> {
    return getEvent();
  },

  async startEvent(): Promise<Event> {
    return transition(EventStatus.WAITING, EventStatus.IPO_RUNNING);
  },

  async pauseEvent(): Promise<Event> {
    return transition(EventStatus.IPO_RUNNING, EventStatus.IPO_PAUSED);
  },

  async resumeEvent(): Promise<Event> {
    return transition(EventStatus.IPO_PAUSED, EventStatus.IPO_RUNNING);
  },

  async completeEvent(): Promise<Event> {
    const event = await getEvent();

    if (event.status !== EventStatus.IPO_RUNNING) {
      throw new AppError(
        409,
        `Invalid transition: event is currently ${event.status}.`
      );
    }

    return eventRepository.updateStatus(event.id, EventStatus.IPO_COMPLETED);
  },
};
