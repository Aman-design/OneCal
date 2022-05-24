import { PrismaAdapter } from "@next-auth/prisma-adapter";
import dayjs from "dayjs";
import { z } from "zod";

import { createProtectedRouter } from "@server/createRouter";
import { TRPCError } from "@trpc/server";

export const appReviewsRouter = createProtectedRouter().mutation("post", {
  input: z.object({
    slug: z.string(),
    rating: z.number(),
    comment: z.string(),
  }),
  async resolve({ ctx, input }) {
    const { slug, rating, comment } = input;
    const { prisma, user } = ctx;

    await prisma.appReview.create({
      data: {
        slug: slug,
        date: dayjs().toISOString(),
        user: {
          connect: {
            id: user.id,
          },
        },
        rating: rating,
        comment: comment,
      },
    });
  },
});
