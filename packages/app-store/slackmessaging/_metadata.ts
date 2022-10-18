import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "Slack App",
  description: _package.description,
  category: "messaging",
  imageSrc: "/apps/slack.svg",
  logo: "/apps/slack.svg",
  publisher: "Cal.com",
  rating: 5,
  reviews: 69,
  slug: "slack",
  title: "Slack App",
  trending: true,
  type: "slack_messaging",
  url: "https://slack.com/",
  variant: "conferencing",
  verified: true,
  extendsFeature: "EventType",
  email: "help@cal.com",
} as AppMeta;

export default metadata;
