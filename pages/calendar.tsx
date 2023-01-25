import { CalendarList } from "components/CalendarList";
import { ReplicacheContext, scanIndex } from "hooks/useReplicache";
import Head from "next/head";
import { useContext } from "react";
import { useSubscribe } from "replicache-react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export default function CalendarPage() {
  return (
    <>
      {/* <HomeHeader /> */}
      <CalendarInfo />
      <List />
      <CalendarCTA />
    </>
  );
}

// copied from history.tsx
// TODO - get actual calendar list (query ALL spaces)
// TODO - render that list w/ different space display

const List = () => {
  let rep = useContext(ReplicacheContext);
  let spaces = useSubscribe(
    rep?.rep,
    async (tx) => {
      let completedSpaces = await scanIndex(tx).aev("space/completed");
      let results = [];
      for (let space of completedSpaces) {
        if (space.value) {
          let name = await scanIndex(tx).eav(space.entity, "space/name");
          if (name !== null) results.push(name);
        }
      }
      return results;
    },
    [],
    []
  );

  return <CalendarList spaces={spaces} />;
};

const CalendarInfo = () => {
  return (
    <>
      <Head>
        <title key="title">hyperlink calendar</title>
        <meta name="theme-color" content="#fffaf0" />
      </Head>
      <div>
        <h1>hyperlink community calendar</h1>
        <div className="py-2">
          <p>
            <span className="text-[blue]">projects</span> ✵{" "}
            <span className="text-[crimson]">experiments</span> ✵{" "}
            <span className="text-[darkgoldenrod]">possibilities</span> ✵{" "}
            <span>🌱</span>
          </p>
        </div>
      </div>
    </>
  );
};

const CalendarCTA = () => {
  return (
    <div className="bg-white p-4 rounded-md border border-dashed border-accent-blue  m-auto mt-8">
      <p>⬆️ Want to add to the Calendar?</p>
      <p>🚀 Publish from your Space settings!</p>
    </div>
  );
};