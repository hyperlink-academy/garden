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
  // all spaces
  const spacesAll = useIndex.aev("space/name").sort(sortByPosition("aev"));

  // all space with start / end dates
  const spacesStartingAll = useIndex.at("space/start-date");
  const spacesEndingAll = useIndex.at("space/end-date");

  // explicitly completed spaces
  // NB: could remove if we ONLY calculate completed based on dates
  const spacesExplicitCompleted = useIndex
    .aev("space/completed")
    .sort(sortByPosition("aev"));

  // spaces ending in the future
  const spacesEndingFuture = useIndex.at(
    "space/end-date",
    new Date().toLocaleDateString("en-CA")
  );

  // upcoming:
  // start-date = in future
  // NB: the '+1' part is needed for spaces starting today to show as 'active' not 'upcoming'
  const spacesStartingFuture = useIndex.at(
    "space/start-date",
    new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString(
      "en-CA"
    )
  );

  // active:
  // start-date = in past (NOT in spacesUpcoming)
  // end-date = in future
  const spacesActive = spacesEndingFuture.filter((s) => {
    return !spacesStartingFuture.find((f) => f.entity === s.entity);
  });

  // past:
  // start AND end in past
  // OR start only in past
  // OR end only in past
  // AND NOT explicitly marked "completed"
  // TODO - remove if we simplify completed (calc by dates only vs. explicit setting)
  const spacesPast = spacesAll.filter((s) => {
    return (
      (spacesStartingAll.find((f) => f.entity === s.entity) ||
        spacesEndingAll.find((f) => f.entity === s.entity)) &&
      !spacesActive.find((f) => f.entity === s.entity) &&
      !spacesStartingFuture.find((f) => f.entity === s.entity) &&
      !spacesExplicitCompleted.find((f) => f.entity === s.entity)
    );
  });

  // unscheduled (implicit draft)
  // spaces with NEITHER start nor end date
  // NB: could simplify later if we require both or neither
  // NB: could ALSO avoid explicit 'completed' check if we ONLY calc based on dates
  const spacesUnscheduled = spacesAll.filter((s) => {
    return (
      !spacesStartingAll.find((f) => f.entity === s.entity) &&
      !spacesEndingAll.find((f) => f.entity === s.entity) &&
      !spacesExplicitCompleted.find((f) => f.entity === s.entity)
    );
  });

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
      {spacesPast.length > 0 ? (
        <div className="py-4">
          <h2 className="mb-8 rounded-md bg-[firebrick] py-2 px-4 text-white">
            Past
          </h2>
          <SpaceList spaces={spacesPast} />
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
