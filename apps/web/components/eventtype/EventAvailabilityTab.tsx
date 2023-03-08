import { SchedulingType } from "@prisma/client";
import type { FormValues, EventTypeSetup } from "pages/event-types/[type]";
import { Controller, useFormContext } from "react-hook-form";
import type { OptionProps, SingleValueProps } from "react-select";
import { components } from "react-select";

import dayjs from "@calcom/dayjs";
import classNames from "@calcom/lib/classNames";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import lockedFieldsManager from "@calcom/lib/lockedFieldsManager";
import { weekdayNames } from "@calcom/lib/weekday";
import { trpc } from "@calcom/trpc/react";
import useMeQuery from "@calcom/trpc/react/hooks/useMeQuery";
import { Badge, Button, Select, SettingsToggle, SkeletonText } from "@calcom/ui";
import { FiExternalLink, FiGlobe } from "@calcom/ui/components/icon";

import { SelectSkeletonLoader } from "@components/availability/SkeletonLoader";

type AvailabilityOption = {
  label: string;
  value: number;
  isDefault: boolean;
};

const Option = ({ ...props }: OptionProps<AvailabilityOption>) => {
  const { label, isDefault } = props.data;
  const { t } = useLocale();
  return (
    <components.Option {...props}>
      <span>{label}</span>
      {isDefault && (
        <Badge variant="blue" className="ml-2">
          {t("default")}
        </Badge>
      )}
    </components.Option>
  );
};

const SingleValue = ({ ...props }: SingleValueProps<AvailabilityOption>) => {
  const { label, isDefault } = props.data;
  const { t } = useLocale();
  return (
    <components.SingleValue {...props}>
      <span>{label}</span>
      {isDefault && (
        <Badge variant="blue" className="ml-2">
          {t("default")}
        </Badge>
      )}
    </components.SingleValue>
  );
};

const AvailabilitySelect = ({
  className = "",
  options,
  value,
  ...props
}: {
  className?: string;
  name: string;
  value: AvailabilityOption | undefined;
  options: AvailabilityOption[];
  isDisabled?: boolean;
  onBlur: () => void;
  onChange: (value: AvailabilityOption | null) => void;
}) => {
  const { t } = useLocale();
  return (
    <Select
      placeholder={t("select")}
      options={options}
      isDisabled={props.isDisabled}
      isSearchable={false}
      onChange={props.onChange}
      className={classNames("block w-full min-w-0 flex-1 rounded-sm text-sm", className)}
      defaultValue={value}
      components={{ Option, SingleValue }}
      isMulti={false}
    />
  );
};

const format = (date: Date, hour12: boolean) =>
  Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "numeric", hour12 }).format(
    new Date(dayjs.utc(date).format("YYYY-MM-DDTHH:mm:ss"))
  );

