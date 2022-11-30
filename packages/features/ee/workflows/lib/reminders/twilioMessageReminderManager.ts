import {
  WorkflowTriggerEvents,
  TimeUnit,
  WorkflowTemplates,
  WorkflowActions,
  WorkflowMethods,
} from "@prisma/client";

import dayjs from "@calcom/dayjs";
import prisma from "@calcom/prisma";
import { Prisma } from "@calcom/prisma/client";

import { isSMSAction } from "../helperFunctions";
import * as twilio from "./smsProviders/twilioProvider";
import customTemplate, { VariablesType } from "./templates/customTemplate";
import smsReminderTemplate from "./templates/smsReminderTemplate";

export enum timeUnitLowerCase {
  DAY = "day",
  MINUTE = "minute",
  YEAR = "year",
}

export type BookingInfo = {
  uid?: string | null;
  attendees: { name: string; email: string; timeZone: string }[];
  organizer: {
    language: { locale: string };
    name: string;
    email: string;
    timeZone: string;
  };
  startTime: string;
  endTime: string;
  title: string;
  location?: string | null;
  additionalNotes?: string | null;
  customInputs?: Prisma.JsonValue;
};

export const scheduleMessageReminder = async (
  evt: BookingInfo,
  reminderPhone: string | null,
  triggerEvent: WorkflowTriggerEvents,
  action: WorkflowActions,
  timeSpan: {
    time: number | null;
    timeUnit: TimeUnit | null;
  },
  message: string,
  workflowStepId: number,
  template: WorkflowTemplates,
  sender: string
) => {
  const { startTime, endTime } = evt;
  const uid = evt.uid as string;
  const currentDate = dayjs();
  const timeUnit: timeUnitLowerCase | undefined = timeSpan.timeUnit?.toLocaleLowerCase() as timeUnitLowerCase;
  let scheduledDate = null;

  if (triggerEvent === WorkflowTriggerEvents.BEFORE_EVENT) {
    scheduledDate = timeSpan.time && timeUnit ? dayjs(startTime).subtract(timeSpan.time, timeUnit) : null;
  } else if (triggerEvent === WorkflowTriggerEvents.AFTER_EVENT) {
    scheduledDate = timeSpan.time && timeUnit ? dayjs(endTime).add(timeSpan.time, timeUnit) : null;
  }

  const name =
    action === WorkflowActions.SMS_ATTENDEE || action === WorkflowActions.WHATSAPP_ATTENDEE
      ? evt.attendees[0].name
      : "";
  const attendeeName =
    action === WorkflowActions.SMS_ATTENDEE || action === WorkflowActions.WHATSAPP_ATTENDEE
      ? evt.organizer.name
      : evt.attendees[0].name;
  const timeZone =
    action === WorkflowActions.SMS_ATTENDEE || action === WorkflowActions.WHATSAPP_ATTENDEE
      ? evt.attendees[0].timeZone
      : evt.organizer.timeZone;

  switch (template) {
    case WorkflowTemplates.REMINDER:
      message = smsReminderTemplate(evt.startTime, evt.title, timeZone, attendeeName, name) || message;
      break;
    case WorkflowTemplates.CUSTOM:
      const variables: VariablesType = {
        eventName: evt.title,
        organizerName: evt.organizer.name,
        attendeeName: evt.attendees[0].name,
        attendeeEmail: evt.attendees[0].email,
        eventDate: dayjs(evt.startTime).tz(timeZone),
        eventTime: dayjs(evt.startTime).tz(timeZone),
        timeZone: timeZone,
        location: evt.location,
        additionalNotes: evt.additionalNotes,
        customInputs: evt.customInputs,
      };
      const customMessage = await customTemplate(message, variables, evt.organizer.language.locale);
      message = customMessage.text;
      break;
  }

  if (message.length > 0 && reminderPhone) {
    //send SMS when event is booked/cancelled/rescheduled
    if (
      triggerEvent === WorkflowTriggerEvents.NEW_EVENT ||
      triggerEvent === WorkflowTriggerEvents.EVENT_CANCELLED ||
      triggerEvent === WorkflowTriggerEvents.RESCHEDULE_EVENT
    ) {
      try {
        if (isSMSAction(action)) {
          await twilio.sendSMS(reminderPhone, message, sender);
        } else {
          await twilio.sendWhatsApp(reminderPhone, message);
        }
      } catch (error) {
        console.log(`Error sending message with error ${error}`);
      }
    } else if (
      (triggerEvent === WorkflowTriggerEvents.BEFORE_EVENT ||
        triggerEvent === WorkflowTriggerEvents.AFTER_EVENT) &&
      scheduledDate
    ) {
      // Can only schedule at least 15 minutes in advance and at most 7 days in advance
      if (
        currentDate.isBefore(scheduledDate.subtract(15, "minute")) &&
        !scheduledDate.isAfter(currentDate.add(7, "day"))
      ) {
        try {
          let scheduledMessage;
          if (isSMSAction(action)) {
            scheduledMessage = await twilio.scheduleSMS(
              reminderPhone,
              message,
              scheduledDate.toDate(),
              sender
            );
          } else {
            scheduledMessage = await twilio.scheduleWhatsApp(reminderPhone, message, scheduledDate.toDate());
          }

          await prisma.workflowReminder.create({
            data: {
              bookingUid: uid,
              workflowStepId: workflowStepId,
              method: isSMSAction(action) ? WorkflowMethods.SMS : WorkflowMethods.WHATSAPP,
              scheduledDate: scheduledDate.toDate(),
              scheduled: true,
              referenceId: scheduledMessage.sid,
            },
          });
        } catch (error) {
          console.log(`Error scheduling message with error ${error}`);
        }
      } else if (scheduledDate.isAfter(currentDate.add(7, "day"))) {
        // Write to DB and send to CRON if scheduled reminder date is past 7 days
        await prisma.workflowReminder.create({
          data: {
            bookingUid: uid,
            workflowStepId: workflowStepId,
            method: isSMSAction(action) ? WorkflowMethods.SMS : WorkflowMethods.WHATSAPP,
            scheduledDate: scheduledDate.toDate(),
            scheduled: false,
          },
        });
      }
    }
  }
};

export const deleteScheduledMessageReminder = async (referenceId: string) => {
  try {
    await twilio.cancelMessage(referenceId);
  } catch (error) {
    console.log(`Error canceling reminder with error ${error}`);
  }
};
