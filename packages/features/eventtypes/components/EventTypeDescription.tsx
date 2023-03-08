import type { Prisma } from "@prisma/client";
import { SchedulingType } from "@prisma/client";
import { useMemo } from "react";
import { FormattedNumber, IntlProvider } from "react-intl";
import type { z } from "zod";

import { classNames, parseRecurringEvent } from "@calcom/lib";
import getPaymentAppData from "@calcom/lib/getPaymentAppData";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { addListFormatting, md } from "@calcom/lib/markdownIt";
import type { baseEventTypeSelect } from "@calcom/prisma";
import type { EventTypeModel } from "@calcom/prisma/zod";
import { Badge } from "@calcom/ui";
import {
  FiClock,
  FiUsers,
  FiRefreshCw,
  FiCreditCard,
  FiClipboard,
  FiPlus,
  FiUser,
} from "@calcom/ui/components/icon";

export type EventTypeDescriptionProps = {
  eventType: Pick<
    z.infer<typeof EventTypeModel>,
    Exclude<keyof typeof baseEventTypeSelect, "recurringEvent"> | "metadata"
  > & {
    recurringEvent: Prisma.JsonValue;
    seatsPerTimeSlot?: number;
  };
  className?: string;
  shortenDescription?: boolean;
};

export const EventTypeDescription = ({
  eventType,
  className,
  shortenDescription,
}: EventTypeDescriptionProps) => {
  const { t } = useLocale();

  const recurringEvent = useMemo(
    () => parseRecurringEvent(eventType.recurringEvent),
    [eventType.recurringEvent]
  );

  const stripeAppData = getPaymentAppData(eventType);

  return (
    <>
      <div className={classNames("dark:text-darkgray-800 text-gray-500", className)}>
        {eventType.description && (
          <div
            className={classNames(
              "dark:text-darkgray-800 max-w-[280px] break-words py-1 text-sm text-gray-500 sm:max-w-[500px] [&_a]:text-blue-500 [&_a]:underline [&_a]:hover:text-blue-600",
              shortenDescription ? "line-clamp-4" : ""
            )}
            dangerouslySetInnerHTML={{
              __html: addListFormatting(md.render(eventType.description)),
            }}
          />
        )}
        <ul className="mt-2 flex flex-wrap space-x-2 rtl:space-x-reverse">
          {eventType.metadata?.multipleDuration ? (
            eventType.metadata.multipleDuration.map((dur, idx) => (
              <li key={idx}>
                <Badge variant="gray" size="lg" StartIcon={FiClock}>
                  {dur}m
                </Badge>
              </li>
            ))
          ) : (
            <li>
              <Badge variant="gray" size="lg" StartIcon={FiClock}>
                {eventType.length}m
              </Badge>
            </li>
          )}
          {eventType.schedulingType && (
            <li>
              <Badge variant="gray" size="lg" StartIcon={FiUsers}>
                {eventType.schedulingType === SchedulingType.ROUND_ROBIN && t("round_robin")}
                {eventType.schedulingType === SchedulingType.COLLECTIVE && t("collective")}
              </Badge>
            </li>
          )}
          {recurringEvent?.count && recurringEvent.count > 0 && (
            <li className="hidden xl:block">
              <Badge variant="gray" size="lg" StartIcon={FiRefreshCw}>
                {t("repeats_up_to", {
                  count: recurringEvent.count,
                })}
              </Badge>
            </li>
          )}
          {stripeAppData.price > 0 && (
            <li>
              <Badge variant="gray" size="lg" StartIcon={FiCreditCard}>
                <IntlProvider locale="en">
                  <FormattedNumber
                    value={stripeAppData.price / 100.0}
                    style="currency"
                    currency={stripeAppData?.currency?.toUpperCase()}
                  />
                </IntlProvider>
              </Badge>
            </li>
          )}
          {eventType.requiresConfirmation && (
            <li className="hidden xl:block">
              <Badge variant="gray" size="lg" StartIcon={FiClipboard}>
                {eventType.metadata?.requiresConfirmationThreshold
                  ? t("may_require_confirmation")
                  : t("requires_confirmation")}
              </Badge>
            </li>
          )}
          {/* TODO: Maybe add a tool tip to this? */}
          {eventType.requiresConfirmation || (recurringEvent?.count && recurringEvent.count) ? (
            <li className="block xl:hidden">
              <Badge variant="gray" size="lg" StartIcon={FiPlus}>
                <p>{[eventType.requiresConfirmation, recurringEvent?.count].filter(Boolean).length}</p>
              </Badge>
            </li>
          ) : (
            <></>
          )}
          {eventType?.seatsPerTimeSlot ? (
            <li>
              <Badge variant="gray" size="lg" StartIcon={FiUser}>
                <p>{t("event_type_seats", { numberOfSeats: eventType.seatsPerTimeSlot })} </p>
              </Badge>
            </li>
          ) : null}
        </ul>
      </div>
    </>
  );
};

export default EventTypeDescription;
