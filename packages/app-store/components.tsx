import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

import classNames from "@calcom/lib/classNames";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { CAL_URL } from "@calcom/lib/constants";
import { deriveAppDictKeyFromType } from "@calcom/lib/deriveAppDictKeyFromType";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import type { RouterOutputs } from "@calcom/trpc/react";
import type { App } from "@calcom/types/App";
import { FiAlertCircle, FiArrowRight, FiCheck } from "@calcom/ui/components/icon";

import { InstallAppButtonMap } from "./apps.browser.generated";
import type { InstallAppButtonProps } from "./types";

export const InstallAppButtonWithoutPlanCheck = (
  props: {
    type: App["type"];
  } & InstallAppButtonProps
) => {
  const key = deriveAppDictKeyFromType(props.type, InstallAppButtonMap);
  const InstallAppButtonComponent = InstallAppButtonMap[key as keyof typeof InstallAppButtonMap];
  if (!InstallAppButtonComponent)
    return <>{props.render({ useDefaultComponent: true, disabled: props.disableInstall })}</>;

  return (
    <InstallAppButtonComponent
      render={props.render}
      onChanged={props.onChanged}
      disableInstall={props.disableInstall}
    />
  );
};

export const InstallAppButton = (
  props: {
    isProOnly?: App["isProOnly"];
    type: App["type"];
    wrapperClassName?: string;
    disableInstall?: boolean;
  } & InstallAppButtonProps
) => {
  const { isLoading, data: user } = trpc.viewer.me.useQuery();
  const router = useRouter();
  const proProtectionElementRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = proProtectionElementRef.current;
    if (!el) {
      return;
    }
    el.addEventListener(
      "click",
      (e) => {
        if (!user) {
          router.push(
            `${WEBAPP_URL}/auth/login?callbackUrl=${WEBAPP_URL + location.pathname + location.search}`
          );
          e.stopPropagation();
          return;
        }
      },
      true
    );
  }, [isLoading, user, router, props.isProOnly]);

  if (isLoading) {
    return null;
  }

  return (
    <div ref={proProtectionElementRef} className={props.wrapperClassName}>
      <InstallAppButtonWithoutPlanCheck {...props} />
    </div>
  );
};

export { AppConfiguration } from "./_components/AppConfiguration";

export const AppDependencyComponent = ({
  appName,
  dependencyData,
}: {
  appName: string;
  dependencyData: RouterOutputs["viewer"]["appsRouter"]["queryForDependencies"];
}) => {
  const { t } = useLocale();

  return (
    <div
      className={classNames(
        "rounded-md py-3 px-4",
        dependencyData && dependencyData.some((dependency) => !dependency.installed)
          ? "bg-blue-100"
          : "bg-gray-100"
      )}>
      {dependencyData &&
        dependencyData.map((dependency) => {
          return dependency.installed ? (
            <div className="items-start space-x-2.5">
              <div className="flex items-start">
                <div>
                  <FiCheck className="mt-1 mr-2 font-semibold" />
                </div>
                <div>
                  <span className="font-semibold">
                    {t("app_is_connected", { dependencyName: dependency.name })}
                  </span>
                  <div>
                    <div>
                      <span>
                        {t("this_app_requires_connected_account", {
                          appName,
                          dependencyName: dependency.name,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="items-start space-x-2.5">
              <div className="flex items-start text-blue-900">
                <div>
                  <FiAlertCircle className="mt-1 mr-2 font-semibold" />
                </div>
                <div>
                  <span className="font-semibold">
                    {t("this_app_requires_connected_account", { appName, dependencyName: dependency.name })}
                  </span>

                  <div>
                    <div>
                      <>
                        <Link
                          href={`${CAL_URL}/apps/${dependency.slug}`}
                          className="flex items-center text-blue-900 underline">
                          <span className="mr-1">
                            {t("connect_app", { dependencyName: dependency.name })}
                          </span>
                          <FiArrowRight />
                        </Link>
                      </>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
