import type { Webhook } from "@prisma/client";
import type { EventTypeSetupProps } from "pages/event-types/[type]";
import { useState } from "react";
import { TbWebhook } from "react-icons/tb";

import { WebhookForm } from "@calcom/features/webhooks/components";
import type { WebhookFormSubmitData } from "@calcom/features/webhooks/components/WebhookForm";
import WebhookListItem from "@calcom/features/webhooks/components/WebhookListItem";
import { APP_NAME } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import lockedFieldsManager from "@calcom/lib/lockedFieldsManager";
import { trpc } from "@calcom/trpc/react";
import { Alert, Button, Dialog, DialogContent, EmptyScreen, showToast } from "@calcom/ui";
import { FiPlus } from "@calcom/ui/components/icon";

export const EventTeamWebhooksTab = ({
  eventType,
  team,
}: Pick<EventTypeSetupProps, "eventType" | "team">) => {
  const { t } = useLocale();

  const utils = trpc.useContext();

  const { data: webhooks } = trpc.viewer.webhook.list.useQuery({ eventTypeId: eventType.id });

  const { data: installedApps, isLoading } = trpc.viewer.integrations.useQuery({
    variant: "other",
    onlyInstalled: true,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [webhookToEdit, setWebhookToEdit] = useState<Webhook>();

  const subscriberUrlReserved = (subscriberUrl: string, id?: string): boolean => {
    return !!webhooks?.find(
      (webhook) => webhook.subscriberUrl === subscriberUrl && (!id || webhook.id !== id)
    );
  };

  const editWebhookMutation = trpc.viewer.webhook.edit.useMutation({
    async onSuccess() {
      setEditModalOpen(false);
      await utils.viewer.webhook.list.invalidate();
      showToast(t("webhook_updated_successfully"), "success");
    },
    onError(error) {
      showToast(`${error.message}`, "error");
    },
  });

  const createWebhookMutation = trpc.viewer.webhook.create.useMutation({
    async onSuccess() {
      showToast(t("webhook_created_successfully"), "success");
      await utils.viewer.webhook.list.invalidate();
      setCreateModalOpen(false);
    },
    onError(error) {
      showToast(`${error.message}`, "error");
    },
  });

  const onCreateWebhook = async (values: WebhookFormSubmitData) => {
    if (subscriberUrlReserved(values.subscriberUrl, values.id)) {
      showToast(t("webhook_subscriber_url_reserved"), "error");
      return;
    }

    if (!values.payloadTemplate) {
      values.payloadTemplate = null;
    }

    createWebhookMutation.mutate({
      subscriberUrl: values.subscriberUrl,
      eventTriggers: values.eventTriggers,
      active: values.active,
      payloadTemplate: values.payloadTemplate,
      secret: values.secret,
      eventTypeId: eventType.id,
      eventSchedulingType: eventType.schedulingType,
    });
  };

  const NewWebhookButton = () => {
    const { t } = useLocale();
    return (
      <Button
        color="secondary"
        data-testid="new_webhook"
        StartIcon={FiPlus}
        onClick={() => setCreateModalOpen(true)}>
        {t("new_webhook")}
      </Button>
    );
  };

  const { shouldLockDisableProps, isManagedEventType } = lockedFieldsManager(
    eventType,
    t("locked_fields_description")
  );
  const webhookLockedStatus = shouldLockDisableProps("webhooks");

  return (
    <div>
      {team && webhooks && !isLoading && (
        <>
          <div>
            <div>
              <>
                {webhooks.length ? (
                  <>
                    {isManagedEventType && (
                      <Alert
                        severity="neutral"
                        className="mb-2"
                        title="Locked for members"
                        message="Members will be able to see the active apps but will not be able to edit any app settings"
                      />
                    )}
                    <div className="mb-2 rounded-md border">
                      {webhooks.map((webhook, index) => {
                        return (
                          <WebhookListItem
                            key={webhook.id}
                            webhook={webhook}
                            lastItem={webhooks.length === index + 1}
                            canEditWebhook={!webhookLockedStatus.disabled}
                            onEditWebhook={() => {
                              setEditModalOpen(true);
                              setWebhookToEdit(webhook);
                            }}
                          />
                        );
                      })}
                    </div>
                    <NewWebhookButton />
                  </>
                ) : (
                  <EmptyScreen
                    Icon={TbWebhook}
                    isLocked={webhookLockedStatus.isLocked}
                    headline={t("create_your_first_webhook")}
                    description={t("create_your_first_team_webhook_description", { appName: APP_NAME })}
                    buttonRaw={<NewWebhookButton />}
                  />
                )}
              </>
            </div>
          </div>

          {/* New webhook dialog */}
          <Dialog open={createModalOpen} onOpenChange={(isOpen) => !isOpen && setCreateModalOpen(false)}>
            <DialogContent
              enableOverflow
              title={t("create_webhook")}
              description={t("create_webhook_team_event_type")}>
              <WebhookForm
                onSubmit={onCreateWebhook}
                onCancel={() => setCreateModalOpen(false)}
                apps={installedApps?.items.map((app) => app.slug)}
              />
            </DialogContent>
          </Dialog>
          {/* Edit webhook dialog */}
          <Dialog open={editModalOpen} onOpenChange={(isOpen) => !isOpen && setEditModalOpen(false)}>
            <DialogContent title={t("edit_webhook")}>
              <WebhookForm
                webhook={webhookToEdit}
                apps={installedApps?.items.map((app) => app.slug)}
                onCancel={() => setEditModalOpen(false)}
                onSubmit={(values: WebhookFormSubmitData) => {
                  if (subscriberUrlReserved(values.subscriberUrl, webhookToEdit?.id || "")) {
                    showToast(t("webhook_subscriber_url_reserved"), "error");
                    return;
                  }

                  if (values.changeSecret) {
                    values.secret = values.newSecret.length ? values.newSecret : null;
                  }

                  if (!values.payloadTemplate) {
                    values.payloadTemplate = null;
                  }

                  editWebhookMutation.mutate({
                    id: webhookToEdit?.id || "",
                    subscriberUrl: values.subscriberUrl,
                    eventTriggers: values.eventTriggers,
                    active: values.active,
                    payloadTemplate: values.payloadTemplate,
                    secret: values.secret,
                    eventTypeId: webhookToEdit?.eventTypeId || undefined,
                    eventSchedulingType: eventType.schedulingType,
                  });
                }}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
