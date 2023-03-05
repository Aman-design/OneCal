import { useAutoAnimate } from "@formkit/auto-animate/react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { FC } from "react";
import { useEffect, useState, memo } from "react";
import { z } from "zod";

import { EventTypeDescriptionLazy as EventTypeDescription } from "@calcom/features/eventtypes/components";
import CreateEventTypeDialog from "@calcom/features/eventtypes/components/CreateEventTypeDialog";
import { DuplicateDialog } from "@calcom/features/eventtypes/components/DuplicateDialog";
import Shell from "@calcom/features/shell/Shell";
import { APP_NAME, CAL_URL, WEBAPP_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import useMediaQuery from "@calcom/lib/hooks/useMediaQuery";
import { useTypedQuery } from "@calcom/lib/hooks/useTypedQuery";
import type { RouterOutputs } from "@calcom/trpc/react";
import { trpc, TRPCClientError } from "@calcom/trpc/react";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  ButtonGroup,
  ConfirmationDialogContent,
  Dialog,
  Dropdown,
  DropdownItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyScreen,
  showToast,
  Switch,
  Tooltip,
  CreateButton,
  HorizontalTabs,
} from "@calcom/ui";
import {
  FiArrowDown,
  FiArrowUp,
  FiClipboard,
  FiCode,
  FiCopy,
  FiEdit,
  FiEdit2,
  FiExternalLink,
  FiLink,
  FiMoreHorizontal,
  FiTrash,
  FiUpload,
  FiUsers,
} from "@calcom/ui/components/icon";

import { withQuery } from "@lib/QueryCell";
import { HttpError } from "@lib/core/http/error";

import { EmbedButton, EmbedDialog } from "@components/Embed";
import SkeletonLoader from "@components/eventtype/SkeletonLoader";

type EventTypeGroups = RouterOutputs["viewer"]["eventTypes"]["getByViewer"]["eventTypeGroups"];
type EventTypeGroupProfile = EventTypeGroups[number]["profile"];

interface EventTypeListHeadingProps {
  profile: EventTypeGroupProfile;
  membershipCount: number;
  teamId?: number | null;
}

type EventTypeGroup = EventTypeGroups[number];
type EventType = EventTypeGroup["eventTypes"][number];

interface EventTypeListProps {
  group: EventTypeGroup;
  groupIndex: number;
  readOnly: boolean;
  types: EventType[];
}

interface MobileTeamsTabProps {
  eventTypeGroups: EventTypeGroups;
}

const querySchema = z.object({
  teamId: z.nullable(z.coerce.number()).optional().default(null),
});

const MobileTeamsTab: FC<MobileTeamsTabProps> = (props) => {
  const { eventTypeGroups } = props;

  const tabs = eventTypeGroups.map((item) => ({
    name: item.profile.name ?? "",
    href: item.teamId ? `/event-types?teamId=${item.teamId}` : "/event-types",
    avatar: item.profile.image ?? `${WEBAPP_URL}/${item.profile.slug}/avatar.png`,
  }));
  const { data } = useTypedQuery(querySchema);
  const events = eventTypeGroups.filter((item) => item.teamId === data.teamId);

  return (
    <div>
      <HorizontalTabs tabs={tabs} />
      {events.length && (
        <EventTypeList
          types={events[0].eventTypes}
          group={events[0]}
          groupIndex={0}
          readOnly={events[0].metadata.readOnly}
        />
      )}
    </div>
  );
};

const Item = ({ type, group, readOnly }: { type: EventType; group: EventTypeGroup; readOnly: boolean }) => {
  const { t } = useLocale();

  return (
    <Link
      href={`/event-types/${type.id}?tabName=setup`}
      className="flex-1 overflow-hidden pr-4 text-sm"
      title={type.title}>
      <div>
        <span
          className="font-semibold text-gray-700 ltr:mr-1 rtl:ml-1"
          data-testid={"event-type-title-" + type.id}>
          {type.title}
        </span>
        {group.profile.slug ? (
          <small
            className="hidden font-normal leading-4 text-gray-600 sm:inline"
            data-testid={"event-type-slug-" + type.id}>
            {`/${group.profile.slug}/${type.slug}`}
          </small>
        ) : null}
        {readOnly && (
          <Badge variant="gray" className="ml-2">
            {t("readonly")}
          </Badge>
        )}
      </div>
      <EventTypeDescription
        // @ts-expect-error FIXME: We have a type mismatch here @hariombalhara @sean-brydon
        eventType={type}
        shortenDescription
      />
    </Link>
  );
};

