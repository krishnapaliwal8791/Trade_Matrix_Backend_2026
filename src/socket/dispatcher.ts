import { getSocketIO } from "./socket";
import { EVENT } from "./rooms";
import * as Events from "./events";

// Typed dispatcher that emits the corresponding event to the EVENT room

export const eventStarted = (): void => {
  getSocketIO().to(EVENT).emit(Events.EVENT_STARTED);
};

export const packageActivated = (): void => {
  getSocketIO().to(EVENT).emit(Events.PACKAGE_ACTIVATED);
};

export const packageSold = (): void => {
  getSocketIO().to(EVENT).emit(Events.PACKAGE_SOLD);
};

export const packageUnsold = (): void => {
  getSocketIO().to(EVENT).emit(Events.PACKAGE_UNSOLD);
};

export const announcementCreated = (): void => {
  getSocketIO().to(EVENT).emit(Events.ANNOUNCEMENT_CREATED);
};

export const eventEnded = (): void => {
  getSocketIO().to(EVENT).emit(Events.EVENT_ENDED);
};

export const eventPaused = (): void => {
  getSocketIO().to(EVENT).emit(Events.EVENT_PAUSED);
};

export const eventResumed = (): void => {
  getSocketIO().to(EVENT).emit(Events.EVENT_RESUMED);
};
