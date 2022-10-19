import { useState } from "react";

import { useAppContextWithSchema } from "@calcom/app-store/EventTypeAppContext";
import AppCard from "@calcom/app-store/_components/AppCard";
import type { EventTypeAppCardComponent } from "@calcom/app-store/types";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Skeleton, Label, Switch } from "@calcom/ui/v2";

import { appDataSchema } from "../zod";

const EventTypeAppCard: EventTypeAppCardComponent = function EventTypeAppCard({ eventType, app }) {
  const [getAppData, setAppData] = useAppContextWithSchema<typeof appDataSchema>();
  const [enabled, setEnabled] = useState(getAppData("enabled"));
  const { t } = useLocale();

  return (
    <AppCard setAppData={setAppData} app={app} switchOnClick={(e) => setEnabled(e)} switchChecked={enabled}>
      <div className="mt-4 text-sm">
        <div className="flex space-x-3">
          <Switch
            checked={getAppData("getNotifcations")}
            onCheckedChange={(e) => {
              setAppData("getNotifcations", e);
            }}
          />
          <div className="flex flex-col">
            <Skeleton as={Label} className="text-sm font-semibold leading-none text-black">
              {t("slack.booking_notifcations")}
            </Skeleton>
            <Skeleton as="p" className="-mt-2 text-sm leading-normal text-gray-600">
              {t("slack.booking_notifcations_description")}
            </Skeleton>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default EventTypeAppCard;
