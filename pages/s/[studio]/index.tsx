import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceList } from "components/SpacesList";
import { CreateSpace } from "components/CreateSpace";
import { StudioName } from "components/StudioLayout";
import { useIndex } from "hooks/useReplicache";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { sortByPosition } from "src/position_helpers";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { getCurrentDate } from "src/utils";
import { string } from "zod";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  let { session } = useAuth();
  let { query } = useRouter();
  if (props.notFound) return <div>404 - studio not found!</div>;
  if (!props.id) return <div>loading </div>;

  let myStudioName = session.session?.username;
  let currentStudioName = query.studio;

  return (
    <SpaceProvider id={props.id}>
      <StudioName />
      {query.history !== undefined ? <HistoryList /> : <List id={props.id} />}
      {/* main CreateSpace button, after all Space lists */}
      {!session?.loggedIn || myStudioName != currentStudioName ? null : (
        <CreateSpace studioSpaceID={props.id} />
      )}
    </SpaceProvider>
  );
}

const HistoryList = () => {
  let now = getCurrentDate();
  const spacesHistory = useIndex
    .aev("space/end-date")
    .filter((s) => s.value.value && s.value.value < now);

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
const List = (props: { id: string }) => {
  let { session } = useAuth();
  let { query } = useRouter();

  let myStudioName = session.session?.username;
  let currentStudioName = query.studio;

  let now = getCurrentDate();

  // all spaces
  const thisEntity = useIndex.aev("this/name");
  const spacesAll = useIndex
    .aev("space/name")
    .sort(sortByPosition("aev"))
    .filter((f) => f.entity !== thisEntity[0]?.entity);
  const spacesStartingAll = useIndex.at("space/start-date");
  const spacesEndingAll = useIndex.at("space/end-date");

  // all space with start / end dates
  let spacesWithStartAndEnd = spacesAll.map((s) => {
    const start = spacesStartingAll.find((f) => f.entity === s.entity);
    const end = spacesEndingAll.find((f) => f.entity === s.entity);
    return { ...s, start: start?.value.value, end: end?.value.value };
  });

  // upcoming:
  // start-date = in future
  const spacesUpcoming = spacesWithStartAndEnd.filter(
    (s) => s.start && s.start > now
  );

  // active:
  // start-date = in past
  // end-date = in future or unset
  const spacesActive = spacesWithStartAndEnd.filter((s) => {
    if (!s.start) {
      return s.end && s.end >= now;
    } else return s.start && s.start <= now && (!s.end || s.end >= now);
  });

  // unscheduled (implicit draft)
  // spaces with NEITHER start nor end date
  const spacesUnscheduled = spacesWithStartAndEnd.filter(
    (s) => !s.start && !s.end
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
        <CreateSpace studioSpaceID={props.id} />
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

export async function getStaticProps(ctx: GetStaticPropsContext) {
  if (!ctx.params?.studio)
    return { props: { notFound: true }, revalidate: 10 } as const;
  let id = await workerAPI(WORKER_URL, "get_studio", {
    name: ctx.params?.studio as string,
  });
  if (!id.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, id: id.id } };
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
