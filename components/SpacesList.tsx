import { spaceAPI } from "backend/lib/api";
import { useIndex } from "hooks/useReplicache";
import Link from "next/link";
import useSWR from "swr";
import { Door } from "./Doors";

export const SpaceList = () => {
  let activites = useIndex.aev("space/name");
  return (
    <div>
      {activites?.map((a) => {
        return <Space entity={a.entity} name={a.value} />;
      })}
    </div>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const Space = (props: { entity: string; name: string }) => {
  let studio = useIndex.eav(props.entity, "space/studio");
  let spaceID = useIndex.eav(props.entity, "space/id");
  let lastSeenMessage = useIndex.eav(props.entity, "space/lastSeenMessage");
  let { data: latestMessage } = useSWR(
    `${studio?.value}/${props.name}/latestMessage`,
    async () => {
      if (!spaceID) return;
      let data = await spaceAPI(
        `${WORKER_URL}/space/${spaceID.value}`,
        "get_latest_message",
        {}
      );
      return data.latestMessage;
    }
  );
  return (
    <Link href={`/s/${studio?.value}/s/${props.name}`}>
      <a className="flex flex-row gap-4 pb-8">
        <Door />
        <h3 className="text-xl">{props.name}</h3>
        {latestMessage &&
        lastSeenMessage &&
        lastSeenMessage?.value < latestMessage ? (
          <span>{latestMessage - lastSeenMessage.value} unread</span>
        ) : null}
      </a>
    </Link>
  );
};
