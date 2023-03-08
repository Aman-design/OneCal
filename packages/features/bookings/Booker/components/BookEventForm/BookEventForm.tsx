import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";
import type { FieldError } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { TFunction } from "react-i18next";
import { z } from "zod";

import type { EventLocationType } from "@calcom/app-store/locations";
import { createPaymentLink } from "@calcom/app-store/stripepayment/lib/client";
import dayjs from "@calcom/dayjs";
import {
  useTimePreferences,
  mapBookingToMutationInput,
  createBooking,
  createRecurringBooking,
  mapRecurringBookingToMutationInput,
} from "@calcom/features/bookings/lib";
import getBookingResponsesSchema from "@calcom/features/bookings/lib/getBookingResponsesSchema";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { HttpError } from "@calcom/lib/http-error";
import { Form, Button, Alert, EmptyScreen } from "@calcom/ui";
import { FiCalendar } from "@calcom/ui/components/icon";

import { useBookerStore } from "../../store";
import { useEvent } from "../../utils/event";
import { BookingFields } from "./BookingFields";
import { FormSkeleton } from "./Skeleton";

type BookEventFormProps = {
  onCancel?: () => void;
};

const getSuccessPath = ({
  uid,
  email,
  slug,
  formerTime,
  isRecurring,
}: {
  uid: string;
  email: string;
  slug: string;
  formerTime?: string;
  isRecurring: boolean;
}) => ({
  pathname: `/booking/${uid}`,
  query: {
    [isRecurring ? "allRemainingBookings" : "isSuccessBookingPage"]: true,
    email: email,
    eventTypeSlug: slug,
    formerTime: formerTime,
  },
});

