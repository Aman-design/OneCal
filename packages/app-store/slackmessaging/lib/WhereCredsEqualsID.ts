export const WhereCredsEqualsId = (userId: string) => ({
  where: {
    type: "slack_messaging",
    key: {
      path: ["authed_user", "id"],
      equals: userId,
    },
  },
});
