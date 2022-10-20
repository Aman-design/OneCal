import { App, Installation } from "@slack/bolt";
import * as dotenv from "dotenv";
import * as path from "path";

import prisma from "@calcom/prisma";

// see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config({ path: path.resolve(__dirname, "../../../.env.appStore") });

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
  port: Number(process.env.BOLT_SERVER_PORT) || 3360,
  stateSecret: "my-state-secret",
  scopes: ["commands", "channel:history", "groups:history", "im:history", "mpim:history"],
  installationStore: {
    storeInstallation: async (installation) => {
      // change the line below so it saves to your database
      if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
        // support for org wide app installation
        await prisma.slackInstallations.create({
          data: {
            key: installation.enterprise.id,
            data: JSON.stringify(installation),
          },
        });
        return;
      }
      if (installation.team !== undefined) {
        // single team app installation
        await prisma.slackInstallations.create({
          data: {
            key: installation.team.id,
            data: JSON.stringify(installation),
          },
        });
        return;
      }
      throw new Error("Failed saving installation data to installationStore");
    },
    fetchInstallation: async (installQuery) => {
      // change the line below so it fetches from your database
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        // org wide app installation lookup
        const install = await prisma.slackInstallations.findFirstOrThrow({
          where: { key: installQuery.enterpriseId },
        });

        return install.data as unknown as Installation<"v1" | "v2", boolean>;
      }
      if (installQuery.teamId !== undefined) {
        // single team app installation lookup
        const install = await prisma.slackInstallations.findFirstOrThrow({
          where: { key: installQuery.teamId },
        });

        return install.data as unknown as Installation<"v1" | "v2", boolean>;
      }
      throw new Error("Failed fetching installation");
    },
    deleteInstallation: async (installQuery) => {
      // change the line below so it deletes from your database
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        // org wide app installation deletion
        await prisma.slackInstallations.delete({ where: { key: installQuery.enterpriseId } });
        return;
      }
      if (installQuery.teamId !== undefined) {
        // single team app installation deletion
        await prisma.slackInstallations.delete({ where: { key: installQuery.teamId } });
        return;
      }
      throw new Error("Failed to delete installation");
    },
  },
  installerOptions: {
    directInstall: false,
    redirectUriPath: "https://itchy-vampirebat-2.telebit.io/api/integrations/slack/callback",
  },
});

(async () => {
  // Start your app
  await app.start();

  console.log("⚡️ Bolt app is running!");
})();
