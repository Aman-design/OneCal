import { InferGetStaticPropsType } from "next";

import { getAppRegistry } from "@calcom/app-store/_appRegistry";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import prisma from "@calcom/prisma";

import AppsShell from "@components/AppsShell";
import Shell from "@components/Shell";
import AllApps from "@components/apps/AllApps";
import AppStoreCategories from "@components/apps/Categories";
import TrendingAppsSlider from "@components/apps/TrendingAppsSlider";

export default function Apps({ appStore, categories }: InferGetStaticPropsType<typeof getStaticProps>) {
  const { t } = useLocale();

  return (
    <Shell heading={t("app_store")} subtitle={t("app_store_description")} large isPublic>
      <AppsShell>
        <AppStoreCategories categories={categories} />
        <TrendingAppsSlider items={appStore} />
        <AllApps apps={appStore} />
      </AppsShell>
    </Shell>
  );
}

export const getStaticProps = async () => {
  const appMetaData = await getAppRegistry();

  const appsQuery = await prisma.app.findMany({
    select: {
      slug: true,
      categories: true,
      _count: {
        select: {
          credentials: true,
        },
      },
    },
  });
  console.log("🚀 ~ file: index.tsx ~ line 40 ~ getStaticProps ~ appsQuery", appsQuery);

  const appStore = appMetaData.map((app) => {
    const installs = appsQuery.filter((query) => query.slug === app.slug);
    console.log("🚀 ~ file: index.tsx ~ line 45 ~ appStore ~ installs", installs[0]._count.credentials);

    return { ...app, installs: installs[0]._count.credentials };
  });

  const categoriesArray = appsQuery.map((app) => app.categories);
  const categories = categoriesArray.reduce((c, app) => {
    for (const category of app) {
      c[category] = c[category] ? c[category] + 1 : 1;
    }
    return c;
  }, {} as Record<string, number>);
  return {
    props: {
      categories: Object.entries(categories).map(([name, count]) => ({ name, count })),
      appStore,
    },
  };
};
