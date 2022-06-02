import { z } from "zod";

import { checkPremiumUsername } from "@calcom/ee/lib/core/checkPremiumUsername";
import { deleteStripeCustomer } from "@calcom/stripe/customer";

import { checkRegularUsername } from "@lib/core/checkRegularUsername";
import slugify from "@lib/slugify";

import { createProtectedRouter } from "@server/createRouter";
import { resizeBase64Image } from "@server/lib/resizeBase64Image";
import { TRPCError } from "@trpc/server";

const checkUsername =
  process.env.NEXT_PUBLIC_WEBSITE_URL === "https://cal.com" ? checkPremiumUsername : checkRegularUsername;

export const profileRouter = createProtectedRouter()
  .mutation("deleteAccount", {
    async resolve({ ctx }) {
      const { user, prisma } = ctx;
      // Delete from stripe
      await deleteStripeCustomer(user).catch(console.warn);
      // Delete from Cal
      await prisma.user.delete({
        where: {
          id: user.id,
        },
      });
    },
  })
  .mutation("update", {
    input: z.object({
      username: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
      timeZone: z.string().optional(),
      weekStart: z.string().optional(),
      hideBranding: z.boolean().optional(),
      allowDynamicBooking: z.boolean().optional(),
      brandColor: z.string().optional(),
      darkBrandColor: z.string().optional(),
      theme: z.string().optional().nullable(),
      completedOnboarding: z.boolean().optional(),
      locale: z.string().optional(),
      timeFormat: z.number().optional(),
      disableImpersonation: z.boolean().optional(),
    }),
    async resolve({ input, ctx }) {
      const { user, prisma } = ctx;
      const data = {
        ...input,
      };
      if (input.username) {
        const username = slugify(input.username);
        // Only validate if we're changing usernames
        if (username !== user.username) {
          data.username = username;
          const response = await checkUsername(username);
          if (!response.available || ("premium" in response && response.premium)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: response.message });
          }
        }
      }
      if (input.avatar) {
        data.avatar = await resizeBase64Image(input.avatar);
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data,
      });
    },
  });
