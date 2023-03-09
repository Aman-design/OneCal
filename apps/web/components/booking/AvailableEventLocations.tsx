import { z } from "zod";

import { getEventLocationType, locationKeyToString } from "@calcom/app-store/locations";
import { classNames } from "@calcom/lib";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Tooltip } from "@calcom/ui";
import { FiLink } from "@calcom/ui/components/icon";

import type { Props } from "./pages/AvailabilityPage";

export function AvailableEventLocations({ locations }: { locations: Props["eventType"]["locations"] }) {
  const { t } = useLocale();

  return locations.length ? (
    <div className="dark:text-darkgray-600 mr-6 flex w-full flex-col space-y-4 break-words text-sm text-gray-600">
      {locations.map((location, index) => {
        const eventLocationType = getEventLocationType(location.type);
        if (!eventLocationType) {
          // It's possible that the location app got uninstalled
          return null;
        }

        const translateAbleKeys = [
          "attendee_in_person",
          "in_person",
          "attendee_phone_number",
          "link_meeting",
          "organizer_phone_number",
        ];

        const locationKey = z.string().default("").parse(locationKeyToString(location));

        const translatedLocation = location.type.startsWith("integrations:")
          ? eventLocationType.label
          : translateAbleKeys.includes(locationKey)
          ? t(locationKey)
          : locationKey;

        return (
          <div key={`${location.type}-${index}`} className="flex flex-row items-center text-sm font-medium">
            {eventLocationType.iconUrl === "/link.svg" ? (
              <FiLink className="dark:text-darkgray-600 min-h-4 min-w-4 ml-[2px] opacity-70 ltr:mr-[10px] rtl:ml-[10px] dark:opacity-100 " />
            ) : (
              <img
                src={eventLocationType.iconUrl}
                className={classNames(
                  "ml-[2px] h-4 w-4 opacity-70 ltr:mr-[10px] rtl:ml-[10px] dark:opacity-100 ",
                  !eventLocationType.iconUrl?.includes("api") ? "dark:invert-[.65]" : ""
                )}
                alt={`${eventLocationType.label} icon`}
              />
            )}
            <Tooltip content={translatedLocation}>
              <p className="line-clamp-1">{translatedLocation}</p>
            </Tooltip>
          </div>
        );
      })}
    </div>
  ) : null;
}
