import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceData, SpaceList } from "components/SpacesList";
import { CreateSpace } from "components/CreateSpace";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { getCurrentDate } from "src/utils";
import { useIdentityData } from "hooks/useIdentityData";
import { Divider } from "components/Layout";
import { useState } from "react";
import { DisclosureCollapseTiny, DisclosureExpandTiny } from "components/Icons";
import Head from "next/head";
import { NotificationManager } from "components/NotificationManager";

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function UserHomePage(props: Props) {
  let { session } = useAuth();
  let { query } = useRouter();
  let { data } = useIdentityData(query.studio as string, props.data);
  if (props.notFound) return <div>404 - page not found!</div>;
  if (!data) return <div>loading </div>;

  let currentStudioName = query.studio;
  let spaces = [
    ...data.members_in_spaces
      ?.filter((s) => !!s.space_data)
      .map((s) => s.space_data as SpaceData),
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
  let spacesHistory = props.spaces.filter(
    (s) => s.end_date && s.end_date < now
  );
  let [showHistory, setShowHistory] = useState(false);
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
            <SpaceList small spaces={spacesHistory} />
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

  let now = getCurrentDate();
  // upcoming:
  // start-date = in future
  const spacesUpcoming = props.spaces.filter(
    (s) => s?.start_date && s.start_date > now
  );

  // active:
  // start-date = in past
  // end-date = in future or unset
  const spacesActive = props.spaces.filter((s) => {
    if (!s) return false;
    if (!s.start_date) {
      return s.end_date && s.end_date >= now;
    } else
      return (
        s.start_date &&
        s.start_date <= now &&
        (!s.end_date || s.end_date >= now)
      );
  });

  // unscheduled (implicit draft)
  // spaces with NEITHER start nor end date
  const spacesUnscheduled = props.spaces.filter(
    (s) => !s?.start_date && !s?.end_date
  );

  return (
    <div className="flex flex-col gap-8">
      {spacesActive.length > 0 ? <SpaceList spaces={spacesActive} /> : null}

      <Divider />
      {/* empty state - if user homepage has NO ACTIVE SPACES */}
      {/* different messages for logged in user vs. viewing someone else's home */}
      {spacesActive.length == 0 &&
      spacesUpcoming.length == 0 &&
      spacesUnscheduled.length == 0 ? (
        session?.loggedIn && myStudioName == currentStudioName ? (
          <MyHomeEmpty /> /* me as in the logged in user who can make spaces here */
        ) : (
          <YourHomeEmpty
            username={currentStudioName as string}
          /> /* you as in I'm viewing a homepage that's not mine-the-authed-user's */
        )
      ) : null}
      {spacesUpcoming.length > 0 ? (
        <div className="myStudioUpcoming">
          <h3>Upcoming</h3>
          <SpaceList small spaces={spacesUpcoming} />
        </div>
      ) : null}
      {spacesUnscheduled.length > 0 ? (
        <div className="myStudioUnscheduled">
          <h3>Unscheduled</h3>
          <SpaceList small spaces={spacesUnscheduled} />
        </div>
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

const MyHomeEmpty = () => {
  return (
    <div className="my-4 flex flex-col gap-4 rounded-md border p-4">
      <p>
        Spaces are containers for doing things together: projects, experiments,
        and other collaborative activity.
      </p>
      <p>Each Space has its own timeline, content, and set of members.</p>
      <p>To get started, make a new Space & invite a friend to join!</p>
    </div>
  );
};

const YourHomeEmpty = (props: { username: string }) => {
  return (
    <div className="my-4 flex flex-col gap-4 rounded-md border p-4">
      <p>This person has no active Spaces.</p>
      <p>Check back later, or invite {props.username} to collaborate!</p>
    </div>
  );
};
