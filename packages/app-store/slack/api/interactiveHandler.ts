import { NextApiRequest, NextApiResponse } from "next";

export default async function interactiveHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const payload = JSON.parse(req.body.payload);
    const actions = payload.view.callback_id;
    switch (actions) {
      default:
        return res.status(200).end(); // Techincally an invalid request but we don't want to return an throw an error to slack - 200 just does nothing
    }
  }
  return res.status(200).end(); // Send 200 if we dont have a case for the action_id
}
