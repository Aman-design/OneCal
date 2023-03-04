import Link from "next/link";
import type { TeamPageProps } from "pages/team/[slug]";

import { WEBAPP_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { md } from "@calcom/lib/markdownIt";
import { Avatar } from "@calcom/ui";

type TeamType = TeamPageProps["team"];
type MembersType = TeamType["members"];
type MemberType = MembersType[number];

const Member = ({ member, teamName }: { member: MemberType; teamName: string | null }) => {
  const { t } = useLocale();

  const isBioEmpty = !member.bio || !member.bio.replace("<p><br></p>", "").length;

  return (
    <Link key={member.id} href={`/${member.username}`}>
      <div className="sm:min-w-80 sm:max-w-80 dark:bg-darkgray-200 dark:hover:bg-darkgray-300 group flex min-h-full flex-col space-y-2 rounded-md bg-white p-4 hover:cursor-pointer hover:bg-gray-50 ">
        <Avatar
          size="md"
          alt={member.name || ""}
          imageSrc={WEBAPP_URL + "/" + member.username + "/avatar.png"}
        />
        <section className="line-clamp-4 mt-2 w-full space-y-1">
          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
          <div className="line-clamp-3 overflow-ellipsis text-sm font-normal text-gray-500 dark:text-white">
            {!isBioEmpty ? (
              <>
                <div
                  className="dark:text-darkgray-600 text-sm text-gray-500 [&_a]:text-blue-500 [&_a]:underline [&_a]:hover:text-blue-600"
                  dangerouslySetInnerHTML={{ __html: md.render(member.bio || "") }}
                />
              </>
            ) : (
              t("user_from_team", { user: member.name, team: teamName })
            )}
          </div>
        </section>
      </div>
    </Link>
  );
};

const Members = ({ members, teamName }: { members: MembersType; teamName: string | null }) => {
  if (!members || members.length === 0) {
    return null;
  }

  return (
    <section className="lg:min-w-lg mx-auto flex min-w-full max-w-5xl flex-wrap justify-center gap-x-6 gap-y-6">
      {members.map((member) => {
        return member.username !== null && <Member key={member.id} member={member} teamName={teamName} />;
      })}
    </section>
  );
};

const Team = ({ team }: Omit<TeamPageProps, "trpcState">) => {
  return (
    <div>
      <Members members={team.members} teamName={team.name} />
    </div>
  );
};

export default Team;
