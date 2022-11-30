import { WorkflowActions } from ".prisma/client";

export function isEmailAction(action?: WorkflowActions) {
  if (
    action === WorkflowActions.EMAIL_ATTENDEE ||
    action === WorkflowActions.EMAIL_HOST ||
    action === WorkflowActions.EMAIL_ADDRESS
  ) {
    return true;
  }
  return false;
}

export function isSMSAction(action?: WorkflowActions) {
  if (action === WorkflowActions.SMS_ATTENDEE || action === WorkflowActions.SMS_NUMBER) {
    return true;
  }
  return false;
}

export function isWhatsAppAction(action?: WorkflowActions) {
  if (action === WorkflowActions.WHATSAPP_ATTENDEE || action === WorkflowActions.WHATSAPP_NUMBER) {
    return true;
  }
  return false;
}
