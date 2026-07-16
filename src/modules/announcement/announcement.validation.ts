import { z } from "zod";

export const announcementSchema = z.object({
  message: z
    .string({ error: "message is required." })
    .trim()
    .min(1, "message cannot be empty.")
    .max(500, "message cannot exceed 500 characters."),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
