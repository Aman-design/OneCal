import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { defaultHandler, defaultResponder } from "@calcom/lib/server";

import { showTodayMessage } from "../lib";
import showLinksMessage from "../lib/showLinksMessage";

export enum SlackAppCommands {
  TODAY = "today",
  LINKS = "links",
}

const commandHandlerBodySchema = z.object({
  command: z.string().min(1),
  user_id: z.string(),
  trigger_id: z.string(),
  channel_id: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = commandHandlerBodySchema.parse(req.body);
  const command = body.command.split("/").pop();
  switch (command) {
    case SlackAppCommands.TODAY:
      return await showTodayMessage(req, res);
    case SlackAppCommands.LINKS:
      return await showLinksMessage(req, res);
    default:
      return res.status(404).json({ message: `Command not found` });
  }
}

export default defaultHandler({
  POST: Promise.resolve({ default: defaultResponder(handler) }),
});
