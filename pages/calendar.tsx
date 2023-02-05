import { workerAPI } from "backend/lib/api";
import { CalendarList } from "components/CalendarList";
import { SpaceProvider } from "components/ReplicacheProvider";
import { useIndex } from "hooks/useReplicache";
import { InferGetStaticPropsType } from "next";
import Head from "next/head";
import { getCurrentDate } from "src/utils";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function CalendarPage(props: Props) {
  if (props.notFound) return <div>404 - studio not found!</div>;
  if (!props.id) return <div>loading </div>;
  return (
    <SpaceProvider id={props.id}>
      <CalendarInfo />
      <List />
      <CalendarCTA />
    </SpaceProvider>
  );
}

// two lists - active and upcoming
const List = () => {
  // spaces ending in the future
  const spacesByEnd = useIndex.at("space/end-date", getCurrentDate());

  // upcoming:
  // start-date = in future
  const spacesUpcoming = useIndex.at("space/start-date", getCurrentDate());

  // active:
  // start-date = in past
  // end-date = in future
  const spacesActive = spacesByEnd.filter((s) => {
    return !spacesUpcoming.find((upcoming) => upcoming.entity === s.entity);
  });

  return (
    <>
      {spacesActive.length > 0 ? (
        <div className="my-4 rounded-lg border border-grey-55">
          <h2 className=" rounded-t-md bg-[steelblue] py-2 px-4 text-white">
            Active
          </h2>
          <div className="p-2 pb-6 sm:p-4 sm:pb-8">
            <CalendarList spaces={spacesActive} />
          </div>
        </div>
      ) : null}
      {spacesUpcoming.length > 0 ? (
        <div className="my-4 rounded-lg border border-grey-55">
          <h2 className=" rounded-t-md bg-[darkgoldenrod] py-2 px-4 text-white">
            Upcoming
          </h2>
          <div className="p-2 pb-6 sm:p-4 sm:pb-8">
            <CalendarList spaces={spacesUpcoming} />
          </div>
        </div>
      ) : null}
    </>
  );
};

const CalendarInfo = () => {
  return (
    <>
      <Head>
        <title key="title">hyperlink calendar</title>
      </Head>
      <div className="flex flex-col gap-4 pb-2 text-sm sm:text-base">
        <h1>hyperlink community calendar</h1>
        {/* <div> */}
        <p>
          <span className="text-[blue]">projects</span> ✵{" "}
          <span className="text-[crimson]">experiments</span> ✵{" "}
          <span className="text-[darkgoldenrod]">possibilities</span> ✵{" "}
          <span>🌱</span>
        </p>
        <p>
          This is a place to see what others are exploring. A kind of campus
          where we can cross paths, peek into adjacent studios, and take
          inspiration back to our own work.
        </p>
        {/* </div> */}
      </div>
    </>
  );
};

const CalendarCTA = () => {
  return (
    <div className="m-auto mt-4 mb-8 rounded-md border border-dashed border-accent-blue  bg-white p-4">
      <p>⬆️ Want to add to the Calendar?</p>
      <p>🚀 Publish from your Space settings!</p>
    </div>
  );
};

export async function getStaticProps() {
  let id = await workerAPI(WORKER_URL, "get_community", {
    name: "hyperlink",
  });

  if (!id.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, id: id.id } };
}