const EventTypeScheduleDetails = ({
  isManagedEventType,
  selectedScheduleValue,
}: {
  isManagedEventType: boolean;
  selectedScheduleValue: AvailabilityOption | undefined;
}) => {
  const { data: loggedInUser } = useMeQuery();
  const timeFormat = loggedInUser?.timeFormat;
  const { t, i18n } = useLocale();
  const { watch } = useFormContext<FormValues>();

  const scheduleId = watch("schedule");
  const { isLoading, data: schedule } = trpc.viewer.availability.schedule.get.useQuery(
    {
      scheduleId: scheduleId || loggedInUser?.defaultScheduleId || selectedScheduleValue?.value || undefined,
      isManagedEventType,
    },
    { enabled: !!scheduleId || !!loggedInUser?.defaultScheduleId || !!selectedScheduleValue }
  );

  const filterDays = (dayNum: number) =>
    schedule?.schedule.filter((item) => item.days.includes((dayNum + 1) % 7)) || [];

  return (
    <div className="space-y-4 rounded border px-6 pb-4">
      <ol className="table border-collapse text-sm">
        {weekdayNames(i18n.language, 1, "long").map((day, index) => {
          const isAvailable = !!filterDays(index).length;
          return (
            <li key={day} className="my-6 flex border-transparent last:mb-2">
              <span
                className={classNames(
                  "w-20 font-medium sm:w-32",
                  !isAvailable && "text-gray-500 opacity-50"
                )}>
                {day}
              </span>
              {isLoading ? (
                <SkeletonText className="block h-5 w-60" />
              ) : isAvailable ? (
                <div className="space-y-3 text-right">
                  {filterDays(index).map((dayRange, i) => (
                    <div key={i} className="flex items-center leading-4">
                      <span className="w-16 sm:w-28 sm:text-left">
                        {format(dayRange.startTime, timeFormat === 12)}
                      </span>
                      <span className="ltr:ml-4 rtl:mr-4">-</span>
                      <div className="ml-6">{format(dayRange.endTime, timeFormat === 12)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="ml-6 text-gray-500 opacity-50 sm:ml-0">{t("unavailable")}</span>
              )}
            </li>
          );
        })}
      </ol>
      <hr />
      <div className="flex flex-col justify-center gap-2 sm:flex-row sm:justify-between">
        <span className="flex items-center justify-center text-sm text-gray-600 sm:justify-start">
          <FiGlobe className="ltr:mr-2 rtl:ml-2" />
          {schedule?.timeZone || <SkeletonText className="block h-5 w-32" />}
        </span>
        {!!schedule?.id && (
          <Button
            href={`/availability/${schedule.id}`}
            disabled={isLoading}
            color="minimal"
            EndIcon={FiExternalLink}
            target="_blank"
            rel="noopener noreferrer">
            {t("edit_availability")}
          </Button>
        )}
      </div>
    </div>
  );
};

const EventTypeSchedule = ({ eventType }: { eventType: EventTypeSetup }) => {
  const { t } = useLocale();
  const { shouldLockIndicator, shouldLockDisableProps, isManagedEventType } = lockedFieldsManager(
    eventType,
    t("locked_fields_description")
  );
  const { watch } = useFormContext<FormValues>();
  const watchSchedule = watch("schedule");

  const { data, isLoading } = trpc.viewer.availability.list.useQuery();

  const schedules = data?.schedules || [];

  const options = schedules.map((schedule) => ({
    value: schedule.id,
    label: schedule.name,
    isDefault: schedule.isDefault,
  }));

  if (isManagedEventType) {
    options.push({
      value: 0,
      label: t("members_default_schedule"),
      isDefault: false,
    });
  }

  const value = options.find((option) =>
    watchSchedule
      ? option.value === watchSchedule
      : isManagedEventType
      ? option.value === 0
      : option.value === schedules.find((schedule) => schedule.isDefault)?.id
  );

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="availability" className="mb-2 block text-sm font-medium leading-none text-gray-700">
          <>
            {t("availability")}
            {shouldLockIndicator("availability")}
          </>
        </label>
        <Controller
          name="schedule"
          render={({ field }) =>
            isLoading ? (
              <SelectSkeletonLoader />
            ) : (
              <AvailabilitySelect
                value={value}
                options={options}
                onBlur={field.onBlur}
                isDisabled={shouldLockDisableProps("availability").disabled}
                name={field.name}
                onChange={(selected) => {
                  field.onChange(selected?.value || null);
                }}
              />
            )
          }
        />
      </div>
      {isManagedEventType || value?.value !== 0 ? (
        <EventTypeScheduleDetails selectedScheduleValue={value} isManagedEventType={isManagedEventType} />
      ) : (
        isManagedEventType && (
          <p className="!mt-2 ml-1 text-sm text-gray-600">{t("members_default_schedule_description")}</p>
        )
      )}
    </div>
  );
};

const UseCommonScheduleSettingsToggle = ({ eventType }: { eventType: EventTypeSetup }) => {
  const { t } = useLocale();
  const { resetField, setValue } = useFormContext<FormValues>();
  return (
    <Controller
      name="metadata.config.useHostSchedulesForTeamEvent"
      render={({ field: { value, onChange } }) => (
        <SettingsToggle
          checked={!value}
          onCheckedChange={(checked) => {
            onChange(!checked);
            if (checked) {
              resetField("schedule");
            } else {
              setValue("schedule", null);
            }
          }}
          title={t("choose_common_schedule_team_event")}
          description={t("choose_common_schedule_team_event_description")}>
          <EventTypeSchedule eventType={eventType} />
        </SettingsToggle>
      )}
    />
  );
};

export const EventAvailabilityTab = ({
  eventType,
  isTeamEvent,
}: {
  eventType: EventTypeSetup;
  isTeamEvent: boolean;
}) => {
  return isTeamEvent && eventType.schedulingType !== SchedulingType.MANAGED ? (
    <UseCommonScheduleSettingsToggle eventType={eventType} />
  ) : (
    <EventTypeSchedule eventType={eventType} />
  );
};
