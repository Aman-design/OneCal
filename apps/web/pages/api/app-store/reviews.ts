import dayjs from "dayjs";
import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "@calcom/prisma";

import { getSession } from "@lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("This triggers ");
  if (req.method === "POST") {
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    await prisma.appReview.create({
      data: {
        slug: req.body.slug,
        date: dayjs().toISOString(),
        user: {
          connect: {
            id: session.user.id,
          },
        },
        rating: req.body.rating,
        comment: req.body.comment,
      },
    });
  }

  res.end();
}
