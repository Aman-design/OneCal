import { TrashIcon } from "@heroicons/react/solid";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { ComponentProps, forwardRef, HTMLAttributes, useCallback, useMemo, useState } from "react";
import { Controller, ControllerRenderProps, useForm } from "react-hook-form";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import showToast from "@calcom/lib/notification";
import { UserPlan } from "@calcom/prisma/client";
import { Alert } from "@calcom/ui/Alert";
import Button from "@calcom/ui/Button";
import { Dialog, DialogTrigger } from "@calcom/ui/Dialog";
import { SelectProps } from "@calcom/ui/form/Select";
import { Form, TextField } from "@calcom/ui/form/fields";

import { withQuery } from "@lib/QueryCell";
import { nameOfDay } from "@lib/core/i18n/weekday";
import { isBrandingHidden } from "@lib/isBrandingHidden";
import { trpc } from "@lib/trpc";

import ImageUploader from "@components/ImageUploader";
import SettingsShell from "@components/SettingsShell";
import ConfirmationDialogContent from "@components/dialog/ConfirmationDialogContent";
import Avatar from "@components/ui/Avatar";
import Badge from "@components/ui/Badge";
import ColorPicker from "@components/ui/colorpicker";
import CheckboxField from "@components/ui/form/CheckboxField";
import Select from "@components/ui/form/Select";
import TimezoneSelect from "@components/ui/form/TimezoneSelect";

import { UpgradeToProDialog } from "../../components/UpgradeToProDialog";

const CALLBACK_URL_WHEN_ACCOUNT_DELETED =
  "/auth/logout" + (process.env.NEXT_PUBLIC_WEBAPP_URL === "https://app.cal.com" ? "?survey=true" : "");

const HideBrandingInput = forwardRef<
  HTMLInputElement,
  { user?: { plan: UserPlan; hideBranding: boolean } } & HTMLAttributes<HTMLInputElement>
>(function HideBrandingInput({ user, ...passThroughProps }, ref) {
  const { t } = useLocale();
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <input
        {...passThroughProps}
        ref={ref}
        id="hide-branding"
        type="checkbox"
        defaultChecked={user && isBrandingHidden(user)}
        className={
          "h-4 w-4 rounded-sm border-gray-300 text-neutral-900 focus:ring-neutral-800 disabled:opacity-50"
        }
        onClick={(e) => {
          if (!e.currentTarget.checked || user?.plan !== "FREE") {
            return;
          }
          e.preventDefault();
          setModalOpen(true);
        }}
      />
      <UpgradeToProDialog modalOpen={modalOpen} setModalOpen={setModalOpen}>
        {t("remove_cal_branding_description")}
      </UpgradeToProDialog>
    </>
  );
});

type LocaleOption = {
  value: string;
  label: string;
};

type OptionType = {
  value: unknown;
  label?: string;
};

const I18nSelect = <IsMulti extends boolean = false>({
  options,
  value,
  ...passThroughProps
}: Omit<SelectProps<OptionType, IsMulti>, "options"> & {
  options: OptionType[];
}) => {
  const { t } = useLocale();

  const translate = useCallback(
    (option: OptionType) => ({
      value: option.value,
      // For convenience, when a label is not given and the value is a string, the value is used as translation key.
      label: t(option.label || (typeof option.value === "string" ? t(option.value) : "")),
    }),
    [t]
  );

  return (
    <Select
      {...passThroughProps}
      value={options.map(translate).find((option) => option.value === value)}
      options={options.map(translate)}
    />
  );
};

const THEME_OPTIONS = [{ value: "light" }, { value: "dark" }];
const TIME_FORMAT_OPTIONS = [
  { value: 12, label: "12_hour" },
  { value: 24, label: "24_hour" },
];

const ThemeSelect = ({ onChange, value }: ControllerRenderProps) => {
  const [initialValue, setInitialValue] = useState<string>();
  const { t } = useLocale();
  const form = useForm();
  return (
    <>
      <div className="mb-2">
        <I18nSelect
          id="theme"
          isDisabled={!value}
          className="mt-1 block w-full rounded-sm shadow-sm sm:text-sm"
          options={THEME_OPTIONS}
          onChange={onChange}
          value={value}
        />
      </div>
      <CheckboxField
        descriptionAsLabel
        description={t("automatically_adjust_theme")}
        checked={!value}
        onChange={(e) => {
          if (e.target.checked) {
            setInitialValue(value);
            form.resetField("theme");
          } else {
            form.setValue("theme", initialValue);
          }
        }}
      />
    </>
  );
};

