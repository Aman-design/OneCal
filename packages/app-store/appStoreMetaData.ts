import type { AppMeta } from "@calcom/types/App";

import { appStoreMetadata as rawAppStoreMetadata } from "./apps.metadata.generated";

type RawAppStoreMetaData = typeof rawAppStoreMetadata;
type AppStoreMetaData = {
  [key in keyof RawAppStoreMetaData]: AppMeta;
};

export const appStoreMetadata = {} as AppStoreMetaData;

for (const [key, value] of Object.entries(rawAppStoreMetadata)) {
  const appMeta = {
    appData: null,
    __template: "",
    ...value,
  } as AppStoreMetaData[keyof AppStoreMetaData];
  appStoreMetadata[key as keyof typeof appStoreMetadata] = appMeta;
  appMeta.dirName = appMeta.dirName || appMeta.slug;

  if (appMeta.logo && !appMeta.logo.includes("/api/app-store/")) {
    const appDirName = `${appMeta.isTemplate ? "templates" : ""}/${appMeta.dirName}`;
    appMeta.logo = `/api/app-store/${appDirName}/${appMeta.logo}`;
  }
}
