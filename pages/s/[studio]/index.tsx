import { workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { CreateSpace, SpaceList } from "components/SpacesList";
import { StudioName } from "components/StudioLayout";
import { useIndex } from "hooks/useReplicache";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { sortByPosition } from "src/position_helpers";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  if (props.notFound) return <div>404 - studio not found!</div>;
  if (!props.id) return <div>loading </div>;

  return (
    <SpaceProvider id={props.id}>
      <StudioName />
      <List />
      <CreateSpace studioSpaceID={props.id} />
    </SpaceProvider>
  );
}

/*
three lists:
- active (scheduled - now) 
- upcoming (scheduled - soon)
- unscheduled (i.e. implicit draft)
*/
const List = () => {
  let now = new Date().toLocaleDateString("en-CA");

  // all spaces
  const spacesAll = useIndex.aev("space/name").sort(sortByPosition("aev"));
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
  const spacesStartingFuture = spacesWithStartAndEnd.filter(
    (s) => s.start && s.start > now
  );

  // active:
  // start-date = in past
  // end-date = in future or unset
  const spacesActive = spacesWithStartAndEnd.filter((s) => {
    if (!s.start) {
      return s.end && s.end > now;
    } else return s.start && s.start <= now && (!s.end || s.end > now);
  });

  // unscheduled (implicit draft)
  // spaces with NEITHER start nor end date
  const spacesUnscheduled = spacesWithStartAndEnd.filter(
    (s) => !s.start && !s.end
  );

  return (
    <>
      {spacesActive.length > 0 ? (
        <div className="py-4">
          <h2 className="mb-8 rounded-md bg-[teal] py-2 px-4 text-white">
            Active
          </h2>
          <SpaceList spaces={spacesActive} />
        </div>
      ) : null}
      {spacesStartingFuture.length > 0 ? (
        <div className="py-4">
          <h2 className="mb-8 rounded-md bg-[darkgoldenrod] py-2 px-4 text-white">
            Upcoming
          </h2>
          <SpaceList spaces={spacesStartingFuture} />
        </div>
      ) : null}
      {spacesUnscheduled.length > 0 ? (
        <div className="py-4">
          <h2 className="mb-8 rounded-md bg-[grey] py-2 px-4 text-white">
            Unscheduled
          </h2>
          <SpaceList spaces={spacesUnscheduled} />
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