const LanguageSelect = ({
  value = "en",
  onChange,
  ...props
}: Omit<SelectProps<LocaleOption, false>, "value" | "onChange"> & {
  value?: string;
  onChange: (newValue?: string) => void;
}) => {
  const router = useRouter();
  const localeOptions = useMemo(() => {
    return (router.locales || []).map((locale) => ({
      value: locale,
      label: new Intl.DisplayNames(locale, { type: "language" }).of(locale) || "",
    }));
  }, [router.locales]);

  const label = new Intl.DisplayNames(value, { type: "language" }).of(value);
  if (!label) {
    throw new Error("Unknown language");
  }

  return (
    <Select
      value={{
        label,
        value,
      }}
      onChange={(option) => onChange(option?.value)}
      options={localeOptions}
      {...props}
    />
  );
};

function SettingsView(props: ComponentProps<typeof Settings> & { localeProp: string }) {
  const utils = trpc.useContext();
  const { t } = useLocale();

  const user = trpc.useQuery(["viewer.me"]).data;

  const form = useForm({
    defaultValues: {
      username: user?.username || undefined,
      name: user?.name || undefined,
      email: user?.email,
      avatar: user?.avatar,
      brandColor: user?.brandColor,
      darkBrandColor: user?.darkBrandColor,
      allowDynamicBooking: user?.allowDynamicBooking || undefined,
      bio: user?.bio || undefined,
      theme: user?.theme || undefined,
      hideBranding: user?.hideBranding,
      timeZone: user?.timeZone,
      timeFormat: user?.timeFormat,
      weekStart: user?.weekStart,
      locale: user?.locale,
    },
  });

  const { register } = form;

  const mutation = trpc.useMutation("viewer.profile.update", {
    onSuccess: async () => {
      showToast(t("your_user_profile_updated_successfully"), "success");
      setHasErrors(false); // dismiss any open errors
      await utils.invalidateQueries(["viewer.me"]);
    },
    onError: (err) => {
      setHasErrors(true);
      setErrorMessage(err.message);
      document?.getElementsByTagName("main")[0]?.scrollTo({ top: 0, behavior: "smooth" });
    },
    async onSettled() {
      await utils.invalidateQueries(["viewer.i18n"]);
    },
  });

  const deleteAccountMutation = trpc.useMutation("viewer.profile.deleteAccount", {
    onSuccess: () => signOut({ callbackUrl: CALLBACK_URL_WHEN_ACCOUNT_DELETED }),
    onError: (err) => {
      console.error(`Error Removing user: ${user?.id}, email: ${user?.email} :`, err);
    },
  });

  const [hasErrors, setHasErrors] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <Form
      form={form}
      className="divide-y divide-gray-200 lg:col-span-9"
      handleSubmit={(values) => mutation.mutate(values)}>
      {hasErrors && <Alert severity="error" title={errorMessage} />}
      <div className="py-6 lg:pb-8">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-grow space-y-6">
            <div className="block rtl:space-x-reverse sm:flex sm:space-x-2">
              <div className="mb-6 w-full sm:w-1/2">
                <TextField
                  {...register("username")}
                  addOnLeading={
                    <span className="inline-flex items-center rounded-l-sm border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                      {process.env.NEXT_PUBLIC_WEBSITE_URL}/
                    </span>
                  }
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {t("full_name")}
                </label>
                <input
                  {...register("name", { required: true })}
                  type="text"
                  id="name"
                  autoComplete="given-name"
                  placeholder={t("your_name")}
                  className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
                />
              </div>
            </div>
            <div className="block sm:flex">
              <div className="mb-6 w-full sm:w-1/2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t("email")}
                </label>
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  placeholder={t("your_email")}
                  className="mt-1 block w-full rounded-sm border-gray-300 shadow-sm sm:text-sm"
                />
                <p className="mt-2 text-sm text-gray-500" id="email-description">
                  {t("change_email_tip")}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="about" className="block text-sm font-medium text-gray-700">
                {t("about")}
              </label>
              <div className="mt-1">
                <textarea
                  {...register("bio")}
                  id="about"
                  placeholder={t("little_something_about")}
                  rows={3}
                  className="mt-1 block w-full rounded-sm border-gray-300 shadow-sm sm:text-sm"></textarea>
              </div>
            </div>
            <Controller
              name="avatar"
              render={({ field: { onChange, value } }) => (
                <div className="mt-1 flex">
                  <Avatar
                    alt={user?.name || ""}
                    className="relative h-10 w-10 rounded-full"
                    imageSrc={value}
                  />
                  <div className="flex items-center px-5">
                    <ImageUploader
                      target="avatar"
                      id="avatar-upload"
                      buttonMsg={t("change_avatar")}
                      handleAvatarChange={(newAvatar) => {
                        onChange(newAvatar);
                        form.handleSubmit((values) => mutation.mutate(values));
                      }}
                      imageSrc={value}
                    />
                  </div>
                </div>
              )}
            />
            <hr className="mt-6" />
            <div>
              <label htmlFor="locale" className="block text-sm font-medium text-gray-700">
                {t("language")}
              </label>
              <div className="mt-1">
                <Controller
                  name="locale"
                  render={({ field }) => (
                    <LanguageSelect
                      className="mt-1 block w-full rounded-sm capitalize shadow-sm  sm:text-sm"
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
            <div>
              <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700">
                {t("timezone")}
              </label>
              <div className="mt-1">
                <Controller
                  name="timeZone"
                  render={({ field: { value, onChange } }) => (
                    <TimezoneSelect
                      id="timeZone"
                      className="mt-1 block w-full rounded-sm shadow-sm sm:text-sm"
                      onChange={(v) => onChange(v.value)}
                      value={value}
                    />
                  )}
                />
              </div>
            </div>
            <div>
              <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700">
                {t("time_format")}
              </label>
              <div className="mt-1">
                <Controller
                  name="timeFormat"
                  render={({ field: { onChange, value } }) => (
                    <I18nSelect
                      id="timeFormat"
                      value={value}
                      onChange={(v) => v && onChange(v.value)}
                      className="mt-1 block w-full rounded-sm  capitalize shadow-sm  sm:text-sm"
                      options={TIME_FORMAT_OPTIONS}
                    />
                  )}
                />
              </div>
            </div>
            <div>
              <label htmlFor="weekStart" className="block text-sm font-medium text-gray-700">
                {t("first_day_of_week")}
              </label>
              <div className="mt-1">
                <Controller
                  name="weekStart"
                  render={({ field: { onChange, value } }) => {
                    const options = [
                      { value: "Sunday", label: nameOfDay(props.localeProp, 0) },
                      { value: "Monday", label: nameOfDay(props.localeProp, 1) },
                    ];
                    return (
                      <Select
                        id="weekStart"
                        value={options.find((option) => option.value === value)}
                        onChange={(v) => onChange(v?.value)}
                        className="mt-1 block w-full rounded-sm capitalize shadow-sm sm:text-sm"
                        options={options}
                      />
                    );
                  }}
                />
              </div>
            </div>
            <div className="relative mt-8 flex items-start">
              <CheckboxField
                {...register("allowDynamicBooking")}
                informationIconText={t("allow_dynamic_booking_tooltip")}
                description={t("allow_dynamic_booking")}
                descriptionAsLabel
              />
            </div>
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                {t("single_theme")}
              </label>
              <Controller name="theme" render={({ field }) => <ThemeSelect {...field} />} />
            </div>
            <div className="block rtl:space-x-reverse sm:flex sm:space-x-2">
              <div className="mb-2 sm:w-1/2">
                <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700">
                  {t("light_brand_color")}
                </label>
                <Controller name="brandColor" render={({ field }) => <ColorPicker {...field} />} />
              </div>
              <div className="mb-2 sm:w-1/2">
                <label htmlFor="darkBrandColor" className="block text-sm font-medium text-gray-700">
                  {t("dark_brand_color")}
                </label>
                <Controller name="darkBrandColor" render={({ field }) => <ColorPicker {...field} />} />
              </div>
            </div>
            <div>
              <div className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <HideBrandingInput {...register("hideBranding")} user={user} />
                </div>
                <div className="text-sm ltr:ml-3 rtl:mr-3">
                  <label htmlFor="hide-branding" className="font-medium text-gray-700">
                    {t("disable_cal_branding")} {user?.plan !== "PRO" && <Badge variant="default">PRO</Badge>}
                  </label>
                  <p className="text-gray-500">{t("disable_cal_branding_description")}</p>
                </div>
              </div>
            </div>
            <h3 className="text-md mt-7 font-bold leading-6 text-red-700">{t("danger_zone")}</h3>
            <div>
              <div className="relative flex items-start">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      color="warn"
                      StartIcon={TrashIcon}
                      className="border-2 border-red-700 text-red-700"
                      data-testid="delete-account">
                      {t("delete_account")}
                    </Button>
                  </DialogTrigger>
                  <ConfirmationDialogContent
                    variety="danger"
                    title={t("delete_account")}
                    confirmBtn={
                      <Button color="warn" data-testid="delete-account-confirm">
                        {t("confirm_delete_account")}
                      </Button>
                    }
                    onConfirm={() => deleteAccountMutation.mutate()}>
                    {t("delete_account_confirmation_message")}
                  </ConfirmationDialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
        <hr className="mt-8" />
        <div className="flex justify-end py-4">
          <Button type="submit">{t("save")}</Button>
        </div>
      </div>
    </Form>
  );
}

const WithQuery = withQuery(["viewer.i18n"]);

export default function Settings() {
  const { t } = useLocale();
  return (
    <SettingsShell heading={t("profile")} subtitle={t("edit_profile_info_description")}>
      <WithQuery success={({ data }) => <SettingsView localeProp={data.locale} />} />
    </SettingsShell>
  );
}