const MemoizedItem = memo(Item);

export const EventTypeList = ({ group, groupIndex, readOnly, types }: EventTypeListProps): JSX.Element => {
  const { t } = useLocale();
  const router = useRouter();
  const [parent] = useAutoAnimate<HTMLUListElement>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogTypeId, setDeleteDialogTypeId] = useState(0);
  const utils = trpc.useContext();
  const mutation = trpc.viewer.eventTypeOrder.useMutation({
    onError: async (err) => {
      console.error(err.message);
      await utils.viewer.eventTypes.getByViewer.cancel();
      // REVIEW: Should we invalidate the entire router or just the `getByViewer` query?
      await utils.viewer.eventTypes.invalidate();
    },
    onSettled: () => {
      // REVIEW: Should we invalidate the entire router or just the `getByViewer` query?
      utils.viewer.eventTypes.invalidate();
    },
  });

  const setHiddenMutation = trpc.viewer.eventTypes.update.useMutation({
    onMutate: async ({ id }) => {
      await utils.viewer.eventTypes.getByViewer.cancel();
      const previousValue = utils.viewer.eventTypes.getByViewer.getData();
      if (previousValue) {
        const newList = [...types];
        const itemIndex = newList.findIndex((item) => item.id === id);
        if (itemIndex !== -1 && newList[itemIndex]) {
          newList[itemIndex].hidden = !newList[itemIndex].hidden;
        }
        utils.viewer.eventTypes.getByViewer.setData(undefined, {
          ...previousValue,
          eventTypeGroups: [
            ...previousValue.eventTypeGroups.slice(0, groupIndex),
            { ...group, eventTypes: newList },
            ...previousValue.eventTypeGroups.slice(groupIndex + 1),
          ],
        });
      }
      return { previousValue };
    },
    onError: async (err, _, context) => {
      if (context?.previousValue) {
        utils.viewer.eventTypes.getByViewer.setData(undefined, context.previousValue);
      }
      console.error(err.message);
    },
    onSettled: () => {
      // REVIEW: Should we invalidate the entire router or just the `getByViewer` query?
      utils.viewer.eventTypes.invalidate();
    },
  });

  async function moveEventType(index: number, increment: 1 | -1) {
    const newList = [...types];

    const type = types[index];
    const tmp = types[index + increment];
    if (tmp) {
      newList[index] = tmp;
      newList[index + increment] = type;
    }

    await utils.viewer.eventTypes.getByViewer.cancel();

    const previousValue = utils.viewer.eventTypes.getByViewer.getData();
    if (previousValue) {
      utils.viewer.eventTypes.getByViewer.setData(undefined, {
        ...previousValue,
        eventTypeGroups: [
          ...previousValue.eventTypeGroups.slice(0, groupIndex),
          { ...group, eventTypes: newList },
          ...previousValue.eventTypeGroups.slice(groupIndex + 1),
        ],
      });
    }

    mutation.mutate({
      ids: newList.map((type) => type.id),
    });
  }

  async function deleteEventTypeHandler(id: number) {
    const payload = { id };
    deleteMutation.mutate(payload);
  }

  // inject selection data into url for correct router history
  const openDuplicateModal = (eventType: EventType, group: EventTypeGroup) => {
    const query = {
      ...router.query,
      dialog: "duplicate",
      title: eventType.title,
      description: eventType.description,
      slug: eventType.slug,
      id: eventType.id,
      length: eventType.length,
      pageSlug: group.profile.slug,
    };

    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    );
  };

  const deleteMutation = trpc.viewer.eventTypes.delete.useMutation({
    onSuccess: () => {
      showToast(t("event_type_deleted_successfully"), "success");
      setDeleteDialogOpen(false);
    },
    onMutate: async ({ id }) => {
      await utils.viewer.eventTypes.getByViewer.cancel();
      const previousValue = utils.viewer.eventTypes.getByViewer.getData();
      if (previousValue) {
        const newList = types.filter((item) => item.id !== id);

        utils.viewer.eventTypes.getByViewer.setData(undefined, {
          ...previousValue,
          eventTypeGroups: [
            ...previousValue.eventTypeGroups.slice(0, groupIndex),
            { ...group, eventTypes: newList },
            ...previousValue.eventTypeGroups.slice(groupIndex + 1),
          ],
        });
      }
      return { previousValue };
    },
    onError: (err, _, context) => {
      if (context?.previousValue) {
        utils.viewer.eventTypes.getByViewer.setData(undefined, context.previousValue);
      }
      if (err instanceof HttpError) {
        const message = `${err.statusCode}: ${err.message}`;
        showToast(message, "error");
        setDeleteDialogOpen(false);
      } else if (err instanceof TRPCClientError) {
        showToast(err.message, "error");
      }
    },
    onSettled: () => {
      // REVIEW: Should we invalidate the entire router or just the `getByViewer` query?
      utils.viewer.eventTypes.invalidate();
    },
  });

  const [isNativeShare, setNativeShare] = useState(true);

  useEffect(() => {
    if (!navigator.share) {
      setNativeShare(false);
    }
  }, []);

  const firstItem = types[0];
  const lastItem = types[types.length - 1];
  return (
    <div className="mb-16 flex overflow-hidden rounded-md border border-gray-200 bg-white">
      <ul ref={parent} className="!static w-full divide-y divide-gray-200" data-testid="event-types">
        {types.map((type, index) => {
          const embedLink = `${group.profile.slug}/${type.slug}`;
          const calLink = `${CAL_URL}/${embedLink}`;
          return (
            <li key={type.id}>
              <div className="flex w-full items-center justify-between hover:bg-gray-50">
                <div className="group flex w-full max-w-full items-center justify-between overflow-hidden px-4 py-4 sm:px-6">
                  {!(firstItem && firstItem.id === type.id) && (
                    <button
                      className="invisible absolute left-[5px] -mt-4 mb-4 -ml-4 hidden h-6 w-6 scale-0 items-center justify-center rounded-md border bg-white p-1 text-gray-400 transition-all hover:border-transparent hover:text-black hover:shadow disabled:hover:border-inherit disabled:hover:text-gray-400 disabled:hover:shadow-none group-hover:visible group-hover:scale-100 sm:ml-0 sm:flex lg:left-[36px]"
                      onClick={() => moveEventType(index, -1)}>
                      <FiArrowUp className="h-5 w-5" />
                    </button>
                  )}

                  {!(lastItem && lastItem.id === type.id) && (
                    <button
                      className="invisible absolute left-[5px] mt-8 -ml-4 hidden h-6 w-6 scale-0 items-center justify-center rounded-md  border bg-white p-1 text-gray-400 transition-all hover:border-transparent hover:text-black hover:shadow disabled:hover:border-inherit disabled:hover:text-gray-400 disabled:hover:shadow-none group-hover:visible group-hover:scale-100 sm:ml-0 sm:flex lg:left-[36px]"
                      onClick={() => moveEventType(index, 1)}>
                      <FiArrowDown className="h-5 w-5" />
                    </button>
                  )}
                  <MemoizedItem type={type} group={group} readOnly={readOnly} />
                  <div className="mt-4 hidden sm:mt-0 sm:flex">
                    <div className="flex justify-between space-x-2 rtl:space-x-reverse">
                      {type.users?.length > 1 && (
                        <AvatarGroup
                          className="relative top-1 right-3"
                          size="sm"
                          truncateAfter={4}
                          items={type.users.map((organizer) => ({
                            alt: organizer.name || "",
                            image: `${WEBAPP_URL}/${organizer.username}/avatar.png`,
                            title: organizer.name || "",
                          }))}
                        />
                      )}
                      <div className="flex items-center justify-between space-x-2 rtl:space-x-reverse">
                        {type.hidden && (
                          <Badge variant="gray" size="lg">
                            {t("hidden")}
                          </Badge>
                        )}
                        <Tooltip content={t("show_eventtype_on_profile")}>
                          <div className="self-center rounded-md p-2 hover:bg-gray-200">
                            <Switch
                              name="Hidden"
                              checked={!type.hidden}
                              onCheckedChange={() => {
                                setHiddenMutation.mutate({ id: type.id, hidden: !type.hidden });
                              }}
                            />
                          </div>
                        </Tooltip>

                        <ButtonGroup combined>
                          <Tooltip content={t("preview")}>
                            <Button
                              data-testid="preview-link-button"
                              color="secondary"
                              target="_blank"
                              variant="icon"
                              href={calLink}
                              StartIcon={FiExternalLink}
                            />
                          </Tooltip>

                          <Tooltip content={t("copy_link")}>
                            <Button
                              color="secondary"
                              variant="icon"
                              StartIcon={FiLink}
                              onClick={() => {
                                showToast(t("link_copied"), "success");
                                navigator.clipboard.writeText(calLink);
                              }}
                            />
                          </Tooltip>
                          <Dropdown modal={false}>
                            <DropdownMenuTrigger asChild data-testid={"event-type-options-" + type.id}>
                              <Button
                                type="button"
                                variant="icon"
                                color="secondary"
                                StartIcon={FiMoreHorizontal}
                                className="ltr:radix-state-open:rounded-r-md rtl:radix-state-open:rounded-l-md"
                              />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <DropdownItem
                                  type="button"
                                  data-testid={"event-type-edit-" + type.id}
                                  StartIcon={FiEdit2}
                                  onClick={() => router.push("/event-types/" + type.id)}>
                                  {t("edit")}
                                </DropdownItem>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="outline-none">
                                <DropdownItem
                                  type="button"
                                  data-testid={"event-type-duplicate-" + type.id}
                                  StartIcon={FiCopy}
                                  onClick={() => openDuplicateModal(type, group)}>
                                  {t("duplicate")}
                                </DropdownItem>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="outline-none">
                                <EmbedButton
                                  as={DropdownItem}
                                  type="button"
                                  StartIcon={FiCode}
                                  className="w-full rounded-none"
                                  embedUrl={encodeURIComponent(embedLink)}>
                                  {t("embed")}
                                </EmbedButton>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* readonly is only set when we are on a team - if we are on a user event type null will be the value. */}
                              {(group.metadata?.readOnly === false || group.metadata.readOnly === null) && (
                                <DropdownMenuItem>
                                  <DropdownItem
                                    color="destructive"
                                    onClick={() => {
                                      setDeleteDialogOpen(true);
                                      setDeleteDialogTypeId(type.id);
                                    }}
                                    StartIcon={FiTrash}
                                    className="w-full rounded-none">
                                    {t("delete")}
                                  </DropdownItem>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </Dropdown>
                        </ButtonGroup>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="min-w-9 mx-5 flex sm:hidden">
                  <Dropdown>
                    <DropdownMenuTrigger asChild data-testid={"event-type-options-" + type.id}>
                      <Button type="button" variant="icon" color="secondary" StartIcon={FiMoreHorizontal} />
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuContent>
                        <DropdownMenuItem className="outline-none">
                          <DropdownItem
                            href={calLink}
                            target="_blank"
                            StartIcon={FiExternalLink}
                            className="w-full rounded-none">
                            {t("preview")}
                          </DropdownItem>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="outline-none">
                          <DropdownItem
                            data-testid={"event-type-duplicate-" + type.id}
                            onClick={() => {
                              navigator.clipboard.writeText(calLink);
                              showToast(t("link_copied"), "success");
                            }}
                            StartIcon={FiClipboard}
                            className="w-full rounded-none text-left">
                            {t("copy_link")}
                          </DropdownItem>
                        </DropdownMenuItem>
                        {isNativeShare ? (
                          <DropdownMenuItem className="outline-none">
                            <DropdownItem
                              data-testid={"event-type-duplicate-" + type.id}
                              onClick={() => {
                                navigator
                                  .share({
                                    title: t("share"),
                                    text: t("share_event", { appName: APP_NAME }),
                                    url: calLink,
                                  })
                                  .then(() => showToast(t("link_shared"), "success"))
                                  .catch(() => showToast(t("failed"), "error"));
                              }}
                              StartIcon={FiUpload}
                              className="w-full rounded-none">
                              {t("share")}
                            </DropdownItem>
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem className="outline-none">
                          <DropdownItem
                            onClick={() => router.push("/event-types/" + type.id)}
                            StartIcon={FiEdit}
                            className="w-full rounded-none">
                            {t("edit")}
                          </DropdownItem>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="outline-none">
                          <DropdownItem
                            onClick={() => openDuplicateModal(type, group)}
                            StartIcon={FiCopy}
                            data-testid={"event-type-duplicate-" + type.id}>
                            {t("duplicate")}
                          </DropdownItem>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="outline-none">
                          <DropdownItem
                            color="destructive"
                            onClick={() => {
                              setDeleteDialogOpen(true);
                              setDeleteDialogTypeId(type.id);
                            }}
                            StartIcon={FiTrash}
                            className="w-full rounded-none">
                            {t("delete")}
                          </DropdownItem>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenuPortal>
                  </Dropdown>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <ConfirmationDialogContent
          variety="danger"
          title={t("delete_event_type")}
          confirmBtnText={t("confirm_delete_event_type")}
          loadingText={t("confirm_delete_event_type")}
          onConfirm={(e) => {
            e.preventDefault();
            deleteEventTypeHandler(deleteDialogTypeId);
          }}>
          {t("delete_event_type_description")}
        </ConfirmationDialogContent>
      </Dialog>
    </div>
  );
};

const EventTypeListHeading = ({
  profile,
  membershipCount,
  teamId,
}: EventTypeListHeadingProps): JSX.Element => {
  const { t } = useLocale();
  const router = useRouter();

  const publishTeamMutation = trpc.viewer.teams.publish.useMutation({
    onSuccess(data) {
      router.push(data.url);
    },
    onError: (error) => {
      showToast(error.message, "error");
    },
  });

  return (
    <div className="mb-4 flex items-center space-x-2">
      <Avatar
        alt={profile?.name || ""}
        href={teamId ? `/settings/teams/${teamId}/profile` : "/settings/my-account/profile"}
        imageSrc={`${WEBAPP_URL}/${profile.slug}/avatar.png` || undefined}
        size="md"
        className="mt-1 inline-flex justify-center"
      />
      <div>
        <Link
          href={teamId ? `/settings/teams/${teamId}/profile` : "/settings/my-account/profile"}
          className="font-bold">
          {profile?.name || ""}
        </Link>
        {membershipCount && teamId && (
          <span className="relative -top-px text-xs text-gray-500 ltr:ml-2 ltr:mr-2 rtl:ml-2">
            <Link href={`/settings/teams/${teamId}/members`}>
              <Badge variant="gray">
                <FiUsers className="mr-1 -mt-px inline h-3 w-3" />
                {membershipCount}
              </Badge>
            </Link>
          </span>
        )}
        {profile?.slug && (
          <Link href={`${CAL_URL}/${profile.slug}`} className="block text-xs text-gray-500">
            {`${CAL_URL?.replace("https://", "")}/${profile.slug}`}
          </Link>
        )}
      </div>
      {!profile?.slug && !!teamId && (
        <button onClick={() => publishTeamMutation.mutate({ teamId })}>
          <Badge variant="gray" className="mb-1 -ml-2">
            {t("upgrade")}
          </Badge>
        </button>
      )}
    </div>
  );
};

const CreateFirstEventTypeView = () => {
  const { t } = useLocale();

  return (
    <EmptyScreen
      Icon={FiLink}
      headline={t("new_event_type_heading")}
      description={t("new_event_type_description")}
    />
  );
};

const CTA = () => {
  const { t } = useLocale();

  const query = trpc.viewer.eventTypes.getByViewer.useQuery();

  if (!query.data) return null;

  const profileOptions = query.data.profiles
    .filter((profile) => !profile.readOnly)
    .map((profile) => {
      return { teamId: profile.teamId, label: profile.name || profile.slug, image: profile.image };
    });

  return (
    <CreateButton
      subtitle={t("create_event_on").toUpperCase()}
      options={profileOptions}
      createDialog={CreateEventTypeDialog}
    />
  );
};

const WithQuery = withQuery(trpc.viewer.eventTypes.getByViewer);

const EventTypesPage = () => {
  const { t } = useLocale();
  const router = useRouter();

  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div>
      <Shell heading={t("event_types_page_title")} subtitle={t("event_types_page_subtitle")} CTA={<CTA />}>
        <WithQuery
          customLoader={<SkeletonLoader />}
          success={({ data }) => (
            <>
              {data.eventTypeGroups.length > 1 ? (
                <>
                  {isMobile ? (
                    <MobileTeamsTab eventTypeGroups={data.eventTypeGroups} />
                  ) : (
                    data.eventTypeGroups.map((group, index) => (
                      <div className="flex flex-col" key={group.profile.slug}>
                        <EventTypeListHeading
                          profile={group.profile}
                          membershipCount={group.metadata.membershipCount}
                          teamId={group.teamId}
                        />

                        <EventTypeList
                          types={group.eventTypes}
                          group={group}
                          groupIndex={index}
                          readOnly={group.metadata.readOnly}
                        />
                      </div>
                    ))
                  )}
                </>
              ) : data.eventTypeGroups.length === 1 ? (
                <EventTypeList
                  types={data.eventTypeGroups[0].eventTypes}
                  group={data.eventTypeGroups[0]}
                  groupIndex={0}
                  readOnly={data.eventTypeGroups[0].metadata.readOnly}
                />
              ) : (
                <CreateFirstEventTypeView />
              )}

              <EmbedDialog />
              {router.query.dialog === "duplicate" && <DuplicateDialog />}
            </>
          )}
        />
      </Shell>
    </div>
  );
};

export default EventTypesPage;
