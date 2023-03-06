// @TODO: This is a VERY big dependency
import type { EventLocationType } from "@calcom/app-store/locations";

export type BookingFormValues = {
  name: string;
  email: string;
  notes?: string;
  locationType?: EventLocationType["type"];
  guests?: { email: string }[];
  address?: string;
  attendeeAddress?: string;
  phone?: string;
  hostPhoneNumber?: string; // Maybe come up with a better way to name this to distingish between two types of phone numbers
  customInputs?: {
    [key: string]: string | boolean;
  };
  rescheduleReason?: string;
  smsReminderNumber?: string;
  // Key is not really part of form values, but only used to have a key
  // to set generic error messages on. Needed until RHF has implemented root error keys.
  globalError: undefined;
};
