import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceData, SpaceList } from "components/SpacesList";
import { CreateSpace } from "components/CreateSpace";
import { StudioName } from "components/StudioLayout";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { getCurrentDate } from "src/utils";
import { useIdentityData } from "hooks/useIdentityData";

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  let { session } = useAuth();
  let { query } = useRouter();
  let { data } = useIdentityData(query.studio as string, props.data);
  if (props.notFound) return <div>404 - studio not found!</div>;
  if (!data) return <div>loading </div>;

  let myStudioName = session.session?.username;
  let currentStudioName = query.studio;
  let spaces = [
    ...data.members_in_spaces
      ?.filter((s) => !!s.space_data)
      .map((s) => s.space_data as SpaceData),
  ];

  return (
    <SpaceProvider id={data.studio}>
      <StudioName />
      {query.history !== undefined ? (
        <HistoryList spaces={spaces} />
      ) : (
        <List spaces={spaces} id={data.studio} name={query.studio as string} />
      )}
      {/* main CreateSpace button, after all Space lists */}
      {!session?.loggedIn || myStudioName != currentStudioName ? null : (
        <CreateSpace
          studioSpaceID={data.studio}
          studioName={query.studio as string}
        />
      )}
    </SpaceProvider>
  );
}

const HistoryList = (props: { spaces: Array<SpaceData> }) => {
  let now = getCurrentDate();
  let spacesHistory = props.spaces.filter(
    (s) => s.end_date && s.end_date < now
  );

  // return <SpaceList spaces={spaces} />;
  return (
    <>
      {spacesHistory.length > 0 ? (
        <div className="my-4 rounded-lg border border-grey-55">
          <h2 className=" rounded-t-md bg-[rebeccapurple] py-2 px-4 text-white">
            History
          </h2>
          <div className="p-2 pb-6 sm:p-4 sm:pb-8">
            <SpaceList spaces={spacesHistory} />
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
    <>
      {spacesActive.length > 0 ? (
        <div className="my-4 rounded-lg border border-grey-55">
          <h2 className=" rounded-t-md bg-[steelblue] py-2 px-4 text-white">
            Active
          </h2>
          <div className="p-2 pb-6 sm:p-4 sm:pb-8">
            <SpaceList spaces={spacesActive} />
          </div>
        </div>
      ) : null}
      {/* extra CreateSpace just below 'Active' */}
      {/* NOT if not logged in or not on your studio */}
      {/* NOT if no active spaces OR no others, to avoid duplicate CreateSpace */}
      {!session?.loggedIn ||
      myStudioName != currentStudioName ||
      spacesActive.length == 0 ||
      !(spacesUpcoming.length > 0 || spacesUnscheduled.length > 0) ? null : (
        <CreateSpace studioSpaceID={props.id} studioName={props.name} />
      )}
      {/* empty state - if studio has NO ACTIVE SPACES */}
      {/* different messages for logged in user vs. viewing someone else's studio */}
      {spacesActive.length == 0 &&
      spacesUpcoming.length == 0 &&
      spacesUnscheduled.length == 0 ? (
        session?.loggedIn && myStudioName == currentStudioName ? (
          <MyStudioEmpty /> /* me as in the logged in user who can make spaces here */
        ) : (
          <YourStudioEmpty
            username={currentStudioName as string}
          /> /* you as in a studio that's not mine-the-authed-user's */
        )
      ) : null}
      {spacesUpcoming.length > 0 ? (
        <div className="my-4 rounded-lg border border-grey-55">
          <h2 className=" rounded-t-md bg-[darkgoldenrod] py-2 px-4 text-white">
            Upcoming
          </h2>
          <div className="p-2 pb-6 sm:p-4 sm:pb-8">
            <SpaceList spaces={spacesUpcoming} />
          </div>
        </div>
      ) : null}
      {spacesUnscheduled.length > 0 ? (
        <div className="my-4 rounded-lg border border-grey-55">
          <h2 className=" rounded-t-md bg-[grey] py-2 px-4 text-white">
            Unscheduled
          </h2>
          <div className="p-2 pb-6 sm:p-4 sm:pb-8">
            <SpaceList spaces={spacesUnscheduled} />
          </div>
        </div>
      ) : null}
    </>
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

const MyStudioEmpty = () => {
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

const YourStudioEmpty = (props: { username: string }) => {
  return (
    <div className="my-4 flex flex-col gap-4 rounded-md border p-4">
      <p>This Studio has no active Spaces.</p>
      <p>Check back later, or invite {props.username} to collaborate!</p>
    </div>
  );
};
