import { shallow } from "zustand/shallow";

import type { Dayjs } from "@calcom/dayjs";
import dayjs from "@calcom/dayjs";
import { default as DatePickerComponent } from "@calcom/features/calendars/DatePicker";
import { useNonEmptyScheduleDays } from "@calcom/features/schedules";
import { weekdayToWeekIndex } from "@calcom/lib/date-fns";
import { useLocale } from "@calcom/lib/hooks/useLocale";

import { useBookerStore } from "../store";
import { useEvent, useScheduleForEvent } from "../utils/event";

export const DatePicker = () => {
  const { i18n } = useLocale();
  const [month, selectedDate] = useBookerStore((state) => [state.month, state.selectedDate], shallow);
  const [setSelectedDate, setMonth] = useBookerStore(
    (state) => [state.setSelectedDate, state.setMonth],
    shallow
  );
  const event = useEvent();
  const schedule = useScheduleForEvent();
  const nonEmptyScheduleDays = useNonEmptyScheduleDays(schedule?.data?.slots);

  return (
    <div className="mt-1">
      <DatePickerComponent
        isLoading={schedule.isLoading}
        onChange={(date: Dayjs) => {
          setSelectedDate(date.format("YYYY-MM-DD"));
        }}
        onMonthChange={(date: Dayjs) => {
          setMonth(date.format("YYYY-MM"));
        }}
        includedDates={nonEmptyScheduleDays}
        locale={i18n.language}
        browsingDate={month ? dayjs(month) : undefined}
        selected={dayjs(selectedDate)}
        weekStart={weekdayToWeekIndex(event?.data?.users?.[0]?.weekStart)}
      />
    </div>
  );
};
