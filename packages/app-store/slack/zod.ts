import { z } from "zod";

import { eventTypeAppCardZod } from "../eventTypeAppCardZod";

export const appDataSchema = eventTypeAppCardZod.merge(
  z.object({
    getNotifcations: z.boolean().optional(),
    bookableFromSlack: z.boolean().optional(),
  })
);