export const BookEventForm = ({ onCancel }: BookEventFormProps) => {
  const router = useRouter();
  const { t, i18n } = useLocale();
  const { timezone } = useTimePreferences();
  const rescheduleUid = useBookerStore((state) => state.rescheduleUid);
  const rescheduleBooking = useBookerStore((state) => state.rescheduleBooking);
  const eventSlug = useBookerStore((state) => state.eventSlug);
  const duration = useBookerStore((state) => state.selectedDuration);
  const timeslot = useBookerStore((state) => state.selectedTimeslot);
  const recurringEventCount = useBookerStore((state) => state.recurringEventCount);
  const username = useBookerStore((state) => state.username);
  const isRescheduling = !!rescheduleUid && !!rescheduleBooking;
  const event = useEvent();

  const defaultValues = () => {
    if (isRescheduling) {
      return {
        responses: {
          email: rescheduleBooking?.attendees?.[0].email,
          name: rescheduleBooking?.attendees?.[0].name,
        },
      };
    }
    return {};
  };

  const bookingFormSchema = z
    .object({
      responses: event?.data?.bookingFields
        ? getBookingResponsesSchema({
            bookingFields: event.data.bookingFields,
          })
        : // Fallback until event is loaded.
          z.object({}),
    })
    .passthrough();

  type BookingFormValues = {
    locationType?: EventLocationType["type"];
    responses: z.infer<typeof bookingFormSchema>["responses"];
    // Key is not really part of form values, but only used to have a key
    // to set generic error messages on. Needed until RHF has implemented root error keys.
    globalError: undefined;
  };

  const bookingForm = useForm<BookingFormValues>({
    defaultValues: defaultValues(),
    resolver: zodResolver(bookingFormSchema), // Since this isn't set to strict we only validate the fields in the schema
  });

  const createBookingMutation = useMutation(createBooking, {
    onSuccess: async (responseData) => {
      const { uid, paymentUid } = responseData;
      if (paymentUid) {
        return await router.push(
          createPaymentLink({
            paymentUid,
            date: timeslot,
            name: bookingForm.getValues("responses.name"),
            email: bookingForm.getValues("responses.email"),
            absolute: false,
          })
        );
      }

      return await router.push(
        getSuccessPath({
          uid,
          email: bookingForm.getValues("responses.email"),
          formerTime: rescheduleBooking?.startTime
            ? dayjs(rescheduleBooking?.startTime).toISOString()
            : undefined,
          slug: `${eventSlug}`,
          isRecurring: false,
        })
      );
    },
  });

  const createRecurringBookingMutation = useMutation(createRecurringBooking, {
    onSuccess: async (responseData) => {
      const { uid } = responseData[0] || {};
      return await router.push(
        getSuccessPath({
          uid,
          email: bookingForm.getValues("responses.email"),
          slug: `${eventSlug}`,
          isRecurring: true,
        })
      );
    },
  });

  if (event.isError) return <Alert severity="warning" message={t("error_booking_event")} />;
  if (event.isLoading || !event.data) return <FormSkeleton />;
  if (!timeslot)
    return (
      <EmptyScreen
        headline={t("timeslot_missing_title")}
        description={t("timeslot_missing_description")}
        Icon={FiCalendar}
        buttonText={t("timeslot_missing_cta")}
        buttonOnClick={onCancel}
      />
    );

  const bookEvent = (values: BookingFormValues) => {
    bookingForm.clearErrors();

    // It shouldn't be possible that this method is fired without having event data,
    // but since in theory (looking at the types) it is possible, we still handle that case.
    if (!event?.data) {
      bookingForm.setError("globalError", { message: t("error_booking_event") });
      return;
    }

    // Ensures that duration is an allowed value, if not it defaults to the
    // default event duration.
    const validDuration =
      duration &&
      event.data.metadata?.multipleDuration &&
      event.data.metadata?.multipleDuration.includes(duration)
        ? duration
        : event.data.length;

    const bookingInput = {
      values,
      duration: validDuration,
      event: event.data,
      date: timeslot,
      timeZone: timezone,
      language: i18n.language,
      rescheduleUid: rescheduleUid || undefined,
      username: username || "",
    };

    if (event.data?.recurringEvent?.freq && recurringEventCount) {
      createRecurringBookingMutation.mutate(
        mapRecurringBookingToMutationInput(bookingInput, recurringEventCount)
      );
    } else {
      createBookingMutation.mutate(mapBookingToMutationInput(bookingInput));
    }
  };

  const eventType = event.data;

  return (
    <div>
      <Form className="space-y-4" form={bookingForm} handleSubmit={bookEvent} noValidate>
        <BookingFields
          // @TODO: Make dynamic
          isDynamicGroupBooking={false}
          fields={eventType.bookingFields}
          locations={eventType.locations}
          rescheduleUid={rescheduleUid || undefined}
        />

        <div className="flex justify-end space-x-2 rtl:space-x-reverse">
          {!!onCancel && (
            <Button color="minimal" type="button" onClick={onCancel}>
              {t("back")}
            </Button>
          )}
          <Button
            type="submit"
            loading={createBookingMutation.isLoading || createRecurringBookingMutation.isLoading}
            data-testid={rescheduleUid ? "confirm-reschedule-button" : "confirm-book-button"}>
            {rescheduleUid ? t("reschedule") : t("confirm")}
          </Button>
        </div>
      </Form>
      {(createBookingMutation.isError ||
        createRecurringBookingMutation.isError ||
        bookingForm.formState.errors["globalError"]) && (
        <div data-testid="booking-fail">
          <Alert
            className="mt-2"
            severity="warning"
            title={rescheduleUid ? t("reschedule_fail") : t("booking_fail")}
            message={getError(
              bookingForm.formState.errors["globalError"],
              createBookingMutation,
              createRecurringBookingMutation,
              t
            )}
          />
        </div>
      )}
    </div>
  );
};

const getError = (
  globalError: FieldError | undefined,
  // It feels like an implementation detail to reimplement the types of useMutation here.
  // Since they don't matter for this function, I'd rather disable them then giving you
  // the cognitive overload of thinking to update them here when anything changes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookingMutation: UseMutationResult<any, any, any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recurringBookingMutation: UseMutationResult<any, any, any, any>,
  t: TFunction
) => {
  if (globalError) return globalError.message;
  return bookingMutation.isError && (bookingMutation?.error as HttpError)?.message
    ? t((bookingMutation.error as HttpError).message)
    : recurringBookingMutation.isError && (recurringBookingMutation?.error as HttpError)?.message
    ? t((recurringBookingMutation.error as HttpError).message)
    : "Unknown error";
};
