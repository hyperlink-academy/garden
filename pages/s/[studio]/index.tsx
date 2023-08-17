import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceData, SpaceList } from "components/SpacesList";
import { CreateSpace } from "components/CreateSpace";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { getCurrentDate } from "src/utils";
import { useIdentityData } from "hooks/useIdentityData";
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

const YourHomeEmpty = (props: { username: string }) => {
  return (
    <div className="lightBorder my-4 flex flex-col gap-4 border p-4">
      <p>This person has no active Spaces.</p>
      <p>Check back later, or invite {props.username} to collaborate!</p>
    </div>
  );
};

const MyHomeEmpty = () => {
  return (
    <div className="lightBorder my-4 flex flex-col gap-4 border p-4 text-center">
      <p>
        Spaces are containers for doing things together: projects, experiments,
        collaboration. Each Space has its own cards, calendar, and members.
      </p>
      <p>To get started, make a new Space & invite a friend to join!</p>

      <ExampleSpaces />
    </div>
  );
};

const ExampleSpaces = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="m-auto self-center text-lg font-bold">
        Here are a few Spaces for inspiration ✨🌱
      </p>

      <div className="my-4 flex flex-col gap-4 sm:flex-row">
        <a
          className="flex w-full flex-col gap-2 self-center rounded-md border bg-white p-2 hover:bg-bg-blue sm:w-1/3 sm:gap-4 sm:p-4"
          href="https://hyperlink.academy/s/brendan/s/Website%20Jam:%20pattern.kitchen/website-jam-patternkitchen"
          target="_blank"
        >
          <h2>side project</h2>
          <p className="italic">example: website on pattern languages 🌐</p>
        </a>
        <a
          className="flex w-full flex-col gap-2 self-center rounded-md border bg-white p-2 hover:bg-bg-blue sm:w-1/3 sm:gap-4 sm:p-4"
          href="https://hyperlink.academy/s/celine/s/Stuffy%20Stuff/stuffy-stuff"
          target="_blank"
        >
          <h2>creative project with a friend</h2>
          <p className="italic">example: stuffed animal crafting 🐰</p>
        </a>
        <a
          className="flex w-full flex-col gap-2 self-center rounded-md border bg-white p-2 hover:bg-bg-blue sm:w-1/3 sm:gap-4 sm:p-4"
          href="https://hyperlink.academy/s/brendan/s/23/hyperlink-writing-room-2023"
          target="_blank"
        >
          <h2>small group collab</h2>
          <p className="italic">example: Hyperlink team writing room ✍️</p>
        </a>
      </div>
    </div>
  );
};
