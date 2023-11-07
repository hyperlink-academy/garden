import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceData, SpaceList } from "components/SpacesList";
import { CreateSpace } from "components/CreateSpace";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { getCurrentDate } from "src/utils";
import { useIdentityData } from "hooks/useIdentityData";
import { useEffect, useState } from "react";
import { DisclosureCollapseTiny, DisclosureExpandTiny } from "components/Icons";
import Head from "next/head";
import { NotificationManager } from "components/NotificationManager";
import { Divider } from "components/Layout";
import { NewStudio } from "./newStudio";

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function UserHomePage(props: Props) {
  let { session } = useAuth();
  let { query } = useRouter();
  let { data } = useIdentityData(query.studio as string, props.data);
  let [sortOrder, _setSortOrder] = useState<"lastUpdated" | "name">(
    "lastUpdated"
  );

  const setSortOrder = (sortOrder: "lastUpdated" | "name") => {
    _setSortOrder(sortOrder);
    localStorage.setItem(`${query.studio}/sortOrder`, sortOrder);
  };
  useEffect(() => {
    let savedSortOrder = localStorage.getItem(`${query.studio}/sortOrder`);
    if (savedSortOrder) _setSortOrder(savedSortOrder as "lastUpdated" | "name");
  }, [query.studio, _setSortOrder]);
  if (props.notFound) return <div>404 - page not found!</div>;
  if (!data) return <div>loading </div>;

  let currentStudioName = query.studio;
  let spaces = [
    ...data.members_in_spaces
      ?.filter((s) => !!s.space_data)
      .map((s) => s.space_data as SpaceData)
      .sort((a, b) => {
        if (sortOrder === "name") {
          if (!a.display_name || !b.display_name) {
            if (a.display_name) return -1;
            if (b.display_name) return 1;
            return 0;
          }
          return a.display_name.localeCompare(b.display_name);
        }
        if (!a.lastUpdated || !b.lastUpdated) {
          if (a.lastUpdated) return -1;
          if (b.lastUpdated) return 1;
          return 0;
        }
        return a.lastUpdated > b.lastUpdated ? -1 : 1;
      }),
  ];

  return (
    <>
      <Head>
        <title key="title">{currentStudioName}</title>
      </Head>
      <SpaceProvider id={data.studio}>
        <div className="mb-12 flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex flex-row justify-between gap-2">
              <h1 className="grow">{currentStudioName}</h1>
              {!session?.loggedIn ||
                (session.session?.username === currentStudioName && (
                  <NotificationManager />
                ))}
            </div>

            {!session?.loggedIn ||
              (session.session?.username === currentStudioName && (
                <CreateSpace
                  studioSpaceID={data.studio}
                  studioName={currentStudioName as string}
                />
              ))}
          </div>
          <Divider />
          {spaces.length === 0 ? null : (
            <div className="flex flex-row gap-2 text-sm">
              sort by:{" "}
              <button
                onClick={() => setSortOrder("lastUpdated")}
                className={`${
                  sortOrder === "lastUpdated" ? "underline" : ""
                } hover:underline`}
              >
                last updated
              </button>
              <button
                onClick={() => setSortOrder("name")}
                className={`${
                  sortOrder === "name" ? "underline" : ""
                } hover:underline`}
              >
                name
              </button>
            </div>
          )}
          <List
            spaces={spaces}
            id={data.studio}
            name={query.studio as string}
          />
        </div>
      </SpaceProvider>
    </>
  );
}

const HistoryList = (props: { spaces: Array<SpaceData> }) => {
  let now = getCurrentDate();
  let spacesHistory = props.spaces.filter((s) => s.archived);
  let [showHistory, setShowHistory] = useState(false);
  let { query } = useRouter();
  let { mutate } = useIdentityData(query.studio as string);
  return (
    <>
      {spacesHistory.length > 0 ? (
        <div className="myStudioCompleted">
          <button
            className={`flex items-center gap-2 hover:text-accent-blue ${
              showHistory ? "text-grey-15" : "text-grey-55"
            }`}
            onClick={() => {
              setShowHistory(!showHistory);
            }}
          >
            <h3>Completed ({spacesHistory.length})</h3>
            {!showHistory ? (
              <DisclosureCollapseTiny />
            ) : (
              <DisclosureExpandTiny />
            )}
          </button>
          <div className={`${showHistory ? "" : "hidden"}`}>
            <SpaceList
              small
              spaces={spacesHistory}
              onEdit={() => {
                mutate();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
};

/*
three lists:
- active (scheduled - now) 
- upcoming (scheduled - soon)
- unscheduled (i.e. implicit draft)

NB: calendar.tsx uses same date calculations
but simplified b/c calendar requires start + end dates
*/
const List = (props: {
  spaces: Array<SpaceData>;
  id: string;
  name: string;
}) => {
  let { session } = useAuth();
  let { query } = useRouter();

  let myStudioName = session.session?.username;
  let currentStudioName = query.studio;

  let spaces = props.spaces.filter((s) => !s.archived);

  let { mutate } = useIdentityData(query.studio as string);

  return (
    <div className="flex flex-col gap-8">
      {spaces.length > 0 ? (
        <SpaceList
          spaces={spaces}
          onEdit={() => {
            mutate();
          }}
        />
      ) : null}

      {/* empty state - if user homepage has NO ACTIVE SPACES */}
      {/* different messages for logged in user vs. viewing someone else's home */}
      {spaces.length == 0 ? (
        session?.loggedIn && myStudioName == currentStudioName ? (
          <NewStudio
            studioSpaceID={props.id}
            studioName={myStudioName as string}
          /> /* me as in the logged in user who can make spaces here */
        ) : (
          <YourHomeEmpty
            username={currentStudioName as string}
          /> /* you as in I'm viewing a homepage that's not mine-the-authed-user's */
        )
      ) : null}

      <HistoryList spaces={props.spaces} />
    </div>
  );
};

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export async function getStaticProps(ctx: GetStaticPropsContext) {
  if (!ctx.params?.studio)
    return { props: { notFound: true }, revalidate: 10 } as const;
  let data = await workerAPI(WORKER_URL, "get_identity_data", {
    name: ctx.params?.studio as string,
  });

  if (!data.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, data: data.data } };
}

const YourHomeEmpty = (props: { username: string }) => {
  return (
    <div className="lightBorder my-4 flex flex-col gap-4 border p-4">
      <p>This person has no active Spaces.</p>
      <p>Check back later, or invite {props.username} to collaborate!</p>
    </div>
  );
};
